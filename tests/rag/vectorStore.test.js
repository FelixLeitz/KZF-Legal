const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const { createVectorStore, cosineSimilarity } = require("../../rag/vectorStore");

describe("rag/vectorStore", () => {
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
    const store = createVectorStore({ persistPath: tempFile });
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
    const storeA = createVectorStore({ persistPath: tempFile });
    storeA.upsert([{ id: "x", namespace: "global", chunk: "x", vector: [0.2, 0.8] }]);
    storeA.save();

    const storeB = createVectorStore({ persistPath: tempFile });
    storeB.load();
    expect(storeB.all()).to.have.length(1);
    expect(storeB.all()[0].id).to.equal("x");
  });
});
