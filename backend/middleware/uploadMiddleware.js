// Backend route example - routes/people.js or similar
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const Person = require("../models/personModel"); // Adjust path as needed

// ✅ Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ✅ File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'), false);
  }
};

// ✅ Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 4 // Maximum 4 files
  },
  fileFilter: fileFilter
});

// ✅ POST /api/people - Create new person with photo upload
router.post('/people', upload.array('photos', 4), async (req, res) => {
  try {
    console.log("📤 Received POST /api/people request");
    console.log("📝 Form data keys:", Object.keys(req.body));
    console.log("📸 Files received:", req.files?.length || 0);

    // ✅ Validate required fields
    const { name, religion, phoneNumber } = req.body;
    
    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    
    if (!religion?.trim()) {
      return res.status(400).json({ message: "Religion is required" });
    }
    
    if (!phoneNumber?.trim()) {
      return res.status(400).json({ message: "Phone Number is required" });
    }
    
    if (!/^\d{1,10}$/.test(phoneNumber.trim())) {
      return res.status(400).json({ message: "Phone Number must be numeric and max 10 digits" });
    }

    // ✅ Validate photos
    if (!req.files || req.files.length < 3) {
      // Clean up any uploaded files if validation fails
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
      }
      return res.status(400).json({ 
        message: `Please upload at least 3 photos. Received: ${req.files?.length || 0}` 
      });
    }

    if (req.files.length > 4) {
      // Clean up files if too many
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      });
      return res.status(400).json({ message: "Maximum 4 photos allowed" });
    }

    // ✅ Process photo filenames
    const photoFilenames = req.files.map(file => file.filename);
    console.log("📸 Saved photo filenames:", photoFilenames);

    // ✅ Parse siblings if provided
    let siblings = [];
    if (req.body.siblings) {
      try {
        siblings = JSON.parse(req.body.siblings);
      } catch (error) {
        console.error("Error parsing siblings:", error);
        siblings = [];
      }
    }

    // ✅ Create person object
    const personData = {
      // Personal Details
      name: req.body.name?.trim(),
      gender: req.body.gender || "",
      maritalStatus: req.body.maritalStatus || "",
      dob: req.body.dob || "",
      birthPlaceTime: req.body.birthPlaceTime || "",
      nativePlace: req.body.nativePlace || "",
      gotra: req.body.gotra || "",
      religion: req.body.religion?.trim(),
      phoneNumber: req.body.phoneNumber?.trim(),
      height: req.body.height || "",
      complexion: req.body.complexion || "",
      horoscope: req.body.horoscope || "",
      eatingHabits: req.body.eatingHabits || "",
      drinkingHabits: req.body.drinkingHabits || "",
      smokingHabits: req.body.smokingHabits || "",
      disability: req.body.disability || "",
      nri: req.body.nri || "",
      vehicle: req.body.vehicle || "",
      
      // Family Details
      fatherName: req.body.fatherName || "",
      fatherOccupation: req.body.fatherOccupation || "",
      fatherOffice: req.body.fatherOffice || "",
      motherName: req.body.motherName || "",
      motherOccupation: req.body.motherOccupation || "",
      residence: req.body.residence || "",
      otherProperty: req.body.otherProperty || "",
      siblings: siblings,
      
      // Education
      higherQualification: req.body.higherQualification || "",
      graduation: req.body.graduation || "",
      schooling: req.body.schooling || "",
      
      // Profession & Income
      occupation: req.body.occupation || "",
      personalIncome: req.body.personalIncome || "",
      familyIncome: req.body.familyIncome || "",
      
      // Photos
      photos: photoFilenames,
      profilePicture: photoFilenames[0] || "" // Use first photo as profile picture
    };

    // ✅ Save to database
    const newPerson = new Person(personData);
    const savedPerson = await newPerson.save();
    
    console.log("✅ Person created successfully:", savedPerson._id);
    
    res.status(201).json({
      message: "Person added successfully",
      person: savedPerson
    });

  } catch (error) {
    console.error("❌ Error creating person:", error);
    
    // ✅ Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting file on error:", err);
        });
      });
    }
    
    // ✅ Handle different error types
    if (error.code === 11000) {
      res.status(400).json({ message: "Person with this phone number already exists" });
    } else if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ message: `Validation error: ${errors.join(', ')}` });
    } else if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: "File too large. Maximum 5MB per photo." });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ message: "Too many files. Maximum 4 photos allowed." });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

// ✅ GET /api/people - Get all people
router.get('/people', async (req, res) => {
  try {
    const people = await Person.find().sort({ createdAt: -1 });
    res.json(people);
  } catch (error) {
    console.error("❌ Error fetching people:", error);
    res.status(500).json({ message: "Failed to fetch people" });
  }
});

// ✅ GET /api/people/:id - Get single person
router.get('/people/:id', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }
    res.json(person);
  } catch (error) {
    console.error("❌ Error fetching person:", error);
    res.status(500).json({ message: "Failed to fetch person" });
  }
});

module.exports = router;