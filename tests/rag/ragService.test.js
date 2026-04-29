const { expect } = require("chai");
const sinon = require("sinon");
const ragService = require("../../rag");

describe("rag/index", () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    ragService.__setState({ io: null });
    clock.restore();
  });

  it("initializes with io instance", () => {
    const io = {};
    const result = ragService.init({ io });
    expect(result.ready).to.equal(true);
  });

  it("ingests user document into user namespace", async () => {
    const vectorStore = {
      upsert: sinon.stub().returns(1),
      save: sinon.stub(),
    };
    ragService.__setState({
      vectorStore,
      chunker: sinon.stub().returns(["visa text"]),
      embedder: sinon.stub().resolves([{ id: 0, chunk: "visa text", vector: [1, 0] }]),
    });

    const result = await ragService.ingestDocument({
      userId: "u1",
      docId: "doc-1",
      text: "visa text",
    });

    expect(result.chunks).to.be.greaterThan(0);
    expect(vectorStore.upsert.called).to.equal(true);
    expect(vectorStore.save.calledOnce).to.equal(true);
  });

  it("returns queryId for submitQuery stub", async () => {
    const emit = sinon.stub();
    const io = { to: sinon.stub().returns({ emit }) };
    ragService.init({ io });
    ragService.__setState({
      embedder: sinon.stub().resolves([{ vector: [1, 0], chunk: "question" }]),
      vectorStore: {
        search: sinon.stub().returns([{ chunk: "doc chunk", score: 0.9, metadata: { sourceId: "doc-a" }]),
      },
      webRetriever: sinon.stub().resolves([]),
      contextBuilder: sinon.stub().returns({
        contextText: "[1] doc chunk",
        citations: [{ id: 1, title: "doc-a", source: "vector", snippet: "doc chunk" }],
      }),
      generator: sinon.stub().resolves("Answer [1]"),
    });

    const result = await ragService.submitQuery({
      userId: "u1",
      question: "What are subclass 500 requirements?",
    });
    expect(result.queryId).to.be.a("string");
    await clock.runAllAsync();
    expect(io.to.calledWith("user:u1")).to.equal(true);
    expect(emit.calledWith("query:result")).to.equal(true);
  });

  it("emits query:error when processing fails", async () => {
    const emit = sinon.stub();
    const io = { to: sinon.stub().returns({ emit }) };
    ragService.init({ io });
    ragService.__setState({
      embedder: sinon.stub().rejects(new Error("embedding failed")),
    });

    const result = await ragService.submitQuery({
      userId: "u1",
      question: "Can I extend my visa?",
    });
    expect(result.queryId).to.be.a("string");
    await clock.runAllAsync();
    expect(emit.calledWith("query:error")).to.equal(true);
  });
});
