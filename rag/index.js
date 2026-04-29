const path = require("path");
const { randomUUID } = require("crypto");
const { chunkText } = require("./chunker");
const { embedChunks } = require("./embedder");
const { retrieveWebContext } = require("./webRetriever");
const { buildContext } = require("./contextBuilder");
const { generateAnswer } = require("./generator");
const { createVectorStore } = require("./vectorStore");
const { ingestText } = require("./pipeline");
const {
  SubmitQueryInputSchema,
  SubmitQueryResponseSchema,
  IngestDocumentInputSchema,
} = require("./schemas/api");
const { QueryResultEventSchema, QueryErrorEventSchema } = require("./schemas/events");

const state = {
  io: null,
  chunker: chunkText,
  embedder: embedChunks,
  webRetriever: retrieveWebContext,
  contextBuilder: buildContext,
  generator: generateAnswer,
  vectorStore: createVectorStore({
    persistPath: path.join(__dirname, "data", "vectors.json"),
  }),
};

state.vectorStore.load();

function init({ io } = {}) {
  state.io = io || null;
  return { ready: true };
}

async function ingestDocument({ userId, docId, text }) {
  const input = IngestDocumentInputSchema.parse({ userId, docId, text });
  const namespace = userId ? `user:${userId}` : "global";
  const chunks = await ingestText({
    text: input.text,
    sourceId: input.docId || randomUUID(),
    namespace,
    vectorStore: state.vectorStore,
    chunker: state.chunker,
    embedder: state.embedder,
    metadata: { userId: input.userId || null },
  });
  state.vectorStore.save();
  return { chunks };
}

function emitUserEvent(userId, eventName, payload) {
  if (!state.io) {
    return;
  }
  state.io.to(`user:${userId}`).emit(eventName, payload);
}

async function processQuery({ queryId, userId, question, startedAt }) {
  try {
    const embeddedQuestion = await state.embedder([question]);
    const queryVector = embeddedQuestion[0]?.vector || [];
    const vectorHits = state.vectorStore.search({
      queryVector,
      limit: 4,
      namespaces: ["global", `user:${userId}`],
    });
    const webResults = await state.webRetriever(question);
    const { contextText, citations } = state.contextBuilder({ vectorHits, webResults });
    const answer = await state.generator({ question, contextText });

    const resultPayload = QueryResultEventSchema.parse({
      queryId,
      answer,
      citations,
      latencyMs: Date.now() - startedAt,
    });
    emitUserEvent(userId, "query:result", resultPayload);
  } catch (error) {
    const errorPayload = QueryErrorEventSchema.parse({
      queryId,
      message: error.message || "Unable to process query",
      code: "RAG_ERROR",
    });
    emitUserEvent(userId, "query:error", errorPayload);
  }
}

async function submitQuery({ userId, question }) {
  const input = SubmitQueryInputSchema.parse({ userId, question });
  const queryId = randomUUID();
  const response = SubmitQueryResponseSchema.parse({ queryId });

  setImmediate(() => {
    processQuery({
      queryId,
      userId: input.userId,
      question: input.question,
      startedAt: Date.now(),
    });
  });

  return response;
}

function __setState(nextState = {}) {
  if (Object.hasOwn(nextState, "io")) {
    state.io = nextState.io;
  }
  if (Object.hasOwn(nextState, "vectorStore")) {
    state.vectorStore = nextState.vectorStore;
  }
  if (Object.hasOwn(nextState, "chunker")) {
    state.chunker = nextState.chunker;
  }
  if (Object.hasOwn(nextState, "embedder")) {
    state.embedder = nextState.embedder;
  }
  if (Object.hasOwn(nextState, "webRetriever")) {
    state.webRetriever = nextState.webRetriever;
  }
  if (Object.hasOwn(nextState, "contextBuilder")) {
    state.contextBuilder = nextState.contextBuilder;
  }
  if (Object.hasOwn(nextState, "generator")) {
    state.generator = nextState.generator;
  }
}

module.exports = {
  init,
  ingestDocument,
  submitQuery,
  __setState,
};
