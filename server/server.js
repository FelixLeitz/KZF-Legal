const config = require("./config/env");
const app = require("./app");
const logger = require("./utils/logger");
const connectDB = require("./config/database");

const PORT = config.PORT;

const startServer = async () => {
  // Connect to the database before starting the server
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Environment: ${config.NODE_ENV}`);
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();