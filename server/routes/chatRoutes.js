const express = require("express");
const chatController = require("../controllers/chatController");
const validateRequest = require("../middleware/validateRequest");
const { createChatSchema,
    submitQuerySchema,
    listChatsSchema,
    chatIdParamSchema
} = require("../validators/chatValidator");

// Initialize router
const router = express.Router();

// Chat routes
router.get("/", validateRequest(listChatsSchema), chatController.listChats);
router.get("/:chatId", validateRequest(chatIdParamSchema), chatController.getChat);
router.delete('/:chatId', validateRequest(chatIdParamSchema), chatController.deleteChat);
router.post("/create", validateRequest(createChatSchema), chatController.createChat);
router.post("/:chatId", validateRequest(submitQuerySchema), chatController.postChat);

module.exports = router;
