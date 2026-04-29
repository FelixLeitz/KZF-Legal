const { z } = require("zod");

const SubmitQueryInputSchema = z.object({
  userId: z.string().min(1),
  question: z.string().min(5),
});

const SubmitQueryResponseSchema = z.object({
  queryId: z.string().uuid(),
});

const IngestDocumentInputSchema = z.object({
  userId: z.string().min(1),
  docId: z.string().min(1).optional(),
  text: z.string().min(1),
});

const IngestDocumentResponseSchema = z.object({
  chunks: z.number().int().nonnegative(),
});

module.exports = {
  SubmitQueryInputSchema,
  SubmitQueryResponseSchema,
  IngestDocumentInputSchema,
  IngestDocumentResponseSchema,
};
