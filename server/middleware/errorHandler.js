const logger = require("../utils/logger");
const config = require("../config/env");
const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  // Log the full error internally
  if (config.NODE_ENV !== "test") {
    logger.error({ err }, err.message);
  }

  let status = err.status || 500;
  let code = err.code || "INTERNAL_SERVER_ERROR";

  // Multer-specific errors 
  if (err instanceof multer.MulterError) {
    // File too large
    if (err.code === "LIMIT_FILE_SIZE") {
      status = 413; // Payload Too Large
    } else {
      status = 400; // Bad Request for other Multer errors
    }
  }

  // In development return the actual error message and stack
  // In production return a generic message so internals are never exposed
  const message =
    process.env.NODE_ENV !== "production"
      ? err.message
      : "An unexpected error occurred. Please try again later.";

  // Only include the stack trace in development for debugging purposes
  res.status(status).json({
    success: false,
    error: {
      message,
      code,
      // Include fields if they exist (e.g. from validation errors)
      ...(err.fields && { fields: err.fields }),
      // Include the stack trace in development for debugging, but never in production
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
