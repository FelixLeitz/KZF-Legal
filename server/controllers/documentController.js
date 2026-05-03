const documentService = require('../services/documentService');

const uploadDocument = async (req, res, next) => {
    try {
        const userId = req.user.id; // Assuming authentication middleware has set req.user
        const file = req.file;

        const document = await documentService.createDocument({ file, userId });

        res.status(201).json({
            success: true,
            data: {
                documentId: document._id,
                filename: document.filename,
                mimeType: document.mimeType,
                size: document.size,
                status: document.status,
                createdAt: document.createdAt,
            },
        });
    } catch (err) {
        next(err);
    }
};

const deleteDocument = async (req, res, next) => {
    try {
        const userId = req.user.id; 
        const documentId = req.params.id;

        await documentService.removeDocument({ documentId, userId });

        res.status(200).json({
            success: true,
            message: "Document deleted successfully",
        });
    } catch (err) {
        next(err);
    }
};

const listDocuments = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const documents = await documentService.getDocumentsByUser(userId);

        res.status(200).json({
            success: true,
            data: documents,
        });
    } catch (err) {
        next(err);
    }    
};

module.exports = { uploadDocument, deleteDocument, listDocuments };