const z = require("zod");
const mongoose = require("mongoose");

// Custom Zod schema for validating MongoDB ObjectId strings
const objectIdSchema = z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Invalid id format'
    })

const createChatSchema = z.object({
    body: z.object({
        title: z
            .string()
            .max(100, "Title must not exceed 100 characters")
            .trim()
            .optional(),
    }),
});

const submitQuerySchema = z.object({
    body: z.object({
        // The user's query must be a non-empty string with a reasonable length limit
        query: z
            .string()
            .min(1, "Query is required")
            .max(2000, "Query must not exceed 2000 characters")
            .trim(),
        documentIds: z
            .array(objectIdSchema)
            .optional()
            .default([]),
    }),
    params: z.object({
        chatId: objectIdSchema,
    }),
});

const listChatsSchema = z.object({
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

const chatIdParamSchema = z.object({
    params: z.object({
        chatId: objectIdSchema,
    }),
});

module.exports = {
    createChatSchema,
    submitQuerySchema,
    listChatsSchema,
    chatIdParamSchema
};