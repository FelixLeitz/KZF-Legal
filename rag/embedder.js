const OpenAI = require("openai");

const DEFAULT_EMBED_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small";
const DEFAULT_BATCH_SIZE = 16;
const DEFAULT_RETRY_COUNT = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedBatch({ client, model, batch, retryCount }) {
  let error;
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await client.embeddings.create({
        model,
        input: batch,
      });
      return response.data.map((item) => item.embedding);
    } catch (err) {
      error = err;
      if (attempt < retryCount) {
        await sleep(200 * (attempt + 1));
      }
    }
  }

  throw error;
}

function createEmbedder(options = {}) {
  const client = options.client || new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = options.model || DEFAULT_EMBED_MODEL;
  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
  const retryCount = options.retryCount ?? DEFAULT_RETRY_COUNT;

  async function embedChunks(chunks = []) {
    if (!chunks.length) {
      return [];
    }

    const vectors = [];
    for (let index = 0; index < chunks.length; index += batchSize) {
      const batch = chunks.slice(index, index + batchSize);
      const embedded = await embedBatch({ client, model, batch, retryCount });
      vectors.push(...embedded);
    }

    return chunks.map((chunk, index) => ({
      id: index,
      chunk,
      vector: vectors[index],
    }));
  }

  return {
    embedChunks,
  };
}

const defaultEmbedder = createEmbedder();

module.exports = {
  createEmbedder,
  embedChunks: defaultEmbedder.embedChunks,
  DEFAULT_EMBED_MODEL,
};
