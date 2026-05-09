/* eslint-disable no-console */
const path = require("path");
const dotenv = require("dotenv");
const { createVectorStore } = require("../vectorStore");
const { ingestCorpusDirectory } = require("../pipeline");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

async function run() {
  const vectorStore = createVectorStore({
    persistPath: path.join(__dirname, "..", "data", "vectors.json"),
  });
  vectorStore.load();

  const result = await ingestCorpusDirectory({
    corpusDir: path.join(__dirname, "..", "corpus"),
    vectorStore,
  });

  vectorStore.save();
  console.log(`Ingested ${result.files} files and ${result.chunks} chunks.`);
}

run().catch((error) => {
  console.error("Ingestion failed:", error.message);
  process.exit(1);
});
