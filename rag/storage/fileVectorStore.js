const fs = require("fs");
const path = require("path");
const { cosineSimilarity, recordDocumentId, searchRecords } = require("./vectorSearch");

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createFileVectorStore({ persistPath }) {
  if (!persistPath) {
    throw new Error("persistPath is required for the file vector store");
  }

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

  function search(searchOptions) {
    return searchRecords(records, searchOptions);
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
  createFileVectorStore,
  cosineSimilarity,
};
