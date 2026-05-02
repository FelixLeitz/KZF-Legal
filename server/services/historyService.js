const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// List all chat chats for a user, paginated and sorted by recent activity.
const listAllChats = async (userId, {page = DEFAULT_PAGE, limit = DEFAULT_LIMIT}) => {
    // Sanitize and validate pagination parameters to prevent abuse and ensure reasonable defaults.
    const safePage = Math.max(parseInt(page, 10) || DEFAULT_PAGE, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const skip = (safePage - 1) * safeLimit;

    // Filter chats by user ID to ensure users only see their own chat history.
    const filter = { user: userId };

    // Use Promise.all to execute both queries in parallel for better performance.
    const [chats, total] = await Promise.all([
        Chat.find(filter)
            .select("_id title lastMessageAt createdAt updatedAt")
            .sort({ lastMessageAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        Chat.countDocuments(filter),
    ]);

    // Return the paginated list of chats along with pagination metadata for client-side handling.
    return {
        chats,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
        },
    };
};

// Retrieve a chat chat by its ID, including all messages sorted by creation time.
const getChatById = async (userId, chatId) => {
    // Validate chatId format before querying the database to prevent unnecessary queries and potential errors.
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        const error = new Error("Chat not found");
        error.status = 404;
        error.code = "NOT_FOUND";
        throw error
    }

    // Single query enforces ownership atomically at the DB level.
    const chat = await Chat.findOne({
        _id: chatId,
        user: userId,
    }).lean();

    // If no chat is found, it means either the chat doesn't exist or doesn't belong to the user.
    if (!chat) {
        const error = new Error("Chat not found");
        error.status = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    // Retrieve all messages for the chat, sorted by creation time to maintain conversation flow.
    const messages = await Message.find({ chat: chat._id })
        .sort({ createdAt: 1 })
        .lean();

    // Return the chat data along with its messages to the controller for response formatting.
    return { ...chat, messages };
};

const deleteChatById = async (userId, chatId) => {
    // Validate chatId format before querying the database to prevent unnecessary queries and potential errors.
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        const error = new Error("Chat not found");
        error.status = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    // Message deletion is handled by the ChatSchema post middleware
    const deletedChat = await Chat.findOneAndDelete({
        _id: chatId,
        user: userId,
    });

    // If no chat was deleted, it means either the chat doesn't exist or doesn't belong to the user.
    if (!deletedChat) {
        const error = new Error("Chat not found");
        error.status = 404;
        error.code = "NOT_FOUND";
        throw error;
    }
};

module.exports = {
    listAllChats,
    getChatById,
    deleteChatById,
};