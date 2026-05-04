# RAG Integration Contract (BE + FE) — v2

This contract defines how Backend (BE), Frontend (FE), and RAG communicate.

## 1) Ownership Scope

### RAG owns

- Document text extraction/parsing (file -> text)
- Chunking, embedding, indexing
- Retrieval (vector + web), context assembly
- Answer generation + citations
- Returning structured results to BE

### Backend owns

- Auth, validation, chat/message/document IDs
- Database persistence + status transitions
- Socket rooms/events to FE
- Async orchestration (queue/worker/retry/timeout)

### Frontend owns

- Send HTTP requests
- Render pending/completed/failed states

Listen to BE socket events



---

## 2) Query Flow (Chat)

### FE -> BE

`POST /api/chat`

```json
{
  "query": "What visa options do I have?",
  "chatId": "optional",
  "documentIds": ["optional"]
}
BE immediate response
202 Accepted

{
  "success": true,
  "data": {
    "chatId": "mongoId",
    "messageId": "mongoId",
    "status": "pending"
  }
}
BE -> RAG internal call
const result = await ragService.submitQuery({
  userId,
  question: query,
  documentIds
});
RAG -> BE return shape
{
  "answer": "string",
  "citations": [
    {
      "id": 1,
      "title": "Source title",
      "source": "vector|web",
      "url": "https://example.com",
      "snippet": "supporting text",
      "documentRef": "optional mongo id"
    }
  ],
  "meta": {
    "latencyMs": 1234,
    "model": "claude-3-5-haiku-latest",
    "retrieval": {
      "vectorHits": 4,
      "webHits": 2
    }
  }
}

BE persistence rules
On accept: create Message with status: "pending"
On success:
write response.answer, response.citations
write meta.* (if present)
set status: "completed"
On failure: set status: "failed"

3) Socket Contract (BE -> FE only)
Emit to room user:{userId}.

Event: chat:updated (single event, all states)
Pending
{
  "eventVersion": 1,
  "chatId": "mongoId",
  "messageId": "mongoId",
  "status": "pending"
}
Completed
{
  "eventVersion": 1,
  "chatId": "mongoId",
  "messageId": "mongoId",
  "status": "completed",
  "response": {
    "answer": "string",
    "citations": []
  },
  "meta": {
    "latencyMs": 1234,
    "model": "string"
  }
}
Failed
{
  "eventVersion": 1,
  "chatId": "mongoId",
  "messageId": "mongoId",
  "status": "failed",
  "error": {
    "code": "RAG_ERROR",
    "message": "Unable to process query"
  }
}

4) Document Ingestion Flow
FE -> BE
POST /api/documents (multipart upload)

BE immediate response
202 Accepted

{
  "success": true,
  "data": {
    "documentId": "mongoId",
    "chatId": "mongoId",
    "status": "pending"
  }
}

BE -> RAG internal call
const ingest = await ragService.ingestDocument({
  userId,
  documentId,
  filePath,   // preferred
  mimeType
});
RAG -> BE return shape
{
  "chunks": 42,
  "extractedSummary": "optional",
  "meta": {
    "ingestMs": 980
  }
}
BE behavior
Update document status: pending -> processing -> ingested|failed
Emit document:updated with same eventVersion pattern

5) Error Contract (RAG -> BE)
RAG throws typed errors:
{
  "code": "RAG_VALIDATION_ERROR|RAG_UPSTREAM_ERROR|RAG_TIMEOUT|RAG_INTERNAL",
  "message": "human readable",
  "retryable": true
}
BE maps to safe FE errors + DB status updates.

6) Data Consistency Rules (Mandatory)
Message.status only: pending | completed | failed
Response fields only under:
Message.response.answer
Message.response.citations
No top-level answer/citations writes
No mixed legacy event names

7) Migration Notes
Deprecated:
query:result, query:error
chat:response, chat:error
RAG Socket.io emission (init({ io }) style coupling)

Target:
BE-only emit: chat:updated, document:updated
RAG pure function/service returns structured data

8) Minimum Tests Required
RAG unit contract tests (submitQuery, ingestDocument return shapes)
BE integration tests (DB update + socket emit on success/failure)
E2E async chat test (POST /api/chat -> socket chat:updated)
```

