const fs = require("fs");
const os = require("os");
const path = require("path");
const { expect } = require("chai");
const sinon = require("sinon");
const ragService = require("../../rag");

describe("ragService (v2)", () => {
  afterEach(() => {
    ragService.__resetState();
  });

  describe("init", () => {
    it("returns ready:true", () => {
      expect(ragService.init().ready).to.equal(true);
    });

    it("ignores io argument (v2 — BE owns sockets)", () => {
      expect(ragService.init({ io: {} }).ready).to.equal(true);
    });
  });

  describe("ingestDocument", () => {
    let tmpFile;

    beforeEach(() => {
      tmpFile = path.join(os.tmpdir(), `rag-test-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, "visa subclass 500 requirements text");
    });

    afterEach(() => {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });

    it("ingests a file and returns chunks + meta", async () => {
      const vectorStore = { upsert: sinon.stub(), save: sinon.stub() };
      ragService.__setState({
        vectorStore,
        chunker: sinon.stub().returns(["visa text"]),
        embedder: sinon.stub().resolves([{ chunk: "visa text", vector: [1, 0] }]),
      });

      const result = await ragService.ingestDocument({
        userId: "u1",
        documentId: "doc-1",
        filePath: tmpFile,
        mimeType: "text/plain",
      });

      expect(result.chunks).to.equal(1);
      expect(result.meta).to.have.property("ingestMs");
      expect(vectorStore.save.calledOnce).to.equal(true);
    });

    it("throws RAG_VALIDATION_ERROR when file does not exist", async () => {
      try {
        await ragService.ingestDocument({
          userId: "u1",
          documentId: "doc-1",
          filePath: "/nonexistent/path.txt",
          mimeType: "text/plain",
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err.code).to.equal("RAG_VALIDATION_ERROR");
        expect(err.retryable).to.equal(false);
      }
    });
  });

  describe("submitQuery", () => {
    it("returns answer, citations, and meta", async () => {
      ragService.__setState({
        embedder: sinon.stub().resolves([{ vector: [1, 0], chunk: "question" }]),
        vectorStore: {
          search: sinon.stub().returns([{
            id: "doc:0",
            chunk: "subclass 500 info",
            score: 0.9,
            metadata: { sourceId: "doc-a" },
            namespace: "global",
            vector: [],
          }]),
        },
        webRetriever: sinon.stub().resolves({ query: "q", sources: [] }),
        contextBuilder: sinon.stub().returns({
          contextText: "[1] subclass 500 info",
          citations: [{ id: 1, title: "doc-a", source: "vector", snippet: "subclass 500 info" }],
        }),
        generator: sinon.stub().resolves("You need X for subclass 500 [1]"),
      });

      const result = await ragService.submitQuery({
        userId: "u1",
        question: "What are subclass 500 requirements?",
      });

      expect(result.answer).to.be.a("string");
      expect(result.citations).to.be.an("array").with.length(1);
      expect(result.meta.retrieval.vectorHits).to.equal(1);
      expect(result.meta.retrieval.webHits).to.equal(0);
      expect(result.meta).to.have.property("model");
      expect(result.meta).to.have.property("latencyMs");
    });

    it("throws RAG_UPSTREAM_ERROR when embedding fails", async () => {
      ragService.__setState({
        embedder: sinon.stub().rejects(new Error("OpenAI unreachable")),
      });

      try {
        await ragService.submitQuery({
          userId: "u1",
          question: "Can I extend my visa?",
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err.code).to.equal("RAG_UPSTREAM_ERROR");
        expect(err.retryable).to.equal(true);
      }
    });

    it("throws RAG_UPSTREAM_ERROR when generator fails", async () => {
      ragService.__setState({
        embedder: sinon.stub().resolves([{ vector: [1, 0], chunk: "q" }]),
        vectorStore: { search: sinon.stub().returns([]) },
        webRetriever: sinon.stub().resolves({ query: "q", sources: [] }),
        contextBuilder: sinon.stub().returns({ contextText: "some context", citations: [] }),
        generator: sinon.stub().rejects(new Error("Claude unavailable")),
      });

      try {
        await ragService.submitQuery({
          userId: "u1",
          question: "Can I extend my visa?",
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err.code).to.equal("RAG_UPSTREAM_ERROR");
        expect(err.retryable).to.equal(true);
      }
    });
  });
});
