const requireAuth = require("./requireAuth");

const requireAdmin = (req, res, next) => {
  // First, ensure the user is authenticated
  requireAuth(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // Check the authenticated user's role
    if (req.user && req.user.role !== "admin") {
      const error = new Error("Forbidden: Admin access required");
      error.status = 403;
      error.code = "FORBIDDEN";
      return next(error);
    }

    next();
  });
};

module.exports = requireAdmin;
