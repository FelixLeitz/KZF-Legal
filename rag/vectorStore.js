const fs = require("fs");
const path = require("path");

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function recordDocumentId(record) {
  return record.metadata?.documentId ?? record.metadata?.sourceId ?? null;
}

function createVectorStore(options = {}) {
  const persistPath = options.persistPath || path.join(__dirname, "data", "vectors.json");
  let records = [];

  function load() {
    if (!fs.existsSync(persistPath)) {
      records = [];
      return records;
    }

    const raw = fs.readFileSync(persistPath, "utf8");
    const parsed = JSON.parse(raw || "[]");
    records = Array.isArray(parsed) ? parsed : [];
    return records;
  }

  function save() {
    ensureParentDir(persistPath);
    fs.writeFileSync(persistPath, JSON.stringify(records, null, 2));
  }

  function upsert(items = []) {
    const incoming = items.map((item) => ({
      id: item.id,
      namespace: item.namespace || "global",
      vector: item.vector || [],
      chunk: item.chunk || "",
      metadata: item.metadata || {},
    }));

    for (const item of incoming) {
      const existingIndex = records.findIndex((record) => (
        record.id === item.id && record.namespace === item.namespace
      ));
      if (existingIndex >= 0) {
        records[existingIndex] = item;
      } else {
        records.push(item);
      }
    }

    return records.length;
  }

  function search({
    queryVector = [],
    limit = 5,
    namespaces = ["global"],
    documentIds = null,
  } = {}) {
    if (!queryVector.length) {
      return [];
    }

    const scopedDocumentIds = Array.isArray(documentIds) && documentIds.length
      ? new Set(documentIds)
      : null;

    return records
      .filter((record) => namespaces.includes(record.namespace))
      .filter((record) => {
        if (!scopedDocumentIds) {
          return true;
        }

        const documentId = recordDocumentId(record);
        return documentId != null && scopedDocumentIds.has(documentId);
      })
      .map((record) => ({
        ...record,
        score: cosineSimilarity(queryVector, record.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  function removeByDocument({ namespace, documentId }) {
    const before = records.length;

    records = records.filter((record) => {
      if (record.namespace !== namespace) {
        return true;
      }

      return recordDocumentId(record) !== documentId;
    });

    return before - records.length;
  }

  function all() {
    return [...records];
  }

  function clear() {
    records = [];
  }

  return {
    upsert,
    search,
    removeByDocument,
    save,
    load,
    all,
    clear,
  };
}

module.exports = {
  createVectorStore,
  cosineSimilarity,
};
