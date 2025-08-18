const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables first
dotenv.config();

const app = express();

console.log("🔄 Starting server setup...");
console.log("🌍 Environment:", process.env.NODE_ENV || "development");
console.log("📡 Port:", process.env.PORT || 5000);

// ✅ RENDER-SPECIFIC CORS FIX - This addresses the Render CORS issue
const allowedOrigins = [
  "https://jodi-iexr.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:3001"
];

// ✅ CRITICAL FIX: Custom CORS middleware for Render
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Always set CORS headers, regardless of origin
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // In development, allow any origin
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    // In production, set the main frontend origin as default
    res.header('Access-Control-Allow-Origin', 'https://jodi-iexr.vercel.app');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-HTTP-Method-Override');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  console.log(`🔄 CORS Headers Set for: ${req.method} ${req.url} from origin: ${origin}`);
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log(`✅ Preflight handled for: ${req.url}`);
    return res.sendStatus(200);
  }
  
  next();
});

// ✅ Apply standard CORS as backup
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log("✅ CORS - Origin allowed:", origin);
      callback(null, true);
    } else {
      console.log("⚠️ CORS - Origin not in allowlist but allowing:", origin);
      // For debugging - still allow but log
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-HTTP-Method-Override'
  ]
};

app.use(cors(corsOptions));

// ✅ Body parsing middleware with increased limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
  next();
});

// ✅ Static file serving
const uploadsPath = path.join(__dirname, 'uploads');
const assetsPath = path.join(__dirname, 'assets');

const fs = require('fs');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('📁 Created uploads directory');
}

app.use('/uploads', express.static(uploadsPath));
app.use('/assets', express.static(assetsPath));

// ✅ Root health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🚀 JODI Server is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    cors: "enabled",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      api: "/api",
      auth: "/api/auth",
      users: "/api/users",
      people: "/api/people",
      pdf: "/api/pdf",
    },
  });
});

// ✅ Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    cors: "enabled",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
    memory: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
    routes: "loaded",
    allowedOrigins: allowedOrigins
  });
});

// ✅ CORS test endpoint
app.get("/cors-test", (req, res) => {
  console.log("🧪 CORS test endpoint hit from:", req.headers.origin);
  res.status(200).json({
    message: "✅ CORS is working!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// ✅ API test route
app.get("/api/test", (req, res) => {
  console.log("🧪 API test route hit");
  res.status(200).json({
    message: "✅ API is working perfectly!",
    cors: "enabled",
    timestamp: new Date().toISOString(),
    server: "JODI Backend v1.0.0"
  });
});

// ✅ Keep-alive endpoint for Render
app.get("/keep-alive", (req, res) => {
  console.log("💓 Keep-alive ping received");
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// ✅ Load routes with comprehensive error handling
console.log("🔄 Loading application routes...");

// Auth routes
try {
  const authRoutes = require("./routes/authRoutes");
  app.use("/api/auth", authRoutes);
  console.log("✅ Auth routes mounted at /api/auth");
} catch (error) {
  console.error("❌ Failed to load auth routes:", error.message);
  
  // Create basic fallback auth routes
  app.post("/api/auth/login", (req, res) => {
    res.status(501).json({ 
      message: "Auth routes not implemented yet",
      error: "Auth module not found" 
    });
  });
  
  app.post("/api/auth/register", (req, res) => {
    res.status(501).json({ 
      message: "Auth routes not implemented yet",
      error: "Auth module not found" 
    });
  });
}

// User routes
try {
  const userRoutes = require("./routes/userRoutes");
  app.use("/api/users", userRoutes);
  console.log("✅ User routes mounted at /api/users");
} catch (error) {
  console.error("⚠️ User routes not available:", error.message);
  app.get("/api/users", (req, res) => {
    res.status(501).json({ message: "User routes not implemented yet" });
  });
}

// Person routes - CRITICAL
try {
  const personRoutes = require("./routes/personRoutes");
  app.use("/api/people", personRoutes);
  console.log("✅ Person routes mounted at /api/people");
} catch (error) {
  console.error("❌ Failed to load person routes:", error.message);
  
  // Create emergency fallback
  app.get("/api/people", async (req, res) => {
    try {
      const Person = require("./models/personModel");
      const people = await Person.find().sort({ createdAt: -1 });
      res.json(people);
    } catch (err) {
      res.status(500).json({ 
        message: "Person routes not properly configured", 
        error: err.message 
      });
    }
  });
  
  app.post("/api/people", (req, res) => {
    res.status(501).json({ 
      message: "Person creation not available", 
      error: "Person routes not loaded" 
    });
  });
}

// PDF routes
try {
  const pdfRoutes = require("./routes/pdfRoutes");
  app.use("/api/pdf", pdfRoutes);
  console.log("✅ PDF routes mounted at /api/pdf");
} catch (error) {
  console.error("⚠️ PDF routes not available:", error.message);
  app.get("/api/pdf/person/:id/pdf", (req, res) => {
    res.status(501).json({ message: "PDF generation not implemented yet" });
  });
}

// ✅ MongoDB Connection
console.log("🔄 Connecting to MongoDB...");

const connectDB = async (retries = 5) => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not set");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });

    console.log("✅ MongoDB connected successfully");
    console.log("🗃️ Database:", mongoose.connection.name);

    await mongoose.connection.db.admin().ping();
    console.log("🏓 MongoDB ping successful");

    await seedAdminUsers();
    
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    
    if (retries > 0) {
      console.log(`🔄 Retrying MongoDB connection in 5 seconds... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error("💥 MongoDB connection failed after all retries");
      console.log("🚨 Server will continue running for debugging purposes");
    }
  }
};

// Admin user seeding
async function seedAdminUsers() {
  try {
    const bcrypt = require("bcrypt");
    const User = require("./models/userModel");

    const admins = [
      { name: "Akshat", email: "akshat@gmail.com", password: "admin123" },
      { name: "Mannat", email: "mannat@gmail.com", password: "mannat@123" },
    ];

    for (let admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await User.findOneAndUpdate(
        { email: admin.email },
        {
          name: admin.name,
          email: admin.email,
          password: hashedPassword,
          isAdmin: true,
        },
        { upsert: true, new: true }
      );
      console.log(`👑 Admin ensured: ${admin.email}`);
    }
    console.log("✅ Admin seeding completed");
  } catch (err) {
    console.error("❌ Admin seeding failed:", err.message);
  }
}

connectDB();

// ✅ MongoDB event listeners
mongoose.connection.on("connected", () => {
  console.log("📊 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("📊 Mongoose disconnected from MongoDB");
});

// ✅ Global error handler with CORS headers
app.use((err, req, res, next) => {
  console.error("💥 Global error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  // Ensure CORS headers in error responses
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    timestamp: new Date().toISOString()
  });
});

// ✅ 404 handler with CORS headers
app.use("*", (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "GET /",
      "GET /health", 
      "GET /cors-test",
      "GET /api/test",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/users",
      "GET /api/people",
      "POST /api/people",
      "PUT /api/people/:id",
      "DELETE /api/people/:id",
      "GET /api/pdf/person/:id/pdf"
    ],
  });
});

// ✅ Graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

function gracefulShutdown() {
  console.log("🛑 Shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("📊 MongoDB connection closed");
    process.exit(0);
  });
}

// ✅ Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 CORS Test: http://localhost:${PORT}/cors-test`);
  console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`👥 People: http://localhost:${PORT}/api/people`);
  console.log(`📄 PDF: http://localhost:${PORT}/api/pdf`);
  console.log(`📊 CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`💓 Keep-alive: http://localhost:${PORT}/keep-alive`);
  console.log(`🎯 Ready to accept connections!\n`);
});

server.on("error", (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error("❌ Server startup error:", err);
  }
});

server.timeout = 120000; // 2 minutes

module.exports = app;