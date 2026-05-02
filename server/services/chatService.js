const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const logger = require("../utils/logger");
// const submitQuery = require("../../rag/index").submitQuery;

const createPendingMessage = async (userId, query, chatId) => {
    let chat;

    if (chatId) {
        // Validate ObjectId format before querying
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            const error = new Error("Invalid chatId format");
            error.statusCode = 404;
            error.code = "NOT_FOUND";
            throw error;
        }

        // Attempt to find the chat in the database by ID
        chat = await Chat.findById(chatId);

        // chatId was provided but no matching chat exists
        if (!chat) {
            const error = new Error("Chat not found");
            error.statusCode = 404;
            error.code = "NOT_FOUND";
            throw error;
        }

        // Chat exists — update lastMessageAt
        await Chat.findByIdAndUpdate(chatId, { lastMessageAt: Date.now() });
    } else {
        // If no chatId is provided, create a new chat
        chat = await Chat.create({
            user: userId,
            title: "New Chat",
            lastMessageAt: Date.now()
        });
        chatId = chat._id;
    }

    // Create message shell with status "pending". This allows the UI to show a loading state while the query is being processed.
    const message = await Message.create({
        chat: chatId,
        user: userId,
        query: query,
        response: { answer: "", citations: [] },
        status: "pending"
    });

    const messageId = message._id;

    return { chatId, messageId };
}

const processQuery = async ({ query, messageId, userId, documentIds, io }) => {
    try {
        // Call the RAG service to process the query and retrieve an answer along with any relevant citations.
        // const ragResponse = await ragService.submitQuery(query, userId, documentIds);

        // DUMMY RESPONSE FOR TESTING - DELETE WHEN ACTUAL RAG SERVICE CALL IS IMPLEMENTED
        let ragResponse = {
            answer: "This is a dummy answer generated for testing purposes.",
            citations: []
        };

        // Update the message in DB
        await Message.findByIdAndUpdate(messageId, {
            answer: ragResponse.answer,
            citations: ragResponse.citations,
            status: "complete",
        });

        // Emit to the user's socket room
        io.to(`user:${userId}`).emit("chat:response", {
            messageId: messageId,
            answer: ragResponse.answer,
            citations: ragResponse.citations,
        });
    } catch (err) {
        // If there's an error during processing, update the message status to "error" and emit an error event to the client.
        logger.error(`processQuery error for messageId ${messageId}:`, err);
        try {
            await Message.findByIdAndUpdate(messageId, { status: "error" });
        }
        catch (updateErr) {
            logger.error(`Failed to update message status to error for messageId ${messageId}:`, updateErr);
        }

        io.to(`user:${userId}`).emit("chat:error", { messageId: messageId });
    }
};

module.exports = { createPendingMessage, processQuery };