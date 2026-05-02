const { createPendingMessage, processQuery } = require("../services/chatService");

// Handle incoming chat queries from the client
const postChat = async (req, res, next) => {
    try {
        // Extract query and optional chatId from the request body
        let { query, chatId, documentIds } = req.body;

        // Retrieve the userId from the authenticated request (assuming authentication middleware has set req.user)
        const userId = req.user.id;

        // Explicitly declare messageId here
        let messageId;

        // Create a pending message and get the associated chat. This will create a new chat if chatId is not provided or invalid.
        ({ chatId, messageId } = await createPendingMessage(userId, query, chatId));

        // Immediately respond to the client with the chat and message IDs so they can show a loading state while the query is being processed.
        res.status(202).json({ 
            success: true,
            data: { chatId, messageId }
        });

        // Process the query through the RAG pipeline asynchronously using sockets for communication
        processQuery({ query, messageId, userId, documentIds, io: req.app.get("io") });
    } catch (error) {
        next(error);
    }
}

module.exports = { postChat };