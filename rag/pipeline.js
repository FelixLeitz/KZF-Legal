const fs = require("fs");
const path = require("path");
const { chunkText } = require("./chunker");
const { embedChunks } = require("./embedder");

function readCorpusFiles(corpusDir) {
  if (!fs.existsSync(corpusDir)) {
    return [];
  }

  return fs.readdirSync(corpusDir)
    .filter((file) => [".txt", ".md"].includes(path.extname(file).toLowerCase()))
    .map((file) => {
      const fullPath = path.join(corpusDir, file);
      return {
        sourceId: file,
        text: fs.readFileSync(fullPath, "utf8"),
      };
    });
}

async function ingestText({
  text,
  sourceId,
  namespace = "global",
  metadata = {},
  vectorStore,
  chunker = chunkText,
  embedder = embedChunks,
}) {
  const chunks = chunker(text);
  const embedded = await embedder(chunks);
  const records = embedded.map((item, index) => ({
    id: `${sourceId}:${index}`,
    namespace,
    chunk: item.chunk,
    vector: item.vector,
    metadata: { sourceId, chunkIndex: index, ...metadata },
  }));
  vectorStore.upsert(records);
  return records.length;
}

async function ingestCorpusDirectory({
  corpusDir = path.join(__dirname, "corpus"),
  namespace = "global",
  vectorStore,
  chunker = chunkText,
  embedder = embedChunks,
}) {
  const files = readCorpusFiles(corpusDir);
  let total = 0;

  for (const file of files) {
    total += await ingestText({
      text: file.text,
      sourceId: file.sourceId,
      namespace,
      vectorStore,
      chunker,
      embedder,
      metadata: { sourceType: "corpus" },
    });
  }

  return {
    files: files.length,
    chunks: total,
  };
}

module.exports = {
  ingestText,
  ingestCorpusDirectory,
  readCorpusFiles,
};
