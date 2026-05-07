const express = require("express");
const documentController = require("../controllers/documentController");
const { upload } = require("../middleware/upload");
const {listDocumentsSchema,
    chatIdParamSchema,
    documentIdParamSchema} = require("../validators/docValidator");

// Initialize router
const router = express.Router();

// Document routes
router.get("/", validateRequest(listDocumentsSchema), documentController.listDocuments);
router.get("/chat/:chatId", validateRequest(chatIdParamSchema), documentController.listDocumentsByChat);
router.post("/upload/:chatId", upload.single("document"), validateRequest(chatIdParamSchema), documentController.uploadDocument);
router.delete("/:documentId", validateRequest(documentIdParamSchema), documentController.deleteDocument);

module.exports = router;
