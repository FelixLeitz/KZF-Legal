const express = require("express");
const historyController = require("../controllers/historyController");

// Initialize router
const router = express.Router();

// Retrieve chat history route (placeholder)
router.get("/", historyController.listChats);

// Retrieve specific chat history by chat ID route (placeholder)
router.get("/:chatId", historyController.getChat);

// Delete chat history route (placeholder)
router.delete('/:chatId', historyController.deleteChat);

module.exports = router;