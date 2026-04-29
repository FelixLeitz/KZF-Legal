# RAG Integration Contract (BE + FE)

This file defines the handoff contract between the Backend team and RAG service.
RAG is consumed as a Node module: `const ragService = require("../rag")`.

## 1) Backend bootstrap (`server/server.js`)

```js
const { Server } = require("socket.io");
const ragService = require("../rag");

const io = new Server(httpServer, {
  cors: { origin: config.ALLOWED_ORIGINS.split(","), credentials: true },
});

io.use(authSocketJWT); // backend-owned
io.on("connection", (socket) => {
  socket.join(`user:${socket.user.id}`);
});

ragService.init({ io });
```

## 2) Query endpoint contract (`POST /api/chat`)

Backend calls:

```js
const { queryId } = await ragService.submitQuery({
  userId: req.user.id,
  question: req.body.question,
});

res.status(202).json({ queryId });
```

### Expected behavior

- HTTP returns immediately with `202`.
- Final answer is delivered asynchronously through Socket.io event `query:result`.
- On failure, RAG emits `query:error` to the same user room.

## 3) Socket event contract for FE

### `query:result`

```json
{
  "queryId": "uuid",
  "answer": "text answer with [1], [2] citations",
  "citations": [
    {
      "id": 1,
      "title": "Source title",
      "source": "vector|web",
      "url": "https://example.com",
      "snippet": "supporting text"
    }
  ],
  "latencyMs": 1234
}
```

### `query:error`

```json
{
  "queryId": "uuid",
  "message": "Unable to generate answer",
  "code": "RAG_ERROR"
}
```

## 4) Document ingestion contract

Backend can index user-uploaded documents:

```js
await ragService.ingestDocument({
  userId: req.user.id,
  docId: documentId,
  text: extractedText,
});
```

Behavior:

- User document chunks are stored under namespace `user:{userId}`.
- Query retrieval reads both `global` corpus + user namespace.

## 5) Contract safety

- Event and API schemas are defined in `rag/schemas/`.
- Contract tests in `tests/rag/contract.test.js` validate emitted payload shapes.
