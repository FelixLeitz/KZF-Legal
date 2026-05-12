const fs = require("fs");
const path = require("path");
const { chunkText } = require("./chunker");
const { embedChunks } = require("./embedder");
const { retrieveWebContext } = require("./webRetriever");
const { buildContext } = require("./contextBuilder");
const { generateAnswer, MODEL } = require("./generator");
const { createVectorStore } = require("./vectorStore");
const { ingestText } = require("./pipeline");
const {
  SubmitQueryInputSchema,
  SubmitQueryResponseSchema,
  IngestDocumentInputSchema,
  IngestDocumentResponseSchema,
} = require("./schemas/api");

const _defaultFns = {
  chunker: chunkText,
  embedder: embedChunks,
  webRetriever: retrieveWebContext,
  contextBuilder: buildContext,
  generator: generateAnswer,
};

const state = {
  ..._defaultFns,
  vectorStore: createVectorStore({
    persistPath: path.join(__dirname, "data", "vectors.json"),
  }),
};

state.vectorStore.load();

function init() {
  return { ready: true };
}

function makeRagError(code, message, retryable = false) {
  const err = new Error(message);
  err.code = code;
  err.retryable = retryable;
  return err;
}

async function ingestDocument({ userId, documentId, filePath, mimeType }) {
  const input = IngestDocumentInputSchema.parse({ userId, documentId, filePath, mimeType });
  const startedAt = Date.now();

  let text;
  try {
    text = fs.readFileSync(input.filePath, "utf8");
  } catch (err) {
    throw makeRagError("RAG_VALIDATION_ERROR", `Cannot read file: ${err.message}`, false);
  }

  const namespace = `user:${input.userId}`;
  const chunks = await ingestText({
    text,
    sourceId: input.documentId,
    namespace,
    vectorStore: state.vectorStore,
    chunker: state.chunker,
    embedder: state.embedder,
    metadata: { userId: input.userId, documentId: input.documentId },
  });
  state.vectorStore.save();

  return IngestDocumentResponseSchema.parse({
    chunks,
    extractedSummary: null,
    meta: { ingestMs: Date.now() - startedAt },
  });
}

async function submitQuery({ userId, question, documentIds }) {
  const input = SubmitQueryInputSchema.parse({ userId, question, documentIds });
  const startedAt = Date.now();

  let embeddedQuestion;
  try {
    embeddedQuestion = await state.embedder([input.question]);
  } catch (err) {
    throw makeRagError("RAG_UPSTREAM_ERROR", "Embedding service unavailable", true);
  }

  const queryVector = embeddedQuestion[0]?.vector || [];
  const scopedDocumentIds = input.documentIds?.length ? input.documentIds : null;
  const vectorHits = state.vectorStore.search({
    queryVector,
    limit: 4,
    namespaces: scopedDocumentIds
      ? [`user:${input.userId}`]
      : ["global", `user:${input.userId}`],
    documentIds: scopedDocumentIds,
  });

  let webResponse;
  try {
    webResponse = await state.webRetriever(input.question);
  } catch {
    webResponse = { sources: [] };
  }
  const webResults = webResponse.sources || [];

  const { contextText, citations } = state.contextBuilder({ vectorHits, webResults });

  let answer;
  try {
    answer = await state.generator({ question: input.question, contextText });
  } catch (err) {
    const detail = err?.message ? `: ${err.message}` : "";
    throw makeRagError("RAG_UPSTREAM_ERROR", `LLM service unavailable${detail}`, true);
  }

  return SubmitQueryResponseSchema.parse({
    answer,
    citations,
    meta: {
      latencyMs: Date.now() - startedAt,
      model: MODEL,
      retrieval: {
        vectorHits: vectorHits.length,
        webHits: webResults.length,
      },
    },
  });
}

function __setState(nextState = {}) {
  const keys = ["vectorStore", "chunker", "embedder", "webRetriever", "contextBuilder", "generator"];
  for (const key of keys) {
    if (Object.hasOwn(nextState, key)) {
      state[key] = nextState[key];
    }
  }
}

function __resetState() {
  Object.assign(state, _defaultFns);
}

module.exports = { init, ingestDocument, submitQuery, __setState, __resetState };
