const z = require("zod");
const mongoose = require("mongoose");

// Custom Zod schema for validating MongoDB ObjectId strings
const objectIdSchema = z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Invalid id format'
    })

// Validation schema for chat query endpoint
const chatQuerySchema = z.object({
    // The user's query must be a non-empty string with a reasonable length limit
    query: z
        .string()
        .min(1, 'Query is required')
        .max(2000, 'Query must not exceed 2000 characters'),
    // Optional chatId for continuing an existing conversation, must be a valid ObjectId if provided
    chatId: objectIdSchema.optional(),
    // Optional array of document IDs to provide context for the query, each must be a valid ObjectId
    documentIds: z.array(objectIdSchema).optional().default([])
})

module.exports = chatQuerySchema;