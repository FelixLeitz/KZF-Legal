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

function recordDocumentId(record) {
  return record.metadata?.documentId ?? record.metadata?.sourceId ?? null;
}

function searchRecords(
  records,
  { queryVector = [], limit = 5, namespaces = ["global"], documentIds = null } = {},
) {
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

module.exports = {
  cosineSimilarity,
  recordDocumentId,
  searchRecords,
};
