const express = require("express");
const documentController = require("../controllers/documentController");
const { upload } = require("../middleware/upload");

// Initialize router
const router = express.Router();

router.get("/", documentController.listDocuments);
router.post("/upload", upload.single("document"), documentController.uploadDocument);
router.delete("/:id", documentController.deleteDocument);

module.exports = router;
