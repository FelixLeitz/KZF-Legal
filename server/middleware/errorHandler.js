const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
    // Log the full error internally
    logger.error({ err }, err.message)

    // Default to 500 Internal Server Error if statusCode is not set
    const statusCode = err.statusCode || 500
    const code = err.code || 'INTERNAL_SERVER_ERROR'

    // In development return the actual error message and stack
    // In production return a generic message so internals are never exposed
    const message =
        process.env.NODE_ENV !== 'production'
            ? err.message
            : 'An unexpected error occurred. Please try again later.'

    // Only include the stack trace in development for debugging purposes
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            code,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    })
}

module.exports = errorHandler;