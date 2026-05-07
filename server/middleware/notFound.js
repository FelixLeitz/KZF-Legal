// Middleware to explicitly handle 404 Not Found errors
const notFound = (req, res, next) => {
  // Create a new error with a message that includes the HTTP method and original URL
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  // Set the status code and custom error code for the error
  error.status = 404;
  error.code = "NOT_FOUND";
  // Pass the error to the global error handling middleware
  next(error);
};

module.exports = notFound;
