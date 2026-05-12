const path = require("path");
const { createVectorStore } = require("./vectorStore");
const { createMongoVectorStore } = require("./mongoVectorStore");

function createDefaultVectorStore(options = {}) {
  const mongoUri = options.mongoUri ?? process.env.RAG_MONGODB_URI;
  if (mongoUri) {
    return createMongoVectorStore({ uri: mongoUri });
  }

  return createVectorStore({
    persistPath: options.persistPath || path.join(__dirname, "data", "vectors.json"),
  });
}

module.exports = {
  createDefaultVectorStore,
  createVectorStore,
  createMongoVectorStore,
};
