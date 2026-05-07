const config = require("../../../server/config/env");
const jwt = require("jsonwebtoken");
const User = require("../../../server/models/User");

// Create a real user in the test database and return a valid token
const createUserAndToken = async (overrides = {}) => {
  const user = await User.create({
    email: overrides.email || "maria.santos@example.com",
    password: overrides.password || "SecurePass123!",
    role: overrides.role || "user",
  });

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    config.JWT_SECRET,
    { expiresIn: "1h" },
  );

  return { user, token };
};

// Create a real admin user in the test database and return a valid token
const createAdminAndToken = async (overrides = {}) => {
  return createUserAndToken({
    email: overrides.email || "admin@kzflegal.com",
    password: overrides.password || "AdminPass123!",
    role: "admin",
  });
};

// Generate an expired JWT — no database needed as it fails at signature level
const generateExpiredToken = () => {
  return jwt.sign(
    {
      id: "661f1e2b3c4d5e6f7a8b9c0d",
      role: "user",
    },
    config.JWT_SECRET,
    { expiresIn: "0s" },
  );
};

// Generate a token signed with the wrong secret — no database needed
const generateInvalidToken = () => {
  return jwt.sign(
    {
      id: "661f1e2b3c4d5e6f7a8b9c0d",
      role: "user",
    },
    "wrong_secret",
    { expiresIn: "1h" },
  );
};

module.exports = {
  createUserAndToken,
  createAdminAndToken,
  generateExpiredToken,
  generateInvalidToken,
};
