const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables first
dotenv.config();

const app = express();

console.log("🔄 Starting server setup...");

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

// ✅ Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// ✅ Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', cors: 'working' });
});

console.log("🔄 Loading routes...");

// ✅ Import routes one by one to identify the problematic one
try {
  const authRoutes = require("./routes/authRoutes");
  console.log("✅ Auth routes loaded");
  app.use("/api/auth", authRoutes);
} catch (error) {
  console.error("❌ Error loading auth routes:", error.message);
}

try {
  const userRoutes = require("./routes/userRoutes");
  console.log("✅ User routes loaded");
  app.use("/api/users", userRoutes);
} catch (error) {
  console.error("❌ Error loading user routes:", error.message);
}

try {
  const personRoutes = require("./routes/personRoutes");
  console.log("✅ Person routes loaded");
  app.use("/api/people", personRoutes);
} catch (error) {
  console.error("❌ Error loading person routes:", error.message);
}

try {
  const pdfRoutes = require("./routes/pdfRoutes");
  console.log("✅ PDF routes loaded");
  app.use("/api/pdf", pdfRoutes); // ✅ This should be /api/pdf, not /api/people
} catch (error) {
  console.error("❌ Error loading PDF routes:", error.message);
}
// ✅ MongoDB Connection
console.log("🔄 Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Admin user seeding
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
    } catch (err) {
      console.error("❌ Error seeding admin users:", err.message);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
console.log(`🌍 Starting server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});