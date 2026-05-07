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

module.exports = { createChat, postChat };