const express = require("express");
const documentController = require("../controllers/documentController");
const { upload } = require("../middleware/upload");

// Initialize router
const router = express.Router();

// Document routes
router.get("/", documentController.listDocuments);
router.get("/chat/:chatId", documentController.listDocumentsByChat);
router.post("/upload/:chatId", upload.single("document"), documentController.uploadDocument);
router.delete("/:documentId", documentController.deleteDocument);

module.exports = router;
