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

router.get("/", getPeople);
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.array("photos", 10),
  addPerson
);
router.put("/:id", verifyToken, verifyAdmin, updatePerson);
router.delete("/:id", verifyToken, verifyAdmin, deletePerson);

module.exports = router;
