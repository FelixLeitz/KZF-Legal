const express = require("express");
const chatController = require("../controllers/chatController");
const validateRequest = require("../middleware/validateRequest");
const chatQuerySchema = require("../validators/chatValidator");

// Initialize router
const router = express.Router();

// Chat routes
router.get("/", chatController.listChats);
router.get("/:chatId", chatController.getChat);
router.delete('/:chatId', chatController.deleteChat);
router.post("/create", chatController.createChat);
router.post("/:chatId", validateRequest(chatQuerySchema), chatController.postChat);

module.exports = router;
