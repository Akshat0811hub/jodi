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

// ✅ Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Simplified CORS configuration
app.use(cors({
  origin: [
    "https://jodi-iexr.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// ✅ Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
  next();
});

// ✅ Static file serving - IMPORTANT: Make sure uploads directory exists
const uploadsPath = path.join(__dirname, 'uploads');
const assetsPath = path.join(__dirname, 'assets');

// Create directories if they don't exist
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
    memory: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + "MB"
  });
});

// ✅ API test route - IMPORTANT: This matches your frontend call
app.get("/api/test", (req, res) => {
  console.log("🧪 API test route hit");
  res.status(200).json({
    message: "✅ API is working perfectly!",
    cors: "enabled",
    timestamp: new Date().toISOString(),
    server: "JODI Backend v1.0.0"
  });
});

// ✅ Load routes with better error handling
console.log("🔄 Loading application routes...");

// Auth routes
try {
  const authRoutes = require("./routes/authRoutes");
  app.use("/api/auth", authRoutes);
  console.log("✅ Auth routes mounted at /api/auth");
} catch (error) {
  console.error("❌ Failed to load auth routes:", error.message);
  // Create a basic auth route if file doesn't exist
  app.post("/api/auth/login", (req, res) => {
    res.status(501).json({ message: "Auth routes not implemented yet" });
  });
}

// User routes
try {
  const userRoutes = require("./routes/userRoutes");
  app.use("/api/users", userRoutes);
  console.log("✅ User routes mounted at /api/users");
} catch (error) {
  console.error("⚠️ User routes not available:", error.message);
  // Create a basic user route if file doesn't exist
  app.get("/api/users", (req, res) => {
    res.status(501).json({ message: "User routes not implemented yet" });
  });
}

// Person routes - CRITICAL: This is what's missing!
try {
  const personRoutes = require("./routes/personRoutes");
  app.use("/api/people", personRoutes);
  console.log("✅ Person routes mounted at /api/people");
} catch (error) {
  console.error("❌ Failed to load person routes:", error.message);
  console.error("This is likely why you're getting 404 errors!");
  
  // Create a basic person route as fallback
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
}

// PDF routes
try {
  const pdfRoutes = require("./routes/pdfRoutes");
  app.use("/api/pdf", pdfRoutes);
  console.log("✅ PDF routes mounted at /api/pdf");
} catch (error) {
  console.error("⚠️ PDF routes not available:", error.message);
  // Create a basic PDF route if file doesn't exist
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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connected successfully");
    console.log("🗃️ Database:", mongoose.connection.name);

    // Seed admin users
    await seedAdminUsers();
    
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    
    if (retries > 0) {
      console.log(`🔄 Retrying in 5 seconds... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error("💥 MongoDB connection failed after all retries");
      process.exit(1);
    }
  }
};

// Admin user seeding function
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

// Start database connection
connectDB();

// ✅ MongoDB event listeners
mongoose.connection.on("connected", () => {
  console.log("📊 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("📊 Mongoose disconnected");
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Global error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// ✅ 404 handler
app.use("*", (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "GET /",
      "GET /health", 
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
  console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`👥 People: http://localhost:${PORT}/api/people`);
  console.log(`📄 PDF: http://localhost:${PORT}/api/pdf`);
  console.log(`📊 Ready to accept connections!\n`);
});

server.on("error", (err) => {
  console.error("❌ Server startup error:", err);
});

module.exports = app;