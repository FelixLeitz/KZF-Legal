const fs = require("fs/promises");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const WordExtractor = require("word-extractor");

const MIME_BY_EXTENSION = {
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const SUPPORTED_MIME_TYPES = new Set(Object.values(MIME_BY_EXTENSION));

function makeValidationError(message) {
  const err = new Error(message);
  err.code = "RAG_VALIDATION_ERROR";
  err.retryable = false;
  return err;
}

function resolveMimeType(mimeType, filePath) {
  if (mimeType) {
    return mimeType;
  }

  return MIME_BY_EXTENSION[path.extname(filePath).toLowerCase()] || null;
}

async function extractPlainText(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function extractPdfText(filePath) {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
}

async function extractDocText(filePath) {
  const extractor = new WordExtractor();
  const extracted = await extractor.extract(filePath);
  return extracted.getBody() || "";
}

async function extractDocumentText({ filePath, mimeType }) {
  const resolvedMimeType = resolveMimeType(mimeType, filePath);

  if (!resolvedMimeType || !SUPPORTED_MIME_TYPES.has(resolvedMimeType)) {
    throw makeValidationError(
      `Unsupported document type${resolvedMimeType ? `: ${resolvedMimeType}` : ""}`,
    );
  }

  let text;
  try {
    switch (resolvedMimeType) {
      case "text/plain":
        text = await extractPlainText(filePath);
        break;
      case "application/pdf":
        text = await extractPdfText(filePath);
        break;
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        text = await extractDocxText(filePath);
        break;
      case "application/msword":
        text = await extractDocText(filePath);
        break;
      default:
        throw makeValidationError(`Unsupported document type: ${resolvedMimeType}`);
    }
  } catch (err) {
    if (err.code === "RAG_VALIDATION_ERROR") {
      throw err;
    }

    if (err.code === "ENOENT") {
      throw makeValidationError(`Cannot read file: ${err.message}`);
    }

    throw makeValidationError(`Failed to extract text: ${err.message}`);
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    throw makeValidationError("No extractable text found in document");
  }

  return normalized;
}

module.exports = {
  extractDocumentText,
  resolveMimeType,
  SUPPORTED_MIME_TYPES,
};
