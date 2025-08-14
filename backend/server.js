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

app.use(cors());
app.use(express.json());

// ✅ Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets"))); // if using assets for logo

// ✅ Updated MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

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
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
