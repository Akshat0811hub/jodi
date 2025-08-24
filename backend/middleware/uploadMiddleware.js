const express = require("express");
const multer = require("multer");
const path = require("path");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();
const Person = require("../models/personModel");

// 🔒 SECURE SUPABASE CONFIGURATION
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'matrimony-photos';

// 🔧 MULTER: Enhanced configuration
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
    fileSize: 5 * 1024 * 1024, // 5MB (within your 50MB bucket policy)
    files: 4
  },
  fileFilter: fileFilter
});

// 🔒 SECURE: Upload to Supabase with better error handling
async function uploadToSupabase(file, personId, index) {
  try {
    // Create organized folder structure: personId/timestamp_index.ext
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const timestamp = Date.now();
    const filename = `${personId}/${timestamp}_${index}${ext}`;

    console.log(`🚀 Uploading to: ${filename}`);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false, // Don't overwrite
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          personId: personId
        }
      });

    if (error) {
      console.error(`❌ Upload error for ${filename}:`, error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    console.log(`✅ Uploaded successfully: ${publicData.publicUrl}`);

    return {
      filename: filename,
      url: publicData.publicUrl,
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error("❌ Supabase upload error:", error);
    throw error;
  }
}

// 🔒 ENHANCED: Person creation with better validation
router.post('/people', upload.array('photos', 4), async (req, res) => {
  try {
    console.log("\n📤 ===== NEW PERSON CREATION REQUEST =====");
    console.log("📝 Form data received:", Object.keys(req.body));
    console.log("📸 Files received:", req.files?.length || 0);

    // Enhanced validation
    const { name, religion, phoneNumber } = req.body;
    
    if (!name?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: "Name is required" 
      });
    }
    
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({ 
        success: false,
        message: "Name must be between 2 and 50 characters" 
      });
    }
    
    if (!religion?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: "Religion is required" 
      });
    }
    
    if (!phoneNumber?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: "Phone Number is required" 
      });
    }
    
    // Enhanced phone validation
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ 
        success: false,
        message: "Phone Number must be exactly 10 digits" 
      });
    }

    // Photo validation
    if (!req.files || req.files.length < 1) {
      return res.status(400).json({ 
        success: false,
        message: `At least 1 photo is required. Received: ${req.files?.length || 0}` 
      });
    }

    if (req.files.length > 4) {
      return res.status(400).json({ 
        success: false,
        message: `Maximum 4 photos allowed. Received: ${req.files.length}` 
      });
    }

    // Check if phone number already exists
    const existingPerson = await Person.findOne({ phoneNumber: cleanPhone });
    if (existingPerson) {
      return res.status(400).json({ 
        success: false,
        message: "Person with this phone number already exists" 
      });
    }

    // Create person first to get ID for organized file storage
    const tempPersonData = {
      name: name.trim(),
      religion: religion.trim(),
      phoneNumber: cleanPhone,
      // Add other validated fields...
      gender: req.body.gender || "",
      maritalStatus: req.body.maritalStatus || "",
      dob: req.body.dob || "",
      birthPlaceTime: req.body.birthPlaceTime || "",
      nativePlace: req.body.nativePlace || "",
      gotra: req.body.gotra || "",
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
      
      // Education
      higherQualification: req.body.higherQualification || "",
      graduation: req.body.graduation || "",
      schooling: req.body.schooling || "",
      
      // Profession & Income
      occupation: req.body.occupation || "",
      personalIncome: req.body.personalIncome || "",
      familyIncome: req.body.familyIncome || "",
      
      // Temporary empty arrays - will be updated after upload
      photos: [],
      photoFilenames: [],
      profilePicture: ""
    };

    // Parse siblings safely
    let siblings = [];
    if (req.body.siblings) {
      try {
        siblings = JSON.parse(req.body.siblings);
        if (!Array.isArray(siblings)) siblings = [];
      } catch (error) {
        console.error("Error parsing siblings:", error);
        siblings = [];
      }
    }
    tempPersonData.siblings = siblings;

    // Save person to get ID
    const newPerson = new Person(tempPersonData);
    const savedPerson = await newPerson.save();
    
    console.log(`✅ Person created with ID: ${savedPerson._id}`);

    // 🚀 Upload files with person ID for organization
    console.log("🚀 Uploading files to Supabase...");
    
    const uploadPromises = req.files.map(async (file, index) => {
      return await uploadToSupabase(file, savedPerson._id.toString(), index);
    });

    // Wait for all uploads with timeout
    const uploadTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout')), 30000) // 30 second timeout
    );

    const uploadedFiles = await Promise.race([
      Promise.all(uploadPromises),
      uploadTimeout
    ]);
    
    console.log("✅ All files uploaded successfully:");
    uploadedFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.filename} -> ${file.url}`);
    });

    // Update person with photo URLs
    const photoUrls = uploadedFiles.map(file => file.url);
    const photoFilenames = uploadedFiles.map(file => file.filename);

    savedPerson.photos = photoUrls;
    savedPerson.photoFilenames = photoFilenames;
    savedPerson.profilePicture = photoUrls[0] || "";
    
    await savedPerson.save();
    
    console.log("✅ Person updated with photos successfully");
    
    res.status(201).json({
      success: true,
      message: "Person created successfully",
      person: {
        id: savedPerson._id,
        name: savedPerson.name,
        phoneNumber: savedPerson.phoneNumber,
        profilePicture: savedPerson.profilePicture,
        photosCount: savedPerson.photos.length
      },
      photosUploaded: uploadedFiles.length,
      photoUrls: photoUrls
    });

  } catch (error) {
    console.error("❌ Error creating person:", error);
    
    // Enhanced error handling
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false,
        message: "Person with this phone number already exists" 
      });
    } else if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ 
        success: false,
        message: `Validation error: ${errors.join(', ')}` 
      });
    } else if (error.message.includes('Upload timeout')) {
      res.status(408).json({ 
        success: false,
        message: "File upload timed out. Please try again with smaller files." 
      });
    } else if (error.message.includes('Upload failed')) {
      res.status(500).json({ 
        success: false,
        message: "File upload failed: " + error.message 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: "Internal server error. Please try again." 
      });
    }
  }
});

// 🔒 SECURE: Delete person photos (optional cleanup route)
router.delete('/people/:id/photos', async (req, res) => {
  try {
    const personId = req.params.id;
    const person = await Person.findById(personId);
    
    if (!person) {
      return res.status(404).json({ 
        success: false,
        message: "Person not found" 
      });
    }

    // Delete files from Supabase
    if (person.photoFilenames && person.photoFilenames.length > 0) {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(person.photoFilenames);

      if (error) {
        console.error("Error deleting files:", error);
      }
    }

    // Update person record
    person.photos = [];
    person.photoFilenames = [];
    person.profilePicture = "";
    await person.save();

    res.json({
      success: true,
      message: "Photos deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting photos:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete photos" 
    });
  }
});

// 🔍 ENHANCED: Test Supabase connection with better info
router.get('/test-supabase', async (req, res) => {
  try {
    // Test bucket access
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket(BUCKET_NAME);

    if (bucketError) {
      throw new Error(`Bucket access failed: ${bucketError.message}`);
    }

    // List recent files
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      throw new Error(`File listing failed: ${listError.message}`);
    }

    // Calculate storage usage
    const totalFiles = files?.length || 0;
    const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

    res.json({
      success: true,
      message: "Supabase connection successful",
      bucket: {
        name: BUCKET_NAME,
        public: bucketData.public,
        filesCount: totalFiles,
        totalSizeMB: totalSizeMB,
        fileSizeLimit: bucketData.file_size_limit ? (bucketData.file_size_limit / 1024 / 1024) + ' MB' : 'Not set'
      },
      recentFiles: files?.slice(0, 5).map(file => ({
        name: file.name,
        sizeMB: file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(2) : 'Unknown',
        lastModified: file.updated_at
      })) || []
    });

  } catch (error) {
    console.error("Supabase test failed:", error);
    res.status(500).json({ 
      success: false,
      message: "Supabase connection failed",
      error: error.message 
    });
  }
});

module.exports = router;