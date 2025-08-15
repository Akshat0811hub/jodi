// /backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

const pdfRoutes = require("./routes/pdfRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const personRoutes = require("./routes/personRoutes");

dotenv.config();

const app = express();

// ✅ CORS setup for frontend (Vercel)
app.use(cors({
  origin: ["https://jodi-iexr.vercel.app"], // frontend domain
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ✅ Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets"))); // if using assets for logo

// ✅ MongoDB Connection (Atlas Ready)
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB connected");

    // ===== ADMIN USER SEEDING =====
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
    // =============================

  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // stop server if DB fails
  });

// ✅ TEST ROUTE (Temporary - Delete after testing)
app.get("/api/test-insert", async (req, res) => {
  try {
    const TestSchema = new mongoose.Schema({ name: String, age: Number });
    const TestModel = mongoose.model("TestUser", TestSchema);
    const newDoc = new TestModel({ name: "Test User", age: 25 });
    await newDoc.save();
    res.json({ message: "✅ Test document inserted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/people", personRoutes);
app.use("/api/people", pdfRoutes); // ✅ Only once

const PORT = process.env.PORT || 5000;
console.log(`🌍 BASE_URL set to: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
