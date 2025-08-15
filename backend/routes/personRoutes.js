// routes/personRoutes.js
const express = require("express");
const {
  getPeople,
  updatePerson,
  deletePerson,
} = require("../controllers/personController");
const upload = require("../middleware/uploadMiddleware");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const Person = require("../models/personModel");

const router = express.Router();

// 📌 Get all people
router.get("/", getPeople);

// 📌 Add a person (Admin only, with file upload)
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.array("photos", 10),
  async (req, res) => {
    try {
      // File URLs banake store kar rahe
      const photoUrls = req.files.map(
        (file) => `${process.env.REACT_APP_API_URL}/uploads/${file.filename}`
      );

      const newPerson = new Person({
        ...req.body,
        photos: photoUrls,
      });

      await newPerson.save();
      res.status(201).json(newPerson);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

// 📌 Update a person (Admin only)
router.put("/:id", verifyToken, verifyAdmin, updatePerson);

// 📌 Delete a person (Admin only)
router.delete("/:id", verifyToken, verifyAdmin, deletePerson);

module.exports = router;
