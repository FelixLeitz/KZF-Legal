const express = require("express");
const healthRoutes = require("./healthRoutes");
const authRoutes = require("./authRoutes");
const chatRoutes = require("./chatRoutes");
const documentRoutes = require("./documentRoutes");
const adminRoutes = require("./adminRoutes");
const studentRoutes = require("./studentRoutes")
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// Initialize router
const router = express.Router();

// Public routes
router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/student", studentRoutes);

// Protected routes (require authentication)
router.use("/chat", requireAuth, chatRoutes);
router.use("/documents", requireAuth, documentRoutes);

// Admin routes (require admin role)
router.use("/admin", requireAdmin, adminRoutes);

module.exports = router;
