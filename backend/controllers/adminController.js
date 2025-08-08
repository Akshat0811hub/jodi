const User = require("../models/userModel");
const bcrypt = require("bcrypt");

// 🔍 Get all users (Admin-only)
const getAllUsers = async (req, res) => {
  try {
    // Check admin permission
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const users = await User.find().select("-password"); // don't send password
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// 🔁 Update user by admin
const updateUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ❌ Delete user by admin
const deleteUserByAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    await User.findByIdAndDelete(id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
};
