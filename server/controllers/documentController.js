const documentService = require('../services/documentService');

const uploadDocument = async (req, res, next) => {
    try {
        // Retrieve the authenticated user's ID, the chat ID and the uploaded file from the request object
        const userId = req.user.id;
        const file = req.file;
        let chatId = req.body.chatId; 
        let documentId;

        // Delegate the document creation logic to the service layer
        ({ documentId, chatId } = await documentService.createDocument({ file, userId, chatId }));
        
        // Respond with a 202 Accepted status to indicate that the document has been received and is being processed asynchronously.
        res.status(202).json({
            success: true,
            data: {
                documentId: documentId,
                chatId: chatId,
            },
        });

        // Trigger asynchronous processing of the document (e.g., text extraction, indexing) 
        documentService.processDocument({
            documentId: documentId,
            userId,
            chatId,
            io: req.app.get("io"),
        });
    } catch (err) {
        next(err);
    }
};

const deleteDocument = async (req, res, next) => {
    try {
        // Retrieve the authenticated user's ID, the document ID, and the chat ID from the request object
        const userId = req.user.id; 
        const documentId = req.params.id;

        // Delegate the document deletion logic to the service layer, which will handle authorization checks and file cleanup
        await documentService.removeDocument({ documentId, userId });

        // Respond with a 202 Accepted status to indicate that the document has been successfully deleted. 
        res.status(202).json({
            success: true,
            message: "Document deleted successfully",
        });
    } catch (err) {
        next(err);
    }
};

const listDocuments = async (req, res, next) => {
    try {
        // Retrieve the authenticated user's ID from the request object
        const userId = req.user.id;

        // Delegate the retrieval of documents to the service layer, which will return a list of documents belonging to the user
        const documents = await documentService.getDocumentsByUser(userId);

        // Respond with a 200 OK status and the list of documents in the response body. 
        res.status(200).json({
            success: true,
            data: documents,
        });
    } catch (err) {
        next(err);
    }    
};

const listDocumentsByChat = async (req, res, next) => {
    try {
        // Retrieve the authenticated user's ID and the chat ID from the request object
        const userId = req.user.id;
        const chatId = req.params.chatId;

        // Delegate the retrieval of documents to the service layer, which will return a list of documents belonging to the user
        const documents = await documentService.getDocumentsByChat(userId, chatId);

        // Respond with a 200 OK status and the list of documents in the response body. 
        res.status(200).json({
            success: true,
            data: documents,
        });
    } catch (err) {
        next(err);
    }    
};

module.exports = { uploadDocument, deleteDocument, listDocuments, listDocumentsByChat };