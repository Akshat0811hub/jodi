const express = require("express");
const router = express.Router();

const { getUserProfile } = require("../controllers/authController");
const {
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
} = require("../controllers/adminController");

const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// 🔐 Authenticated user profile
router.get("/me", verifyToken, getUserProfile);

// 🔐 Admin-only routes
router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.put("/:id", verifyToken, verifyAdmin, updateUserByAdmin);
router.delete("/:id", verifyToken, verifyAdmin, deleteUserByAdmin);

module.exports = router;
