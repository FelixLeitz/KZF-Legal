const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const { createFileVectorStore, cosineSimilarity } = require("../../rag/storage/fileVectorStore");

describe("rag/storage/fileVectorStore", () => {
  const tempFile = path.join(__dirname, "tmp-vectors.json");

  afterEach(() => {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  });

  it("computes cosine similarity", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).to.equal(1);
    expect(cosineSimilarity([1, 0], [0, 1])).to.equal(0);
  });

  it("stores and searches by namespace", () => {
    const store = createFileVectorStore({ persistPath: tempFile });
    store.upsert([
      { id: "a", namespace: "global", chunk: "alpha", vector: [1, 0] },
      { id: "b", namespace: "user:1", chunk: "beta", vector: [0, 1] },
    ]);

    const results = store.search({
      queryVector: [1, 0],
      limit: 2,
      namespaces: ["global"],
    });

    expect(results.length).to.equal(1);
    expect(results[0].id).to.equal("a");
  });

  it("persists and loads records", () => {
    const storeA = createFileVectorStore({ persistPath: tempFile });
    storeA.upsert([{ id: "x", namespace: "global", chunk: "x", vector: [0.2, 0.8] }]);
    storeA.save();

    const storeB = createFileVectorStore({ persistPath: tempFile });
    storeB.load();
    expect(storeB.all()).to.have.length(1);
    expect(storeB.all()[0].id).to.equal("x");
  });

  it("filters search results by documentIds", () => {
    const store = createFileVectorStore({ persistPath: tempFile });
    store.upsert([
      {
        id: "doc-a:0",
        namespace: "user:1",
        chunk: "alpha",
        vector: [1, 0],
        metadata: { documentId: "doc-a" },
      },
      {
        id: "doc-b:0",
        namespace: "user:1",
        chunk: "beta",
        vector: [1, 0],
        metadata: { documentId: "doc-b" },
      },
    ]);

    const results = store.search({
      queryVector: [1, 0],
      limit: 4,
      namespaces: ["user:1"],
      documentIds: ["doc-a"],
    });

    expect(results).to.have.length(1);
    expect(results[0].metadata.documentId).to.equal("doc-a");
  });

  it("removes records for a document in a namespace", () => {
    const store = createFileVectorStore({ persistPath: tempFile });
    store.upsert([
      {
        id: "doc-a:0",
        namespace: "user:1",
        chunk: "alpha",
        vector: [1, 0],
        metadata: { documentId: "doc-a" },
      },
      {
        id: "doc-b:0",
        namespace: "user:1",
        chunk: "beta",
        vector: [0, 1],
        metadata: { documentId: "doc-b" },
      },
      {
        id: "global:0",
        namespace: "global",
        chunk: "shared",
        vector: [1, 1],
        metadata: { sourceId: "doc-a" },
      },
    ]);

    const removed = store.removeByDocument({
      namespace: "user:1",
      documentId: "doc-a",
    });

    expect(removed).to.equal(1);
    expect(store.all()).to.have.length(2);
    expect(store.all().every((record) => (
      record.namespace !== "user:1" || record.metadata.documentId !== "doc-a"
    ))).to.equal(true);
  });
});
