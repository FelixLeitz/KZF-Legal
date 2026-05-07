const z = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ID format",
  });

const listDocumentsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, "Page must be a positive integer")
      .transform(Number)
      .pipe(z.number().min(1, "Page must be at least 1"))
      .optional()
      .default("1"),
    limit: z
      .string()
      .regex(/^\d+$/, "Limit must be a positive integer")
      .transform(Number)
      .pipe(z.number().min(1).max(50, "Limit must not exceed 50"))
      .optional()
      .default("10"),
  }),
});

const makeIdParamSchema = (paramName) =>
  z.object({
    body: z.object({}).optional(),
    params: z.object({
      [paramName]: objectIdSchema,
    }),
    query: z.object({}).optional(),
  });

const chatIdParamSchema = makeIdParamSchema("chatId");
const documentIdParamSchema = makeIdParamSchema("documentId");

module.exports = {
  listDocumentsSchema,
  chatIdParamSchema,
  documentIdParamSchema,
};
