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

    // Clear existing data from collections for a clean slate (DELETE FOR PRODUCTION)
    await User.deleteMany({});
    await Document.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    logger.info("Database cleared of existing data");
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
