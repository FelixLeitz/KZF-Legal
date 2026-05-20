const express = require("express");

// Initialize router
const router = express.Router();

// Health check route
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: "Felix Leitz",
      studentId: "s226145527"
    },
  });
});

module.exports = router;