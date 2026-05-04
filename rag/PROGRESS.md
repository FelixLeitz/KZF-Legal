# RAG Implementation Progress

Last updated: 2026-05-05

---

## Sprint 1 — Foundation (incomplete)

### Done

- `rag/chunker.js` — configurable chunk size/overlap, separator-aware splitting. ✅
- `rag/embedder.js` — OpenAI `text-embedding-3-small` wrapper, batching + retry. ✅
- `rag/vectorStore.js` — in-memory store, namespace support, cosine similarity, JSON persistence. ✅
- `rag/pipeline.js` — `ingestText(...)`, `ingestCorpusDirectory(...)`, corpus file reader. ✅
- `rag/scripts/ingest.js` — corpus ingestion CLI. ✅
- `rag/index.js` — v1 facade skeleton (to be replaced in Sprint 2). ✅
- `rag/schemas/api.js` — v1 Zod schemas (to be updated in Sprint 2). ✅
- `rag/schemas/events.js` — v1 event schemas (to be deprecated in Sprint 2). ✅
- `rag/INTEGRATION.md` — updated to v2 contract. ✅
- `rag/webRetriever.js` — stub only, correct signature. ✅
- `rag/contextBuilder.js` — stub only, wrong return shape. ⚠️

### Gaps (blocking tests from running)

- `openai` package not in `package.json` — `embedder.js` crashes on load. ❌
- `@anthropic-ai/sdk` package not in `package.json` — needed for Sprint 2. ❌
- `rag/generator.js` — file missing; `index.js` crashes on `require('./generator')`. ❌

### Tests (written but not verified runnable)

- `tests/rag/chunker.test.js` — likely passes once deps installed. ⚠️
- `tests/rag/embedder.test.js` — blocked by missing `openai` package. ❌
- `tests/rag/vectorStore.test.js` — likely passes once deps installed. ⚠️
- `tests/rag/pipeline.test.js` — blocked by missing `openai` package. ❌
- `tests/rag/ragService.test.js` — blocked by missing `generator.js`; also has v1 assertions to be rewritten in Sprint 2. ❌

---

## Sprint 2 — v2 Migration + Complete Sprint 1 Gaps

### Fix Sprint 1 gaps first

- Add `openai` and `@anthropic-ai/sdk` to `package.json`.
- Create `rag/generator.js` — Anthropic Claude wrapper (`generateAnswer({ question, contextText })`).

### v2 Architecture changes

The v2 contract (`INTEGRATION.md`) makes RAG a pure service — no socket coupling. BE owns async orchestration and socket emission.

**Create:**
- `rag/extractor.js` — file-to-text extraction (`extractText({ filePath, mimeType })`). Handles `.txt` / `.md`; throws typed `RAG_VALIDATION_ERROR` for unsupported types.

**Rewrite:**
- `rag/contextBuilder.js` — fix to accept `{ vectorHits, webResults }`, return `{ contextText, citations }`.
- `rag/index.js` — remove socket coupling; `submitQuery` returns `{ answer, citations, meta }` directly; `ingestDocument` takes `{ userId, documentId, filePath, mimeType }` and returns `{ chunks, extractedSummary, meta: { ingestMs } }`; typed error throws.
- `rag/schemas/api.js` — update all 4 schemas to v2 shapes.
- `rag/schemas/events.js` — deprecate event schemas; `CitationSchema` moves to `api.js`.

### Tests to rewrite / add

- `tests/rag/ragService.test.js` — rewrite: assert on return values, not socket emissions.
- `tests/rag/contextBuilder.test.js` — new.
- `tests/rag/generator.test.js` — new.
- `tests/rag/contract.test.js` — new: Zod schema contract assertions.

### Remaining after Sprint 2

- `rag/webRetriever.js` — real Tavily HTTP integration (currently stub).
- `tests/rag/webRetriever.test.js` — unit test for Tavily integration.
- `rag/scripts/eval.js` + `rag/eval/qa.json` — 10-question eval harness.
- Coverage setup (`nyc`, `npm run test:coverage`).
- Shared updates: `package.json` scripts, `.env.example`, `.gitignore`, `README.md`.
