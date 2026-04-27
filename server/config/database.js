const mongoose = require("mongoose");
const logger = require("../utils/logger");
const config = require("./env");

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info(`MongoDB connected under URI: ${config.MONGODB_URI}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
