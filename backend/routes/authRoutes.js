// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { createClient } = require('@supabase/supabase-js');

console.log("🔐 Loading auth routes with Supabase integration...");

// ✅ SUPABASE CONFIGURATION
const supabaseUrl = process.env.SUPABASE_URL || 'https://anjowgqnhyatiltnencb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuam93Z3FuaHlhdGlsdG5lbmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTM0MDQsImV4cCI6MjA3MTUyOTQwNH0.xccgtRzzj8QWdfo2ivmycYAUIK3L_KUYO_emOnzq1ZE';
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ FIXED: Admin email-password mapping with correct jodi@gmail.com password
const adminAccounts = {
  "akshat@gmail.com": "admin123",
  "mannat@gmail.com": "mannat@123",
  "jodi@gmail.com": "mamta1947"  // ✅ Fixed: removed space, corrected password
};

console.log("👑 Admin accounts configured:", Object.keys(adminAccounts));

// ✅ Helper function to log auth events to Supabase (optional)
const logAuthEvent = async (eventType, data) => {
  try {
    // Only log in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_AUTH_LOGGING === 'true') {
      console.log(`📊 Logging auth event: ${eventType}`, data);
      
      // You could create an auth_logs table in Supabase to track login attempts
      // const { error } = await supabase
      //   .from('auth_logs')
      //   .insert([{
      //     event_type: eventType,
      //     email: data.email,
      //     success: data.success,
      //     timestamp: new Date().toISOString(),
      //     ip_address: data.ip,
      //     user_agent: data.userAgent
      //   }]);
      
      // if (error) {
      //   console.warn("⚠️ Failed to log auth event:", error.message);
      // }
    }
  } catch (error) {
    console.warn("⚠️ Auth logging failed:", error.message);
  }
};

// ✅ Helper function to check Supabase connection
const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    return { connected: !error, error: error?.message };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

// ✅ Input validation middleware
const validateRegisterInput = (req, res, next) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ 
      message: "All fields are required",
      required: ["name", "email", "password"],
      provided: {
        name: !!name,
        email: !!email,
        password: !!password
      }
    });
  }
  
  if (!email.includes("@") || !email.includes(".")) {
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
      required: ["email", "password"],
      provided: {
        email: !!email,
        password: !!password
      }
    });
  }
  
  next();
};

// ✅ Enhanced test route with Supabase status
router.get("/test", async (req, res) => {
  try {
    const supabaseStatus = await checkSupabaseConnection();
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ isAdmin: true });
    
    res.json({ 
      message: "✅ Auth routes working with Supabase integration!",
      timestamp: new Date().toISOString(),
      status: {
        mongodb: "connected",
        supabase: supabaseStatus.connected ? "connected" : "disconnected",
        supabaseError: supabaseStatus.error || null
      },
      stats: {
        totalUsers,
        adminUsers,
        configuredAdmins: Object.keys(adminAccounts).length
      },
      availableRoutes: [
        "POST /api/auth/register",
        "POST /api/auth/login", 
        "GET /api/auth/me",
        "GET /api/auth/verify",
        "POST /api/auth/logout",
        "GET /api/auth/test",
        "GET /api/auth/status"
      ],
      adminEmails: Object.keys(adminAccounts),
      features: [
        "Supabase Integration",
        "Enhanced Logging",
        "Admin Account Management",
        "JWT Token Authentication",
        "Input Validation"
      ]
    });
  } catch (error) {
    console.error("❌ Auth test route error:", error);
    res.status(500).json({
      message: "Auth test failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ Status endpoint with detailed system info
router.get("/status", async (req, res) => {
  try {
    const supabaseStatus = await checkSupabaseConnection();
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          admins: { $sum: { $cond: ["$isAdmin", 1, 0] } },
          regular: { $sum: { $cond: ["$isAdmin", 0, 1] } }
        }
      }
    ]);
    
    const stats = userStats[0] || { total: 0, admins: 0, regular: 0 };
    
    res.json({
      status: "operational",
      timestamp: new Date().toISOString(),
      services: {
        mongodb: {
          status: "connected",
          users: stats
        },
        supabase: {
          status: supabaseStatus.connected ? "connected" : "disconnected",
          error: supabaseStatus.error || null,
          url: supabaseUrl
        },
        jwt: {
          status: process.env.JWT_SECRET ? "configured" : "missing",
          algorithm: "HS256"
        }
      },
      environment: process.env.NODE_ENV || "development",
      uptime: Math.floor(process.uptime()),
      memory: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + "MB"
    });
  } catch (error) {
    console.error("❌ Status check failed:", error);
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ POST /api/auth/register with enhanced logging
router.post("/register", validateRegisterInput, async (req, res) => {
  let { name, email, password } = req.body;

  try {
    console.log("📝 Registration attempt:", { 
      name: name?.trim(), 
      email: email?.trim(),
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Trim whitespace and normalize email
    name = name.trim();
    email = email.trim().toLowerCase();
    
    // Log registration attempt
    await logAuthEvent('registration_attempt', {
      email,
      success: false,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("❌ User already exists:", email);
      await logAuthEvent('registration_failed', {
        email,
        success: false,
        reason: 'user_exists',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ FIXED: Check if email is admin and force correct password
    let isAdmin = false;
    if (adminAccounts[email]) {
      console.log("👑 Admin registration detected for:", email);
      password = adminAccounts[email]; // Force set the correct admin password
      isAdmin = true;
      console.log("🔐 Using admin password from adminAccounts mapping");
    }

    // Hash password with enhanced salt rounds for admins
    const saltRounds = isAdmin ? 12 : 10; // Higher security for admins
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log("🔐 Password hashed successfully with", saltRounds, "rounds");

    // Create user
    user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      isAdmin,
      createdAt: new Date(),
      lastLogin: null,
      loginCount: 0
    });
    
    await user.save();

    // Log successful registration
    await logAuthEvent('registration_success', {
      email,
      success: true,
      isAdmin,
      userId: user._id.toString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    console.log("✅ User registered successfully:", {
      email,
      isAdmin,
      userId: user._id
    });
    
    // Generate welcome token for immediate login
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
    
    res.status(201).json({ 
      message: isAdmin ? "Admin user registered successfully! Welcome to JODI." : "User registered successfully! Welcome to JODI.",
      isAdmin,
      token, // Auto-login after registration
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      },
      features: isAdmin ? [
        "Full system access",
        "User management",
        "Supabase storage management",
        "System analytics"
      ] : [
        "Profile management",
        "Basic system access"
      ]
    });
    
  } catch (err) {
    console.error("❌ Registration error:", {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : 'Hidden',
      email: req.body.email
    });
    
    // Log failed registration
    await logAuthEvent('registration_error', {
      email: req.body.email,
      success: false,
      error: err.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Handle specific MongoDB errors
    if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    res.status(500).json({ 
      message: "Server error during registration", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Registration failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ POST /api/auth/login - ENHANCED WITH SUPABASE LOGGING
router.post("/login", validateLoginInput, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const loginAttemptTime = new Date();
    
    console.log("🔐 Login attempt:", {
      email: trimmedEmail,
      isAdminEmail: !!adminAccounts[trimmedEmail],
      timestamp: loginAttemptTime.toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Log login attempt
    await logAuthEvent('login_attempt', {
      email: trimmedEmail,
      success: false,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Find user in database
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      console.log("❌ User not found in database:", trimmedEmail);
      
      // Log failed login
      await logAuthEvent('login_failed', {
        email: trimmedEmail,
        success: false,
        reason: 'user_not_found',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // ✅ SPECIAL CASE: If it's an admin email, suggest registration
      if (adminAccounts[trimmedEmail]) {
        console.log("💡 Admin email found in adminAccounts, but not in database. User needs to register first.");
        return res.status(400).json({ 
          message: "Admin account not found. Please register first with your admin email.",
          isAdminEmail: true,
          suggestion: "Register with your admin email to create the admin account",
          adminEmail: trimmedEmail
        });
      }
      
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("👤 User found:", {
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      hasPassword: !!user.password,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount || 0
    });

    // ✅ FIXED: Direct password comparison for admin accounts
    let isPasswordValid = false;
    
    if (user.isAdmin && adminAccounts[trimmedEmail]) {
      // For admin users, check both the stored hashed password AND the direct admin password
      const directPasswordMatch = password === adminAccounts[trimmedEmail];
      const hashedPasswordMatch = await bcrypt.compare(password, user.password);
      
      console.log("🔐 Admin password check:", {
        email: trimmedEmail,
        directMatch: directPasswordMatch,
        hashedMatch: hashedPasswordMatch
      });
      
      isPasswordValid = directPasswordMatch || hashedPasswordMatch;
      
      // If direct password matches but hashed doesn't, update the hash
      if (directPasswordMatch && !hashedPasswordMatch) {
        console.log("🔄 Updating admin password hash to match adminAccounts");
        const newHashedPassword = await bcrypt.hash(adminAccounts[trimmedEmail], 12);
        await User.findByIdAndUpdate(user._id, { password: newHashedPassword });
        console.log("✅ Admin password hash updated");
      }
    } else {
      // For regular users, use normal bcrypt comparison
      isPasswordValid = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordValid) {
      console.log("❌ Password mismatch for:", trimmedEmail);
      
      // Log failed login
      await logAuthEvent('login_failed', {
        email: trimmedEmail,
        success: false,
        reason: 'invalid_password',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not found in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Update user login statistics
    const loginCount = (user.loginCount || 0) + 1;
    await User.findByIdAndUpdate(user._id, {
      lastLogin: loginAttemptTime,
      loginCount: loginCount
    });

    // Generate JWT token
    const tokenPayload = {
      userId: user._id,
      isAdmin: user.isAdmin,
      email: user.email,
      loginTime: loginAttemptTime.toISOString()
    };
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Log successful login
    await logAuthEvent('login_success', {
      email: trimmedEmail,
      success: true,
      isAdmin: user.isAdmin,
      userId: user._id.toString(),
      loginCount: loginCount,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    console.log("✅ Login successful:", {
      email: trimmedEmail,
      isAdmin: user.isAdmin,
      userId: user._id,
      loginCount: loginCount
    });

    // Check Supabase connection for admin users
    let supabaseStatus = null;
    if (user.isAdmin) {
      supabaseStatus = await checkSupabaseConnection();
    }

    // Return success response
    res.json({
      token,
      message: user.isAdmin ? "🎉 Admin login successful! Welcome back." : "🎉 Login successful! Welcome back.",
      isAdmin: user.isAdmin,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        lastLogin: loginAttemptTime,
        loginCount: loginCount
      },
      systemStatus: user.isAdmin ? {
        supabase: supabaseStatus
      } : null,
      features: user.isAdmin ? [
        "Full system access",
        "User management", 
        "Supabase storage: " + (supabaseStatus?.connected ? "✅ Connected" : "❌ Disconnected"),
        "System analytics"
      ] : [
        "Profile management",
        "Basic system access"
      ]
    });
    
  } catch (err) {
    console.error("❌ Login error:", {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : 'Hidden',
      email: req.body.email
    });
    
    // Log login error
    await logAuthEvent('login_error', {
      email: req.body.email,
      success: false,
      error: err.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(500).json({
      message: "Server error during login",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Login failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ GET /api/auth/me - Get current user profile with enhanced data
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    
    console.log("👤 Profile request:", {
      hasAuthHeader: !!authHeader,
      timestamp: new Date().toISOString(),
      ip: req.ip
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
    console.log("🔓 Token decoded:", { 
      userId: decoded.userId, 
      email: decoded.email,
      isAdmin: decoded.isAdmin
    });
    
    // Find user
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("❌ User not found for token:", decoded.userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Get Supabase status for admin users
    let supabaseStatus = null;
    if (user.isAdmin) {
      supabaseStatus = await checkSupabaseConnection();
    }

    console.log("✅ Profile loaded for:", user.email);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount || 0,
      systemStatus: user.isAdmin ? {
        supabase: supabaseStatus
      } : null,
      permissions: user.isAdmin ? [
        "user_management",
        "system_admin",
        "supabase_access",
        "full_access"
      ] : [
        "basic_access",
        "profile_management"
      ]
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
      error: process.env.NODE_ENV === 'development' ? err.message : 'Profile fetch failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ POST /api/auth/logout with enhanced logging
router.post("/logout", async (req, res) => {
  try {
    console.log("🚪 Logout request:", {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Try to get user info from token for logging
    const authHeader = req.headers["authorization"];
    let userEmail = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userEmail = decoded.email;
      } catch (err) {
        // Token might be expired or invalid, but logout should still work
        console.log("⚠️ Could not decode token during logout:", err.message);
      }
    }
    
    // Log logout event
    await logAuthEvent('logout', {
      email: userEmail || 'unknown',
      success: true,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ 
      message: "Logout successful", 
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({
      message: "Logout completed with warnings",
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ GET /api/auth/verify - Verify token validity with enhanced info
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ valid: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select("email isAdmin lastLogin");
    
    if (!user) {
      return res.status(401).json({ valid: false, message: "User not found" });
    }
    
    res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        isAdmin: decoded.isAdmin,
        lastLogin: user.lastLogin,
        loginTime: decoded.loginTime
      },
      tokenInfo: {
        issued: new Date(decoded.iat * 1000).toISOString(),
        expires: new Date(decoded.exp * 1000).toISOString()
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

// ✅ ADMIN DEBUG ROUTE - Enhanced with Supabase info
if (process.env.NODE_ENV === 'development') {
  router.get("/admin-debug", async (req, res) => {
    try {
      const adminUsers = await User.find({ 
        email: { $in: Object.keys(adminAccounts) } 
      }).select("-password");
      
      const allUsers = await User.find({}).select("email isAdmin createdAt lastLogin loginCount");
      const supabaseStatus = await checkSupabaseConnection();
      
      res.json({
        message: "🛠️ Admin debug info (Development Only)",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        configuredAdmins: adminAccounts,
        adminUsersInDB: adminUsers.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount || 0
        })),
        allUsers: allUsers.map(user => ({
          id: user._id,
          email: user.email,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount || 0
        })),
        systemStatus: {
          supabase: supabaseStatus,
          jwt: process.env.JWT_SECRET ? "configured" : "missing",
          mongodb: "connected"
        },
        stats: {
          totalUsers: allUsers.length,
          adminUsers: allUsers.filter(u => u.isAdmin).length,
          regularUsers: allUsers.filter(u => !u.isAdmin).length
        }
      });
    } catch (err) {
      res.status(500).json({ 
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

console.log("✅ Auth routes loaded successfully with Supabase integration and enhanced features");

module.exports = router;