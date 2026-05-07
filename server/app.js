const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config/env");
const passport = require("./config/passport");
const routes = require("./routes");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

// Initialize Express app
const app = express();

// Set secure HTTP headers that protect against common vulnerabilities
app.use(helmet());

// Allow cross-origin requests from the frontend
app.use(
  cors({
    origin: config.ALLOWED_ORIGINS.split(","),
    credentials: true,
  }),
);

// Global middleware
// Parse JSON bodies with a size limit;
app.use(express.json({ limit: "100kb" }));
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Create a stream object with a 'write' function that Morgan can call
const stream = {
  write: (message) => logger.info(message.trim()),
};

// Log HTTP requests in development mode
if (config.NODE_ENV === "development") {
  app.use(morgan("dev", { stream }));
}

// Initialize Passport (without session as JWT is stateless)
app.use(passport.initialize());

// Serve Static Files on http://localhost:PORT/ (your public folder)
app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use("/api", routes);

// Handle 404 Not Found for unmatched routes
app.use(notFound);

// Global error handling middleware
app.use(errorHandler);

module.exports = app;
