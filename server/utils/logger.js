const pino = require("pino");
const config = require("../config/env");

// Set up logging with Pino
const logger = pino({
    // In production, log at 'info' level and above. In development, log everything at 'debug' level.
    level: config.NODE_ENV === 'production'
        ? 'info' 
        : config.NODE_ENV === 'test'
            ? 'warn' // In tests, only log warnings and errors to keep output clean
            : 'debug',
    // Use pino-pretty for human-readable logs in development, and structured JSON logs in production
    transport: config.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined
})

module.exports = logger;