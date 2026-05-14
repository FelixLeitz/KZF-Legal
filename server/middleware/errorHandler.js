const logger = require("../utils/logger");
const config = require("../config/env");
const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  // Log the full error internally
  if (config.NODE_ENV !== "test") {
    logger.error({ err }, err.message);
  }

  // Multer-specific errors 
  if (err instanceof multer.MulterError) {
    // File too large
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: {
          message: "File exceeds the 10MB size limit",
          code: "LIMIT_FILE_SIZE",
        },
      });
    }

    // Other Multer errors (e.g. file upload issues)
    return res.status(400).json({
      success: false,
      error: {
        message: err.message,
        code: err.code || "UPLOAD_ERROR",
      },
    });
  }

  // ── Custom file filter rejections (UNSUPPORTED_FILE_TYPE etc.) ────────
  if (err.code === "UNSUPPORTED_FILE_TYPE") {
    return res.status(415).json({
      success: false,
      error: {
        message: err.message,
        code: "UNSUPPORTED_FILE_TYPE",
      },
    });
  }

  // Default to 500 Internal Server Error if status is not set
  const status = err.status || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";

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
