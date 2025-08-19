// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Admin email-password mapping
const adminAccounts = {
  "akshat@gmail.com": "admin123",
  "mannat@gmail.com": "mannat@123",
  "jodino1@gmail.com": "mamta1947"
};

// ✅ Input validation middleware
const validateRegisterInput = (req, res, next) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ 
      message: "All fields are required",
      required: ["name", "email", "password"]
    });
  }
  
  if (!email.includes("@")) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }
  
  next();
};

const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      message: "Email and password are required",
      required: ["email", "password"]
    });
  }
  
  next();
};

// ✅ Test route - should be first for easy testing
router.get("/test", (req, res) => {
  res.json({ 
    message: "Auth routes working!",
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "POST /api/auth/register",
      "POST /api/auth/login", 
      "GET /api/auth/me",
      "GET /api/auth/test"
    ]
  });
});

// ✅ POST /api/auth/register
router.post("/register", validateRegisterInput, async (req, res) => {
  let { name, email, password } = req.body;

  try {
    console.log("📝 Registration attempt:", { 
      name: name?.trim(), 
      email: email?.trim(),
      timestamp: new Date().toISOString()
    });
    
    // Trim whitespace
    name = name.trim();
    email = email.trim().toLowerCase();
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("❌ User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    // If email is admin, override password and set admin flag
    let isAdmin = false;
    if (adminAccounts[email]) {
      console.log("👑 Admin registration detected:", email);
      password = adminAccounts[email]; // force set admin password
      isAdmin = true;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log("🔐 Password hashed successfully");

    // Create user
    user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      isAdmin,
      createdAt: new Date()
    });
    
    await user.save();

    console.log("✅ User registered successfully:", {
      email,
      isAdmin,
      userId: user._id
    });
    
    res.status(201).json({ 
      message: isAdmin ? "Admin user registered successfully" : "User registered successfully",
      isAdmin
    });
    
  } catch (err) {
    console.error("❌ Registration error:", {
      message: err.message,
      stack: err.stack,
      email: req.body.email
    });
    
    // Handle specific MongoDB errors
    if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    res.status(500).json({ 
      message: "Server error during registration", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Registration failed'
    });
  }
});

// ✅ POST /api/auth/login
router.post("/login", validateLoginInput, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const trimmedEmail = email.trim().toLowerCase();
    console.log("🔐 Login attempt:", {
      email: trimmedEmail,
      timestamp: new Date().toISOString(),
      ip: req.ip
    });

    // Find user
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      console.log("❌ User not found:", trimmedEmail);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password mismatch for:", trimmedEmail);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not found in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user._id,
      isAdmin: user.isAdmin,
      email: user.email
    };
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("✅ Login successful:", {
      email: trimmedEmail,
      isAdmin: user.isAdmin,
      userId: user._id
    });

    // Return success response
    res.json({
      token,
      message: user.isAdmin ? "Admin login successful" : "Login successful",
      isAdmin: user.isAdmin,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }
    });
    
  } catch (err) {
    console.error("❌ Login error:", {
      message: err.message,
      stack: err.stack,
      email: req.body.email
    });
    
    res.status(500).json({
      message: "Server error during login",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Login failed'
    });
  }
});

// ✅ GET /api/auth/me - Get current user profile
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    
    console.log("👤 Profile request:", {
      hasAuthHeader: !!authHeader,
      timestamp: new Date().toISOString()
    });
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No valid authorization header");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured");
      return res.status(500).json({ message: "Server configuration error" });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔓 Token decoded:", { userId: decoded.userId, email: decoded.email });
    
    // Find user
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("❌ User not found for token:", decoded.userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ Profile loaded for:", user.email);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    });
    
  } catch (err) {
    console.error("❌ Get profile error:", {
      message: err.message,
      name: err.name
    });
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Profile fetch failed'
    });
  }
});

// ✅ POST /api/auth/logout - Logout (client-side mostly, but good to have)
router.post("/logout", (req, res) => {
  console.log("🚪 Logout request:", {
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
  
  // Since JWT is stateless, logout is mainly handled client-side
  // But we can log it and potentially add to a blacklist in the future
  res.json({ message: "Logout successful" });
});

// ✅ GET /api/auth/verify - Verify token validity
router.get("/verify", (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ valid: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        isAdmin: decoded.isAdmin
      }
    });
    
  } catch (err) {
    console.error("❌ Token verification error:", err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ valid: false, message: "Invalid token" });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, message: "Token expired" });
    }
    
    res.status(500).json({ valid: false, message: "Verification failed" });
  }
});

module.exports = router;