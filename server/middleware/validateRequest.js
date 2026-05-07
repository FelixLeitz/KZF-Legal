const validateRequest = (schema) => (req, res, next) => {
  // Validate the request against the provided Zod schema
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // If validation fails, return a 400 Bad Request with detailed error information
  if (!result.success) {
    // Join all validation errors into a structured, readable format
    const errors = result.error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    const error = new Error(errors[0].message);
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    return next(error);
  }

  // If validation succeeds, proceed with the parsed and validated data
  req.body = result.data.body ?? req.body;
  req.params = result.data.params ?? req.params;
  req.query = result.data.query ?? req.query;
  next();
};

module.exports = validateRequest;
