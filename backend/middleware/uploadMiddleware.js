const express = require("express");
const multer = require("multer");
const path = require("path");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();
const Person = require("../models/personModel");

// 🆓 SUPABASE CONFIGURATION (FREE TIER: 1GB storage, 2GB bandwidth)
const supabaseUrl = process.env.SUPABASE_URL || 'https://anjowgqnhyatiltnencb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuam93Z3FuaHlhdGlsdG5lbmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTM0MDQsImV4cCI6MjA3MTUyOTQwNH0.xccgtRzzj8QWdfo2ivmycYAUIK3L_KUYO_emOnzq1ZE';
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'matrimony-photos';

// 🔧 MULTER: Store in memory
const storage = multer.memoryStorage();

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

// 🆓 HELPER: Upload to Supabase Storage
async function uploadToSupabase(file, filename) {
  try {
    const { data, error } = await supabase.storage
      .from(matrimony-photos)
      .upload(`uploads/${filename}`, file.buffer, {
        contentType: file.mimetype,
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(matrimony-photos)
      .getPublicUrl(`uploads/${filename}`);

    return publicData.publicUrl;
  } catch (error) {
    console.error("❌ Error uploading to Supabase:", error);
    throw error;
  }
}

// 🆓 MODIFIED: Upload route with Supabase
router.post('/people', upload.array('photos', 4), async (req, res) => {
  try {
    console.log("\n📤 ===== NEW PERSON CREATION REQUEST =====");
    console.log("📝 Form data received:", Object.keys(req.body));
    console.log("📸 Files received:", req.files?.length || 0);

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
      return res.status(400).json({ 
        message: `Please upload at least 1 photo. Received: ${req.files?.length || 0}` 
      });
    }

    // 🆓 Upload files to Supabase
    console.log("🚀 Uploading files to Supabase...");
    const uploadPromises = req.files.map(async (file, index) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const timestamp = Date.now();
      const uniqueId = Math.round(Math.random() * 1E9);
      const filename = `photo_${timestamp}_${uniqueId}_${index}${ext}`;
      
      console.log(`📸 Uploading ${file.originalname} as ${filename}`);
      
      const url = await uploadToSupabase(file, filename);
      
      return {
        filename: filename,
        url: url,
        originalName: file.originalname,
        size: file.size
      };
    });

    // Wait for all uploads
    const uploadedFiles = await Promise.all(uploadPromises);
    
    console.log("✅ All files uploaded successfully:");
    uploadedFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.filename} -> ${file.url}`);
    });

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

    // Store URLs
    const photoUrls = uploadedFiles.map(file => file.url);
    const photoFilenames = uploadedFiles.map(file => file.filename);

    // Create person data
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
      
      // 🆓 Store URLs
      photos: photoUrls,
      photoFilenames: photoFilenames,
      profilePicture: photoUrls[0] || ""
    };

    // Save to database
    const newPerson = new Person(personData);
    const savedPerson = await newPerson.save();
    
    console.log("✅ Person created successfully with ID:", savedPerson._id);
    console.log("📸 Photos stored:", savedPerson.photos);
    
    res.status(201).json({
      message: "Person added successfully",
      person: savedPerson,
      photosUploaded: uploadedFiles.length,
      photoUrls: photoUrls
    });

  } catch (error) {
    console.error("❌ Error creating person:", error);
    
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

// 🆓 Test Supabase connection
router.get('/test-supabase', async (req, res) => {
  try {
    // List files in bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('uploads/', {
        limit: 10,
        offset: 0
      });

    if (error) {
      throw error;
    }

    res.json({
      message: "Supabase connection successful",
      bucket: BUCKET_NAME,
      fileCount: data?.length || 0,
      files: data?.map(file => ({
        name: file.name,
        size: file.metadata?.size,
        lastModified: file.updated_at
      })) || []
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Supabase connection failed",
      error: error.message 
    });
  }
});

module.exports = router;