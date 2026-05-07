const mongoose = require("mongoose");
const User = require("../models/User");
const Document = require("../models/Document");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const logger = require("../utils/logger");
const config = require("./env");

const connectDB = async () => {
  try {
    // Connect to MongoDB using Mongoose
    await mongoose.connect(config.MONGODB_URI);
    logger.info(`MongoDB connected under URI: ${config.MONGODB_URI}`);

    // Log the number of documents in each collection for debugging
    const userCount = await User.countDocuments();
    const documentCount = await Document.countDocuments();
    const chatCount = await Chat.countDocuments();
    const messageCount = await Message.countDocuments();
    logger.info(
      `Database stats - Users: ${userCount}, Documents: ${documentCount}, Chats: ${chatCount}, Messages: ${messageCount}`,
    );
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
