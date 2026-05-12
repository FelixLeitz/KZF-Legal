const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const sinon = require("sinon");
const { createFileVectorStore } = require("../../rag/storage/fileVectorStore");
const { ingestText, ingestCorpusDirectory } = require("../../rag/pipeline");

describe("rag/pipeline", () => {
  const tempVectors = path.join(__dirname, "tmp-pipeline-vectors.json");
  const tempCorpusDir = path.join(__dirname, "tmp-corpus");

  afterEach(() => {
    if (fs.existsSync(tempVectors)) {
      fs.unlinkSync(tempVectors);
    }
    if (fs.existsSync(tempCorpusDir)) {
      fs.rmSync(tempCorpusDir, { recursive: true, force: true });
    }
  });

  it("ingests text into vector store", async () => {
    const vectorStore = createFileVectorStore({ persistPath: tempVectors });
    const chunker = sinon.stub().returns(["chunk-a", "chunk-b"]);
    const embedder = sinon.stub().resolves([
      { id: 0, chunk: "chunk-a", vector: [1, 0] },
      { id: 1, chunk: "chunk-b", vector: [0, 1] },
    ]);

    const count = await ingestText({
      text: "raw text",
      sourceId: "doc1",
      namespace: "global",
      vectorStore,
      chunker,
      embedder,
    });

    expect(count).to.equal(2);
    expect(vectorStore.all()).to.have.length(2);
    expect(vectorStore.all()[0].id).to.equal("doc1:0");
  });

  it("ingests txt and md files from corpus directory", async () => {
    fs.mkdirSync(tempCorpusDir, { recursive: true });
    fs.writeFileSync(path.join(tempCorpusDir, "a.txt"), "alpha");
    fs.writeFileSync(path.join(tempCorpusDir, "b.md"), "beta");
    fs.writeFileSync(path.join(tempCorpusDir, "skip.json"), "{}");

    const vectorStore = createFileVectorStore({ persistPath: tempVectors });
    const chunker = sinon.stub().callsFake((value) => [value]);
    const embedder = sinon.stub().callsFake(async (chunks) => chunks.map((chunk) => ({
      id: 0,
      chunk,
      vector: [chunk.length],
    })));

    const result = await ingestCorpusDirectory({
      corpusDir: tempCorpusDir,
      vectorStore,
      chunker,
      embedder,
    });

    expect(result.files).to.equal(2);
    expect(result.chunks).to.equal(2);
    expect(vectorStore.all()).to.have.length(2);
  });
});
