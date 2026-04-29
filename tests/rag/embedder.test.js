const { expect } = require("chai");
const sinon = require("sinon");
const { createEmbedder } = require("../../rag/embedder");

describe("rag/embedder", () => {
  it("returns empty array for empty chunks", async () => {
    const client = {
      embeddings: {
        create: sinon.stub(),
      },
    };
    const embedder = createEmbedder({ client });

    const result = await embedder.embedChunks([]);
    expect(result).to.deep.equal([]);
    expect(client.embeddings.create.called).to.be.false;
  });

  it("embeds chunks in batches", async () => {
    const create = sinon.stub();
    create.onFirstCall().resolves({
      data: [{ embedding: [0.1, 0.2] }, { embedding: [0.3, 0.4] }],
    });
    create.onSecondCall().resolves({
      data: [{ embedding: [0.5, 0.6] }],
    });

    const embedder = createEmbedder({
      client: { embeddings: { create } },
      batchSize: 2,
      retryCount: 0,
    });

    const result = await embedder.embedChunks(["a", "b", "c"]);

    expect(result).to.deep.equal([
      { id: 0, chunk: "a", vector: [0.1, 0.2] },
      { id: 1, chunk: "b", vector: [0.3, 0.4] },
      { id: 2, chunk: "c", vector: [0.5, 0.6] },
    ]);
    expect(create.callCount).to.equal(2);
  });

  it("retries failed requests", async () => {
    const create = sinon.stub();
    create.onFirstCall().rejects(new Error("rate limit"));
    create.onSecondCall().resolves({
      data: [{ embedding: [1, 2, 3] }],
    });

    const embedder = createEmbedder({
      client: { embeddings: { create } },
      retryCount: 1,
    });

    const result = await embedder.embedChunks(["x"]);
    expect(result[0].vector).to.deep.equal([1, 2, 3]);
    expect(create.callCount).to.equal(2);
  });
});
