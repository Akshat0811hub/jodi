const express = require("express");
const router = express.Router();

const { getUserProfile } = require("../controllers/authController");
const {
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
} = require("../controllers/adminController");

const { verifyToken } = require("../middleware/authMiddleware"); // ✅ FIXED

// 🔐 Authenticated user profile
router.get("/me", verifyToken, getUserProfile);

// 🔐 Admin-only routes
router.get("/", verifyToken, getAllUsers);
router.put("/:id", verifyToken, updateUserByAdmin);
router.delete("/:id", verifyToken, deleteUserByAdmin);

module.exports = router;
