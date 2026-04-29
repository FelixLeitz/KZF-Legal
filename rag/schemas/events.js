const { z } = require("zod");

const CitationSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  source: z.enum(["vector", "web"]),
  url: z.string().url().optional(),
  snippet: z.string().min(1),
});

const QueryResultEventSchema = z.object({
  queryId: z.string().uuid(),
  answer: z.string().min(1),
  citations: z.array(CitationSchema),
  latencyMs: z.number().int().nonnegative(),
});

const QueryErrorEventSchema = z.object({
  queryId: z.string().uuid(),
  message: z.string().min(1),
  code: z.string().min(1),
});

module.exports = {
  CitationSchema,
  QueryResultEventSchema,
  QueryErrorEventSchema,
};
