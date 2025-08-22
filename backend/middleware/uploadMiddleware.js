const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const Person = require("../models/personModel");

// 🔧 FIXED: Ensure uploads directory exists with proper structure
const createUploadsDir = () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("✅ Created uploads directory:", uploadDir);
  }
  return uploadDir;
};

// 🔧 FIXED: Better multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = createUploadsDir();
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate clean, consistent filename
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const uniqueId = Math.round(Math.random() * 1E9);
    const filename = `photo_${timestamp}_${uniqueId}${ext}`;
    
    console.log(`📸 Saving file as: ${filename}`);
    cb(null, filename);
  }
});

// 🔧 FIXED: Better file validation
const fileFilter = (req, file, cb) => {
  console.log(`📸 Validating file: ${file.originalname}, Type: ${file.mimetype}`);
  
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log(`✅ File type valid: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.log(`❌ File type invalid: ${file.mimetype}`);
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF, and WebP are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 4
  },
  fileFilter: fileFilter
});

// 🔧 FIXED: Enhanced POST route with better photo handling
router.post('/people', upload.array('photos', 4), async (req, res) => {
  try {
    console.log("\n📤 ===== NEW PERSON CREATION REQUEST =====");
    console.log("📝 Form data received:", Object.keys(req.body));
    console.log("📸 Files received:", req.files?.length || 0);
    
    // Log each uploaded file
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        console.log(`📸 File ${index + 1}:`);
        console.log(`   Original: ${file.originalname}`);
        console.log(`   Saved as: ${file.filename}`);
        console.log(`   Path: ${file.path}`);
        console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
        
        // Verify file exists
        if (fs.existsSync(file.path)) {
          console.log(`   ✅ File verified on disk`);
        } else {
          console.log(`   ❌ File NOT found on disk!`);
        }
      });
    }

    // Basic validation
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

    // Photo validation
    if (!req.files || req.files.length < 1) {
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
      }
      return res.status(400).json({ 
        message: `Please upload at least 1 photo. Received: ${req.files?.length || 0}` 
      });
    }

    // 🔧 FIXED: Store ONLY filenames (not full paths) for consistency
    const photoFilenames = req.files.map(file => file.filename);
    console.log("📸 Photo filenames to store in DB:", photoFilenames);
    
    // Verify all files exist
    const missingFiles = [];
    photoFilenames.forEach((filename, index) => {
      const fullPath = path.join(process.cwd(), 'uploads', filename);
      if (!fs.existsSync(fullPath)) {
        missingFiles.push(`File ${index + 1}: ${filename}`);
      }
    });
    
    if (missingFiles.length > 0) {
      console.error("❌ Missing files after upload:", missingFiles);
      return res.status(500).json({ 
        message: "Some files were not saved properly",
        missingFiles: missingFiles
      });
    }

    // Parse siblings
    let siblings = [];
    if (req.body.siblings) {
      try {
        siblings = JSON.parse(req.body.siblings);
      } catch (error) {
        console.error("Error parsing siblings:", error);
        siblings = [];
      }
    }

    // 🔧 FIXED: Create person with consistent photo storage
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
      horoscope: req.body.horoscope === "true",
      eatingHabits: req.body.eatingHabits || "",
      drinkingHabits: req.body.drinkingHabits || "",
      smokingHabits: req.body.smokingHabits || "",
      disability: req.body.disability || "",
      nri: req.body.nri === "true",
      vehicle: req.body.vehicle === "true",
      
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
      
      // 🔧 FIXED: Store only filenames for better path resolution
      photos: photoFilenames,
      profilePicture: photoFilenames[0] || ""
    };

    // Save to database
    const newPerson = new Person(personData);
    const savedPerson = await newPerson.save();
    
    console.log("✅ Person created successfully with ID:", savedPerson._id);
    console.log("📸 Photos stored:", savedPerson.photos);
    console.log("📸 Profile picture:", savedPerson.profilePicture);
    
    // Final verification - check if files still exist
    console.log("\n🔍 Final file verification:");
    savedPerson.photos.forEach((filename, index) => {
      const fullPath = path.join(process.cwd(), 'uploads', filename);
      const exists = fs.existsSync(fullPath);
      console.log(`   ${index + 1}. ${filename}: ${exists ? '✅' : '❌'}`);
    });
    
    res.status(201).json({
      message: "Person added successfully",
      person: savedPerson,
      photosUploaded: photoFilenames.length
    });

  } catch (error) {
    console.error("❌ Error creating person:", error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting file on error:", err);
        });
      });
    }
    
    if (error.code === 11000) {
      res.status(400).json({ message: "Person with this phone number already exists" });
    } else if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ message: `Validation error: ${errors.join(', ')}` });
    } else {
      res.status(500).json({ message: "Internal server error: " + error.message });
    }
  }
});

// 🔧 FIXED: Test route to verify uploads directory
router.get('/test-uploads', (req, res) => {
  try {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const exists = fs.existsSync(uploadsPath);
    
    let files = [];
    if (exists) {
      files = fs.readdirSync(uploadsPath);
    }
    
    res.json({
      uploadsDirectory: uploadsPath,
      exists: exists,
      fileCount: files.length,
      files: files.slice(0, 10) // Show first 10 files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;