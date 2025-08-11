// routes/personRoutes.js
const express = require("express");
const {
  getPeople,
  addPerson,
  updatePerson,
  deletePerson,
} = require("../controllers/personController");
const upload = require("../middleware/uploadMiddleware");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Get all people
router.get("/", getPeople);

// 📌 Add a person (Admin only, with file upload)
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.array("photos", 10),
  addPerson
);

// 📌 Update a person (Admin only)
router.put("/:id", verifyToken, verifyAdmin, updatePerson);

// 📌 Delete a person (Admin only)
router.delete("/:id", verifyToken, verifyAdmin, deletePerson);

module.exports = router;
