const validateRequest = (schema) => (req, res, next) => {
  // Validate the request body against the provided Zod schema
  const result = schema.safeParse(req.body);

  // If validation fails, return a 400 Bad Request with detailed error information
  if (!result.success) {
    // Join all validation errors into a structured, readable format
    const errors = result.error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    const error = new Error(errors[0].message);
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    return next(error);
  }

  // If validation succeeds, proceed with the parsed and validated data
  req.body = result.data;
  next();
};

module.exports = validateRequest;
