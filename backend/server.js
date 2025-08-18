const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables first
dotenv.config();

const app = express();

console.log("🔄 Starting server setup...");
console.log("🌍 Environment:", process.env.NODE_ENV || 'development');
console.log("📡 Port:", process.env.PORT || 5000);

// ✅ Enhanced CORS configuration
app.use(cors({
  origin: [
    "https://jodi-iexr.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://jodi-iexr.vercel.app/",
    // Add any other frontend URLs you might use
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  // Handle preflight requests
  optionsSuccessStatus: 200
}));

// ✅ Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', true);
  res.sendStatus(200);
});

// ✅ Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Enhanced security headers
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// ✅ Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ✅ Static file serving with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// ✅ Root health check
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running!',
    status: 'OK', 
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      people: '/api/people',
      pdf: '/api/pdf'
    }
  });
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// ✅ API test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    cors: 'working',
    timestamp: new Date().toISOString()
  });
});

console.log("🔄 Loading routes...");

// ✅ Load routes with proper error handling
try {
  const authRoutes = require("./routes/authRoutes");
  console.log("✅ Auth routes loaded successfully");
  app.use("/api/auth", authRoutes);
  console.log("🔧 Auth routes mounted at /api/auth");
} catch (error) {
  console.error("❌ Error loading auth routes:", error.message);
  console.error("❌ Stack:", error.stack);
  process.exit(1); // Exit if critical routes fail to load
}

try {
  const userRoutes = require("./routes/userRoutes");
  console.log("✅ User routes loaded successfully");
  app.use("/api/users", userRoutes);
  console.log("🔧 User routes mounted at /api/users");
} catch (error) {
  console.error("❌ Error loading user routes:", error.message);
  // Don't exit - this might be optional
}

try {
  const personRoutes = require("./routes/personRoutes");
  console.log("✅ Person routes loaded successfully");
  app.use("/api/people", personRoutes);
  console.log("🔧 Person routes mounted at /api/people");
} catch (error) {
  console.error("❌ Error loading person routes:", error.message);
  console.warn("⚠️ Person routes not available");
}

try {
  const pdfRoutes = require("./routes/pdfRoutes");
  console.log("✅ PDF routes loaded successfully");
  app.use("/api/pdf", pdfRoutes);
  console.log("🔧 PDF routes mounted at /api/pdf");
} catch (error) {
  console.error("❌ Error loading PDF routes:", error.message);
  console.warn("⚠️ PDF routes not available");
}

// ✅ MongoDB Connection with retry logic
console.log("🔄 Connecting to MongoDB...");
console.log("📍 MongoDB URI exists:", !!process.env.MONGO_URI);

const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log("✅ MongoDB connected successfully");
    console.log("🔗 Connected to:", mongoose.connection.name);

    // ✅ Admin user seeding
    try {
      const bcrypt = require("bcrypt");
      const User = require("./models/userModel");

      const admins = [
        { name: "Akshat", email: "akshat@gmail.com", password: "admin123" },
        { name: "Mannat", email: "mannat@gmail.com", password: "mannat@123" }
      ];

      for (let admin of admins) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await User.findOneAndUpdate(
          { email: admin.email },
          {
            name: admin.name,
            email: admin.email,
            password: hashedPassword,
            isAdmin: true
          },
          { upsert: true, new: true }
        );
        console.log(`👑 Admin user ensured: ${admin.email}`);
      }
      console.log("✅ Admin seeding completed");
    } catch (err) {
      console.error("❌ Error seeding admin users:", err.message);
    }
    
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    
    if (retries > 0) {
      console.log(`🔄 Retrying MongoDB connection in 5 seconds... (${retries} retries left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error("💥 Failed to connect to MongoDB after multiple attempts");
      process.exit(1);
    }
  }
};

// Start MongoDB connection
connectDB();

// ✅ MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📊 Mongoose disconnected');
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Global error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ 404 handler with helpful info
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /',
      'GET /health', 
      'GET /api/test',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/test'
    ]
  });
});

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
console.log(`🌍 Starting server on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 API test: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Auth test: http://localhost:${PORT}/api/auth/test`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

module.exports = app;