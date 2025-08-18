// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Admin email-password mapping
const adminAccounts = {
  "akshat@gmail.com": "admin123",
  "mannat@gmail.com": "mannat@123"
};

// ✅ POST /api/auth/register
router.post("/register", async (req, res) => {
  let { name, email, password } = req.body;

  try {
    console.log("📝 Registration attempt:", { name, email });
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // If email is admin, override password and set admin flag
    let isAdmin = false;
    if (adminAccounts[email]) {
      password = adminAccounts[email]; // force set admin password
      isAdmin = true;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({ name, email, password: hashedPassword, isAdmin });
    await user.save();

    console.log("✅ User registered successfully:", email);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    console.log("🔐 Login attempt:", email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password mismatch for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        isAdmin: user.isAdmin, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("✅ Login successful:", email);
    res.json({ 
      token, 
      message: "Login successful", 
      isAdmin: user.isAdmin,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ GET /api/auth/me - Get current user profile
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("❌ Get profile error:", err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Test route
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes working!" });
});

module.exports = router;