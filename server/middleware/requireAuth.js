const passport = require("passport");

const requireAuth = (req, res, next) => {
  // Use Passport's JWT strategy to authenticate the request
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    // Pass any authentication errors to the next layer
    if (err) {
      return next(err);
    }

    // If no user is found, return a 401 Unauthorized response
    if (!user) {
      const error = new Error("Unauthorized: Invalid or missing token");
      error.status = 401;
      error.code = "AUTH_INVALID_TOKEN";
      return next(error);
    }

    // Attach the authenticated user to the request object for downstream use
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = requireAuth;
