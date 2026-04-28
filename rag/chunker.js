const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_OVERLAP = 100;
const DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", " "];

function normalizeText(text) {
  return String(text || "").trim();
}

function splitByBestSeparator(text, separators, chunkSize) {
  for (const separator of separators) {
    if (!text.includes(separator)) {
      continue;
    }

    const parts = text.split(separator).map((part) => part.trim()).filter(Boolean);
    const maxPartLength = parts.reduce((maxLength, part) => Math.max(maxLength, part.length), 0);
    if (maxPartLength <= chunkSize) {
      return parts.map((part, index) => (
        separator === " "
          ? part
          : `${part}${index < parts.length - 1 ? separator.trimEnd() : ""}`.trim()
      ));
    }
  }

  return null;
}

function chunkText(text, options = {}) {
  const value = normalizeText(text);
  if (!value) {
    return [];
  }

  const chunkSize = Math.max(1, options.chunkSize || DEFAULT_CHUNK_SIZE);
  const overlap = Math.max(0, Math.min(options.overlap ?? DEFAULT_OVERLAP, chunkSize - 1));
  const separators = options.separators || DEFAULT_SEPARATORS;

  if (value.length <= chunkSize) {
    return [value];
  }

  const splitParts = splitByBestSeparator(value, separators, chunkSize);
  if (splitParts) {
    const chunks = [];
    let current = "";

    for (const part of splitParts) {
      const next = current ? `${current} ${part}` : part;
      if (next.length <= chunkSize) {
        current = next;
        continue;
      }

      if (current) {
        chunks.push(current.trim());
      }
      current = part;
    }

    if (current) {
      chunks.push(current.trim());
    }

    if (chunks.length) {
      return chunks;
    }
  }

  const chunks = [];
  const step = chunkSize - overlap;
  for (let start = 0; start < value.length; start += step) {
    chunks.push(value.slice(start, start + chunkSize));
  }

  return chunks;
}

module.exports = {
  chunkText,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_OVERLAP,
};
