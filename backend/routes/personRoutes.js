// routes/personRoutes.js
const express = require("express");
const Person = require("../models/personModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

console.log("📋 Loading person routes...");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Created uploads directory");
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// ✅ CRITICAL FIX: Statistics route MUST come BEFORE /:id route
router.get("/stats/overview", async (req, res) => {
  try {
    console.log("📊 Fetching people statistics");
    
    const totalPeople = await Person.countDocuments();
    const genderStats = await Person.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]);
    const religionStats = await Person.aggregate([
      { $group: { _id: "$religion", count: { $sum: 1 } } }
    ]);
    const maritalStatusStats = await Person.aggregate([
      { $group: { _id: "$maritalStatus", count: { $sum: 1 } } }
    ]);
    
    res.status(200).json({
      total: totalPeople,
      gender: genderStats,
      religion: religionStats,
      maritalStatus: maritalStatusStats
    });
  } catch (error) {
    console.error("❌ Error fetching statistics:", error);
    res.status(500).json({
      message: "Failed to fetch statistics",
      error: error.message
    });
  }
});

// ✅ Test route for debugging
router.get("/test/connection", async (req, res) => {
  try {
    const count = await Person.countDocuments();
    res.status(200).json({
      message: "✅ Person routes are working perfectly!",
      totalPeople: count,
      timestamp: new Date().toISOString(),
      database: "connected",
      cors: "enabled"
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Database connection issue",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/people - Get all people with optional filtering
router.get("/", async (req, res) => {
  try {
    console.log("📋 Fetching people with filters:", req.query);
    
    // Build filter object from query parameters
    const filters = {};
    
    // Add filters based on query parameters
    if (req.query.gender) filters.gender = req.query.gender;
    if (req.query.religion) filters.religion = req.query.religion;
    if (req.query.caste) filters.caste = req.query.caste;
    if (req.query.maritalStatus) filters.maritalStatus = req.query.maritalStatus;
    if (req.query.state) filters.state = req.query.state;
    if (req.query.area) filters.area = req.query.area;
    if (req.query.nativePlace) filters.nativePlace = req.query.nativePlace;
    
    // Age range filtering
    if (req.query.minAge || req.query.maxAge) {
      const ageFilter = {};
      if (req.query.minAge) ageFilter.$gte = req.query.minAge;
      if (req.query.maxAge) ageFilter.$lte = req.query.maxAge;
      filters.age = ageFilter;
    }
    
    // Height range filtering
    if (req.query.minHeight || req.query.maxHeight) {
      const heightFilter = {};
      if (req.query.minHeight) heightFilter.$gte = req.query.minHeight;
      if (req.query.maxHeight) heightFilter.$lte = req.query.maxHeight;
      filters.height = heightFilter;
    }
    
    // Text search in name
    if (req.query.search) {
      filters.name = { $regex: req.query.search, $options: "i" };
    }
    
    console.log("🔍 Applied filters:", filters);
    
    const people = await Person.find(filters)
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance
    
    console.log(`✅ Found ${people.length} people`);
    
    res.status(200).json(people);
  } catch (error) {
    console.error("❌ Error fetching people:", error);
    res.status(500).json({
      message: "Failed to fetch people",
      error: error.message
    });
  }
});

// GET /api/people/:id - Get a specific person
router.get("/:id", async (req, res) => {
  try {
    console.log("👤 Fetching person with ID:", req.params.id);
    
    const person = await Person.findById(req.params.id);
    
    if (!person) {
      return res.status(404).json({
        message: "Person not found"
      });
    }
    
    console.log("✅ Person found:", person.name);
    res.status(200).json(person);
  } catch (error) {
    console.error("❌ Error fetching person:", error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: "Person not found"
      });
    }
    
    res.status(500).json({
      message: "Failed to fetch person",
      error: error.message
    });
  }
});

// POST /api/people - Create a new person
router.post("/", upload.array("photos", 5), async (req, res) => {
  try {
    console.log("👤 Creating new person:", req.body.name);
    
    const personData = { ...req.body };
    
    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      personData.photos = req.files.map(file => file.filename);
      personData.profilePicture = req.files[0].filename; // Use first photo as profile picture
      console.log("📸 Uploaded photos:", personData.photos);
    }
    
    // Handle siblings data if it's a JSON string
    if (req.body.siblings && typeof req.body.siblings === 'string') {
      try {
        personData.siblings = JSON.parse(req.body.siblings);
      } catch (e) {
        console.warn("⚠️ Failed to parse siblings data:", e.message);
      }
    }
    
    const person = new Person(personData);
    await person.save();
    
    console.log("✅ Person created successfully:", person.name);
    res.status(201).json({
      message: "Person created successfully",
      person: person
    });
  } catch (error) {
    console.error("❌ Error creating person:", error);
    
    // Clean up uploaded files if person creation failed
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(uploadsDir, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    res.status(400).json({
      message: "Failed to create person",
      error: error.message
    });
  }
});

// PUT /api/people/:id - Update a person
router.put("/:id", upload.array("photos", 5), async (req, res) => {
  try {
    console.log("✏️ Updating person:", req.params.id);
    
    const updateData = { ...req.body };
    updateData.updatedAt = Date.now();
    
    // Handle new uploaded files
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => file.filename);
      
      // Get existing person to handle old photos
      const existingPerson = await Person.findById(req.params.id);
      if (existingPerson && existingPerson.photos) {
        // Keep existing photos and add new ones
        updateData.photos = [...existingPerson.photos, ...newPhotos];
      } else {
        updateData.photos = newPhotos;
      }
      
      // Update profile picture if new photos uploaded
      if (!updateData.profilePicture && newPhotos.length > 0) {
        updateData.profilePicture = newPhotos[0];
      }
      
      console.log("📸 Updated photos:", updateData.photos);
    }
    
    // Handle siblings data if it's a JSON string
    if (req.body.siblings && typeof req.body.siblings === 'string') {
      try {
        updateData.siblings = JSON.parse(req.body.siblings);
      } catch (e) {
        console.warn("⚠️ Failed to parse siblings data:", e.message);
      }
    }
    
    const person = await Person.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!person) {
      return res.status(404).json({
        message: "Person not found"
      });
    }
    
    console.log("✅ Person updated successfully:", person.name);
    res.status(200).json({
      message: "Person updated successfully",
      person: person
    });
  } catch (error) {
    console.error("❌ Error updating person:", error);
    
    // Clean up uploaded files if update failed
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(uploadsDir, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: "Person not found"
      });
    }
    
    res.status(400).json({
      message: "Failed to update person",
      error: error.message
    });
  }
});

// DELETE /api/people/:id - Delete a person
router.delete("/:id", async (req, res) => {
  try {
    console.log("🗑️ Deleting person:", req.params.id);
    
    const person = await Person.findById(req.params.id);
    
    if (!person) {
      return res.status(404).json({
        message: "Person not found"
      });
    }
    
    // Delete associated photo files
    if (person.photos && person.photos.length > 0) {
      person.photos.forEach(photoFilename => {
        const photoPath = path.join(uploadsDir, photoFilename);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
          console.log("🗑️ Deleted photo:", photoFilename);
        }
      });
    }
    
    // Delete the person record
    await Person.findByIdAndDelete(req.params.id);
    
    console.log("✅ Person deleted successfully:", person.name);
    res.status(200).json({
      message: "Person deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting person:", error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: "Person not found"
      });
    }
    
    res.status(500).json({
      message: "Failed to delete person",
      error: error.message
    });
  }
});

// DELETE /api/people/:id/photo/:filename - Delete a specific photo
router.delete("/:id/photo/:filename", async (req, res) => {
  try {
    const { id, filename } = req.params;
    console.log(`🗑️ Deleting photo ${filename} from person ${id}`);
    
    const person = await Person.findById(id);
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }
    
    // Remove photo from array
    person.photos = person.photos.filter(photo => photo !== filename);
    
    // Update profile picture if it was the deleted photo
    if (person.profilePicture === filename) {
      person.profilePicture = person.photos.length > 0 ? person.photos[0] : null;
    }
    
    await person.save();
    
    // Delete the actual file
    const photoPath = path.join(uploadsDir, filename);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
    
    console.log("✅ Photo deleted successfully");
    res.status(200).json({
      message: "Photo deleted successfully",
      person: person
    });
  } catch (error) {
    console.error("❌ Error deleting photo:", error);
    res.status(500).json({
      message: "Failed to delete photo",
      error: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum is 5 photos.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      message: 'Only image files are allowed!'
    });
  }
  
  next(error);
});

console.log("✅ Person routes loaded successfully");

module.exports = router;