/* eslint-disable no-console */
const path = require("path");
const dotenv = require("dotenv");
const { createDefaultVectorStore } = require("../storage");
const { ingestCorpusDirectory } = require("../pipeline");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

async function run() {
  const vectorStore = createDefaultVectorStore();
  await Promise.resolve(vectorStore.load());

  const result = await ingestCorpusDirectory({
    corpusDir: path.join(__dirname, "..", "corpus"),
    vectorStore,
  });

  await Promise.resolve(vectorStore.save());
  console.log(`Ingested ${result.files} files and ${result.chunks} chunks.`);
}

run().catch((error) => {
  console.error("Ingestion failed:", error.message);
  process.exit(1);
});
