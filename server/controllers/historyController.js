const { listAllChats, getChatById, deleteChatById } = require("../services/historyService");

// Controller function to handle listing all chats for the authenticated user with pagination.
const listChats = async (req, res, next) => {
    try {
        // Extract pagination parameters from query string, with defaults for page and limit.
        const { page, limit } = req.query;
        // Call service layer to get paginated list of chats for the authenticated user.
        const { chats, pagination } = await listAllChats(
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
        const chat = await getChatById(
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
        await deleteChatById(
            req.user.id,
            req.params.chatId,
        );

        // Return 200 OK to indicate successful deletion.
        return res.status(200).send({ success: true });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listChats,
    getChat,
    deleteChat,
};