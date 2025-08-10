// backend/routes/publicForm.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const Person = require("../models/Person");

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads")); // safer path
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Public POST (no login required)
router.post("/public-form", upload.array("photos", 10), async (req, res) => {
  try {
    const {
      name,
      age,
      height,
      religion,
      caste,
      maritalStatus,
      gender,
      state,
      country,
      area
    } = req.body;

    const newPerson = new Person({
      name,
      age,
      height,
      religion,
      caste,
      maritalStatus,
      gender,
      state,
      country,
      area,
      photo: req.files.map((f) => f.filename),
    });

    await newPerson.save();
    res.status(201).json({
      message: "Person added successfully (public)",
      person: newPerson,
    });
  } catch (error) {
    console.error("Error adding person (public):", error);
    res.status(500).json({ message: "Error adding person" });
  }
});

module.exports = router;
