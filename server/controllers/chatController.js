const chatService = require("../services/chatService");

const createChat = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title } = req.body;

        const chatId = await chatService.createChat(userId, title);

        return res.status(201).json({
            success: true,
            data: { chatId }
        });
    } catch (err) {
        next(err);
    }
};

// Handle incoming chat queries from the client
const postChat = async (req, res, next) => {
    try {
        // Extract query and optional chatId from the request body
        let { query, documentIds } = req.body;
        const { chatId } = req.params;

        // Retrieve the userId from the authenticated request (assuming authentication middleware has set req.user)
        const userId = req.user.id;

        // Create a pending message and get the associated chat. This will create a new chat if chatId is not provided or invalid.
        const messageId = await chatService.createPendingMessage(userId, query, chatId);

        // Immediately respond to the client with the chat and message IDs so they can show a loading state while the query is being processed.
        res.status(202).json({ 
            success: true,
            data: { messageId }
        });

        // Process the query through the RAG pipeline asynchronously using sockets for communication
        chatService.processQuery({ query, messageId, userId, documentIds, io: req.app.get("io") });
    } catch (error) {
        next(error);
    }
}

// Controller function to handle listing all chats for the authenticated user with pagination.
const listChats = async (req, res, next) => {
    try {
        // Extract pagination parameters from query string, with defaults for page and limit.
        const { page, limit } = req.query;
        // Call service layer to get paginated list of chats for the authenticated user.
        const { chats, pagination } = await chatService.listAllChats(
            req.user.id,
            { page, limit },
        );

        // Return paginated list of chats with metadata for client-side pagination controls.
        return res.status(200).json({
            success: true,
            data: { chats, pagination }
        });
    } catch (err) {
        next(err);
    }
};

// Controller function to handle retrieving a specific chat by its ID for the authenticated user.
const getChat = async (req, res, next) => {
    try {
        // Call service layer to retrieve the specified chat for the authenticated user.
        const chat = await chatService.getChatById(
            req.user.id,
            req.params.chatId,
        );

        // Return the chat data, including messages, to the client.
        return res.status(200).json({
            success: true,
            data: chat
        });
    } catch (err) {
        next(err);
    }
};

// Controller function to handle deleting a chat by its ID for the authenticated user.
const deleteChat = async (req, res, next) => {
    try {
        // Call service layer to delete the specified chat for the authenticated user.
        await chatService.deleteChatById(
            req.user.id,
            req.params.chatId,
        );

        // Return 200 OK to indicate successful deletion.
        return res.status(200).send({ success: true });
    } catch (err) {
        next(err);
    }
};

module.exports = { createChat, postChat, listChats, getChat, deleteChat };