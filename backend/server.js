const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const { createClient } = require('@supabase/supabase-js');

// Load environment variables first
dotenv.config();

const app = express();

console.log("🔄 Starting server setup...");
console.log("🌍 Environment:", process.env.NODE_ENV || "development");
console.log("📡 Port:", process.env.PORT || 5000);

// 🆓 SUPABASE CONFIGURATION
const supabaseUrl = process.env.SUPABASE_URL || 'https://anjowgqnhyatiltnencb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuam93Z3FuaHlhdGlsdG5lbmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTM0MDQsImV4cCI6MjA3MTUyOTQwNH0.xccgtRzzj8QWdfo2ivmycYAUIK3L_KUYO_emOnzq1ZE';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("🆓 Supabase configured:", supabaseUrl);

// ✅ RENDER-SPECIFIC CORS FIX
const allowedOrigins = [
  "https://jodi-iexr.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:3001",
];

// ✅ CRITICAL FIX: Custom CORS middleware for Render
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Always set CORS headers, regardless of origin
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (process.env.NODE_ENV === "development") {
    // In development, allow any origin
    res.header("Access-Control-Allow-Origin", origin || "*");
  } else {
    // In production, set the main frontend origin as default
    res.header("Access-Control-Allow-Origin", "https://jodi-iexr.vercel.app");
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-HTTP-Method-Override"
  );
  res.header("Access-Control-Expose-Headers", "Content-Length, X-Foo, X-Bar");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours

  console.log(
    `🔄 CORS Headers Set for: ${req.method} ${req.url} from origin: ${origin}`
  );

  // Handle preflight requests immediately
  if (req.method === "OPTIONS") {
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
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-HTTP-Method-Override",
  ],
};

app.use(cors(corsOptions));

// ✅ Body parsing middleware with increased limits
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Request logging middleware
app.use((req, res, next) => {
  console.log(
    `📥 ${new Date().toISOString()} - ${req.method} ${req.url} from ${
      req.headers.origin || "unknown"
    }`
  );
  next();
});

// ✅ REMOVED: Local static file serving (now using Supabase)
// We no longer need uploads directory or static file serving
console.log("📁 Using Supabase Storage instead of local uploads");

// ✅ Root health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🚀 JODI Server is running with Supabase!",
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    cors: "enabled",
    storage: "Supabase",
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

// ✅ Health check endpoint with Supabase status
app.get("/health", async (req, res) => {
  let supabaseStatus = "unknown";
  
  try {
    // Test Supabase connection
    const { data, error } = await supabase.storage.listBuckets();
    supabaseStatus = error ? "error" : "connected";
  } catch (err) {
    supabaseStatus = "failed";
  }

  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    cors: "enabled",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    supabase: supabaseStatus,
    uptime: Math.floor(process.uptime()),
    memory: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
    routes: "loaded",
    allowedOrigins: allowedOrigins,
  });
});

// ✅ CORS test endpoint
app.get("/cors-test", (req, res) => {
  console.log("🧪 CORS test endpoint hit from:", req.headers.origin);
  res.status(200).json({
    message: "✅ CORS is working!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: req.headers,
  });
});

// ✅ API test route
app.get("/api/test", (req, res) => {
  console.log("🧪 API test route hit");
  res.status(200).json({
    message: "✅ API is working perfectly!",
    cors: "enabled",
    storage: "Supabase",
    timestamp: new Date().toISOString(),
    server: "JODI Backend v1.0.0",
  });
});

// ✅ Keep-alive endpoint for Render
app.get("/keep-alive", (req, res) => {
  console.log("💓 Keep-alive ping received");
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ✅ Supabase test endpoint
app.get("/supabase-test", async (req, res) => {
  try {
    console.log("🧪 Testing Supabase connection...");
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }

    res.status(200).json({
      message: "✅ Supabase connection successful!",
      buckets: buckets.map(bucket => bucket.name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Supabase test failed:", error);
    res.status(500).json({
      message: "❌ Supabase connection failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
      error: "Auth module not found",
    });
  });

  app.post("/api/auth/register", (req, res) => {
    res.status(501).json({
      message: "Auth routes not implemented yet",
      error: "Auth module not found",
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

// Person routes - CRITICAL (Updated for Supabase)
try {
  const personRoutes = require("./routes/personRoutes");
  app.use("/api/people", personRoutes);
  console.log("✅ Person routes mounted at /api/people (Supabase enabled)");
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
        error: err.message,
      });
    }
  });

  app.post("/api/people", (req, res) => {
    res.status(501).json({
      message: "Person creation not available",
      error: "Person routes not loaded",
    });
  });
}

// ✅ PDF routes (Updated for Supabase)
try {
  const pdfRoutes = require("./routes/pdfRoutes");
  app.use("/api/pdf", pdfRoutes);
  console.log("✅ PDF routes mounted at /api/pdf (Supabase enabled)");

  console.log("🧪 Testing PDF route availability...");
} catch (error) {
  console.error("❌ Failed to load PDF routes:", error.message);
  console.error("❌ PDF Route Error Stack:", error.stack);

  // ✅ CRITICAL: Create emergency PDF fallback
  app.get("/api/pdf/person/:id/pdf", (req, res) => {
    console.error(
      "🚨 PDF route fallback triggered - main PDF module failed to load"
    );
    res.status(500).json({
      message: "PDF generation module failed to load",
      error: "PDF routes could not be initialized",
      details: error.message,
    });
  });

  app.post("/api/pdf/bulk", (req, res) => {
    console.error("🚨 Bulk PDF route fallback triggered");
    res.status(500).json({
      message: "Bulk PDF generation module failed to load",
      error: "PDF routes could not be initialized",
    });
  });
}

// ✅ Additional route verification
app.get("/api/routes-test", (req, res) => {
  const routes = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods),
      });
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const basePath = middleware.regexp.source
            .replace("^\\", "")
            .replace("\\/?(?=\\/|$)", "")
            .replace(/\\\//g, "/");
          routes.push({
            path: basePath + handler.route.path,
            methods: Object.keys(handler.route.methods),
          });
        }
      });
    }
  });

  res.json({
    message: "Available routes",
    routes: routes,
    count: routes.length,
    storage: "Supabase",
  });
});

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
      family: 4,
    });

    console.log("✅ MongoDB connected successfully");
    console.log("🗃️ Database:", mongoose.connection.name);

    await mongoose.connection.db.admin().ping();
    console.log("🏓 MongoDB ping successful");

    await seedAdminUsers();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);

    if (retries > 0) {
      console.log(
        `🔄 Retrying MongoDB connection in 5 seconds... (${retries} attempts left)`
      );
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error("💥 MongoDB connection failed after all retries");
      console.log("🚨 Server will continue running for debugging purposes");
    }
  }
};

// ✅ Admin user seeding with correct credentials
async function seedAdminUsers() {
  try {
    const bcrypt = require("bcrypt");
    const User = require("./models/userModel");

    const admins = [
      { name: "Akshat", email: "akshat@gmail.com", password: "admin123" },
      { name: "Mannat", email: "mannat@gmail.com", password: "mannat@123" },
      { name: "Jodi Admin", email: "jodi@gmail.com", password: "mamta1947" },
    ];

    console.log("👑 Starting admin user seeding process...");

    for (let admin of admins) {
      console.log(
        `🔄 Processing admin: ${admin.email} with password: ${admin.password}`
      );

      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        console.log(`🔐 Password hashed for: ${admin.email}`);

        // Use findOneAndUpdate with upsert to create or update admin
        const result = await User.findOneAndUpdate(
          { email: admin.email },
          {
            name: admin.name,
            email: admin.email,
            password: hashedPassword,
            isAdmin: true,
            createdAt: new Date(),
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

        console.log(
          `✅ Admin ${result.isModified ? "updated" : "created"}: ${
            admin.email
          }`
        );

        // Verify password immediately after creation/update
        const isPasswordCorrect = await bcrypt.compare(
          admin.password,
          result.password
        );
        console.log(
          `🧪 Password verification for ${admin.email}: ${
            isPasswordCorrect ? "✅ CORRECT" : "❌ INCORRECT"
          }`
        );

        if (!isPasswordCorrect) {
          console.error(
            `🚨 PASSWORD MISMATCH for ${admin.email}! Re-hashing...`
          );
          const newHash = await bcrypt.hash(admin.password, 10);
          await User.findByIdAndUpdate(result._id, { password: newHash });
          console.log(`🔄 Password re-hashed for ${admin.email}`);
        }
      } catch (adminError) {
        console.error(
          `❌ Failed to process admin ${admin.email}:`,
          adminError.message
        );
      }
    }

    console.log("✅ Admin seeding process completed");

    // Verification: Check all admin accounts
    console.log("🔍 Verifying admin accounts in database...");

    const adminUsers = await User.find({ isAdmin: true }).select(
      "name email isAdmin createdAt"
    );
    console.log(`👑 Found ${adminUsers.length} admin users:`);

    adminUsers.forEach((user) => {
      console.log(
        `   📧 ${user.email} (${user.name}) - Admin: ${user.isAdmin}`
      );
    });

    // Test login credentials
    console.log("🧪 Testing admin login credentials...");

    for (let admin of admins) {
      try {
        const user = await User.findOne({ email: admin.email });
        if (user) {
          const isValid = await bcrypt.compare(admin.password, user.password);
          console.log(
            `🔐 Login test for ${admin.email}: ${
              isValid ? "✅ SUCCESS" : "❌ FAILED"
            }`
          );

          if (!isValid) {
            console.error(`🚨 CRITICAL: Login will fail for ${admin.email}`);
            console.error(`   Expected password: "${admin.password}"`);
            console.error(`   Password length: ${admin.password.length}`);
          }
        } else {
          console.error(`❌ Admin user not found: ${admin.email}`);
        }
      } catch (testError) {
        console.error(
          `❌ Login test failed for ${admin.email}:`,
          testError.message
        );
      }
    }
  } catch (err) {
    console.error("❌ Admin seeding failed:", err.message);
    console.error("❌ Admin seeding error stack:", err.stack);
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
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }

  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

// ✅ 404 handler with CORS headers
app.use("*", (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
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
      "GET /supabase-test",
      "GET /api/routes-test",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/users",
      "GET /api/people",
      "POST /api/people",
      "PUT /api/people/:id",
      "DELETE /api/people/:id",
      "GET /api/pdf/person/:id/pdf",
      "POST /api/pdf/bulk",
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
  console.log(`\n🚀 Server running on port ${PORT} with Supabase Storage!`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 CORS Test: http://localhost:${PORT}/cors-test`);
  console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
  console.log(`🆓 Supabase Test: http://localhost:${PORT}/supabase-test`);
  console.log(`🧪 Routes Test: http://localhost:${PORT}/api/routes-test`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`👥 People: http://localhost:${PORT}/api/people`);
  console.log(`📄 PDF: http://localhost:${PORT}/api/pdf`);
  console.log(`📊 CORS enabled for: ${allowedOrigins.join(", ")}`);
  console.log(`💓 Keep-alive: http://localhost:${PORT}/keep-alive`);
  console.log(`\n👑 Admin Accounts Configured:`);
  console.log(`   📧 akshat@gmail.com - Password: admin123`);
  console.log(`   📧 mannat@gmail.com - Password: mannat@123`);
  console.log(`   📧 jodi@gmail.com - Password: mamta1947`);
  console.log(`🆓 Storage: Supabase (Free Tier - 1GB storage)`);
  console.log(`🎯 Ready to accept connections!\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error("❌ Server startup error:", err);
  }
});

server.timeout = 120000; // 2 minutes

// ✅ Export app for reuse
module.exports = { app, supabase };