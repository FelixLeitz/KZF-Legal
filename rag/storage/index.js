const { createFileVectorStore, cosineSimilarity } = require("./fileVectorStore");
const { createMongoVectorStore } = require("./mongoVectorStore");

function createDefaultVectorStore(options = {}) {
  const mongoUri = options.mongoUri ?? process.env.RAG_MONGODB_URI;
  if (!mongoUri) {
    throw new Error("RAG_MONGODB_URI is required");
  }

  return createMongoVectorStore({ uri: mongoUri });
}

module.exports = {
  createDefaultVectorStore,
  createFileVectorStore,
  createMongoVectorStore,
  cosineSimilarity,
};
