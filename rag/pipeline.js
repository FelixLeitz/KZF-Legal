const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const { chunkText } = require("./chunker");
const { embedChunks } = require("./embedder");

async function extractPdfText(fullPath) {
  const buffer = fs.readFileSync(fullPath);
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text || "";
  } finally {
    await parser.destroy();
  }
}

async function readCorpusFiles(corpusDir) {
  if (!fs.existsSync(corpusDir)) {
    return [];
  }

  const files = fs.readdirSync(corpusDir)
    .filter((file) => [".txt", ".md", ".pdf"].includes(path.extname(file).toLowerCase()));

  return Promise.all(files.map(async (file) => {
    const fullPath = path.join(corpusDir, file);
    const ext = path.extname(file).toLowerCase();
    const text = ext === ".pdf"
      ? await extractPdfText(fullPath)
      : fs.readFileSync(fullPath, "utf8");

    return {
      sourceId: file,
      text,
    };
  }));
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
  await Promise.resolve(vectorStore.upsert(records));
  return records.length;
}

async function ingestCorpusDirectory({
  corpusDir = path.join(__dirname, "corpus"),
  namespace = "global",
  vectorStore,
  chunker = chunkText,
  embedder = embedChunks,
}) {
  const files = await readCorpusFiles(corpusDir);
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
