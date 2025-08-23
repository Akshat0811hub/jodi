// routes/personRoutes.js
const express = require("express");
const Person = require("../models/personModel");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

console.log("📋 Loading person routes with Supabase Storage...");

// ✅ SUPABASE CONFIGURATION
const supabaseUrl =
  process.env.SUPABASE_URL || "https://anjowgqnhyatiltnencb.supabase.co";
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuam93Z3FuaHlhdGlsdG5lbmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTM0MDQsImV4cCI6MjA3MTUyOTQwNH0.xccgtRzzj8QWdfo2ivmycYAUIK3L_KUYO_emOnzq1ZE";
const supabase = createClient(supabaseUrl, supabaseKey);

// Bucket name for storing person photos
const BUCKET_NAME = "matrimony-photos";

// ✅ Initialize Supabase bucket if it doesn't exist
const initializeSupabaseBucket = async () => {
  try {
    console.log("🔄 Checking Supabase bucket...");

    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Error listing buckets:", listError);
      return false;
    }

    const bucketExists = buckets.some((bucket) => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log(
        "❌ Bucket doesn't exist, but manual creation required due to RLS policy"
      );
      console.log("✅ Please create bucket manually in Supabase dashboard");
      return true;

      if (createError) {
        console.error("❌ Error creating bucket:", createError);
        return false;
      }

      console.log("✅ Bucket created successfully:", BUCKET_NAME);
    } else {
      console.log("✅ Bucket already exists:", BUCKET_NAME);
    }

    return true;
  } catch (error) {
    console.error("❌ Error initializing Supabase bucket:", error);
    return false;
  }
};

// Initialize bucket on startup
initializeSupabaseBucket();

// ✅ Multer configuration for memory storage (we'll upload to Supabase)
const storage = multer.memoryStorage();

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
  },
});

// ✅ Helper function to upload file to Supabase
const uploadToSupabase = async (file) => {
  try {
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}.${fileExt}`;

    console.log("📤 Uploading to Supabase:", fileName);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase upload error:", error);
      throw error;
    }

    console.log("✅ File uploaded successfully:", fileName);
    return fileName;
  } catch (error) {
    console.error("❌ Error uploading to Supabase:", error);
    throw error;
  }
};

// ✅ Helper function to delete file from Supabase
const deleteFromSupabase = async (fileName) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error("❌ Error deleting from Supabase:", error);
      return false;
    }

    console.log("✅ File deleted from Supabase:", fileName);
    return true;
  } catch (error) {
    console.error("❌ Error deleting from Supabase:", error);
    return false;
  }
};

// ✅ Helper function to get public URL from Supabase
const getSupabaseImageUrl = (fileName) => {
  if (!fileName) return null;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

  return data.publicUrl;
};

// ✅ CRITICAL FIX: Statistics route MUST come BEFORE /:id route
router.get("/stats/overview", async (req, res) => {
  try {
    console.log("📊 Fetching people statistics");

    const totalPeople = await Person.countDocuments();
    const genderStats = await Person.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);
    const religionStats = await Person.aggregate([
      { $group: { _id: "$religion", count: { $sum: 1 } } },
    ]);
    const maritalStatusStats = await Person.aggregate([
      { $group: { _id: "$maritalStatus", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      total: totalPeople,
      gender: genderStats,
      religion: religionStats,
      maritalStatus: maritalStatusStats,
    });
  } catch (error) {
    console.error("❌ Error fetching statistics:", error);
    res.status(500).json({
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

// ✅ Test route for debugging with Supabase status
router.get("/test/connection", async (req, res) => {
  try {
    const count = await Person.countDocuments();

    // Test Supabase connection
    const { data: buckets, error } = await supabase.storage.listBuckets();
    const supabaseStatus = error ? "error" : "connected";

    res.status(200).json({
      message: "✅ Person routes are working perfectly with Supabase!",
      totalPeople: count,
      timestamp: new Date().toISOString(),
      database: "connected",
      supabase: supabaseStatus,
      bucket: BUCKET_NAME,
      cors: "enabled",
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Connection issue",
      error: error.message,
      timestamp: new Date().toISOString(),
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
    if (req.query.maritalStatus)
      filters.maritalStatus = req.query.maritalStatus;
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

    const people = await Person.find(filters).sort({ createdAt: -1 }).lean(); // Use lean() for better performance

    // Add Supabase URLs to photos
    const peopleWithUrls = people.map((person) => ({
      ...person,
      photos: person.photos
        ? person.photos.map((photo) => ({
            fileName: photo,
            url: getSupabaseImageUrl(photo),
          }))
        : [],
      profilePictureUrl: person.profilePicture
        ? getSupabaseImageUrl(person.profilePicture)
        : null,
    }));

    console.log(`✅ Found ${people.length} people`);

    res.status(200).json(peopleWithUrls);
  } catch (error) {
    console.error("❌ Error fetching people:", error);
    res.status(500).json({
      message: "Failed to fetch people",
      error: error.message,
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
        message: "Person not found",
      });
    }

    // Add Supabase URLs to photos
    const personWithUrls = {
      ...person.toObject(),
      photos: person.photos
        ? person.photos.map((photo) => ({
            fileName: photo,
            url: getSupabaseImageUrl(photo),
          }))
        : [],
      profilePictureUrl: person.profilePicture
        ? getSupabaseImageUrl(person.profilePicture)
        : null,
    };

    console.log("✅ Person found:", person.name);
    res.status(200).json(personWithUrls);
  } catch (error) {
    console.error("❌ Error fetching person:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        message: "Person not found",
      });
    }

    res.status(500).json({
      message: "Failed to fetch person",
      error: error.message,
    });
  }
});

// POST /api/people - Create a new person with Supabase upload
router.post("/", upload.array("photos", 5), async (req, res) => {
  try {
    console.log("👤 Creating new person:", req.body.name);

    const personData = { ...req.body };
    const uploadedFiles = [];

    // Handle uploaded files - Upload to Supabase
    if (req.files && req.files.length > 0) {
      console.log(`📤 Uploading ${req.files.length} files to Supabase...`);

      for (const file of req.files) {
        try {
          const fileName = await uploadToSupabase(file);
          uploadedFiles.push(fileName);
        } catch (uploadError) {
          console.error("❌ Failed to upload file:", uploadError);
          // Clean up any already uploaded files
          for (const uploadedFile of uploadedFiles) {
            await deleteFromSupabase(uploadedFile);
          }
          throw new Error(`Failed to upload file: ${file.originalname}`);
        }
      }

      personData.photos = uploadedFiles;
      personData.profilePicture = uploadedFiles[0]; // Use first photo as profile picture
      console.log("📸 Uploaded photos to Supabase:", personData.photos);
    }

    // Handle siblings data if it's a JSON string
    if (req.body.siblings && typeof req.body.siblings === "string") {
      try {
        personData.siblings = JSON.parse(req.body.siblings);
      } catch (e) {
        console.warn("⚠️ Failed to parse siblings data:", e.message);
      }
    }

    const person = new Person(personData);
    await person.save();

    // Add URLs for response
    const personWithUrls = {
      ...person.toObject(),
      photos: person.photos
        ? person.photos.map((photo) => ({
            fileName: photo,
            url: getSupabaseImageUrl(photo),
          }))
        : [],
      profilePictureUrl: person.profilePicture
        ? getSupabaseImageUrl(person.profilePicture)
        : null,
    };

    console.log("✅ Person created successfully:", person.name);
    res.status(201).json({
      message: "Person created successfully",
      person: personWithUrls,
    });
  } catch (error) {
    console.error("❌ Error creating person:", error);

    res.status(400).json({
      message: "Failed to create person",
      error: error.message,
    });
  }
});

// PUT /api/people/:id - Update a person with Supabase upload
router.put("/:id", upload.array("photos", 5), async (req, res) => {
  try {
    console.log("✏️ Updating person:", req.params.id);

    const updateData = { ...req.body };
    updateData.updatedAt = Date.now();
    const uploadedFiles = [];

    // Handle new uploaded files - Upload to Supabase
    if (req.files && req.files.length > 0) {
      console.log(`📤 Uploading ${req.files.length} new files to Supabase...`);

      for (const file of req.files) {
        try {
          const fileName = await uploadToSupabase(file);
          uploadedFiles.push(fileName);
        } catch (uploadError) {
          console.error("❌ Failed to upload file:", uploadError);
          // Clean up any already uploaded files
          for (const uploadedFile of uploadedFiles) {
            await deleteFromSupabase(uploadedFile);
          }
          throw new Error(`Failed to upload file: ${file.originalname}`);
        }
      }

      // Get existing person to handle old photos
      const existingPerson = await Person.findById(req.params.id);
      if (existingPerson && existingPerson.photos) {
        // Keep existing photos and add new ones
        updateData.photos = [...existingPerson.photos, ...uploadedFiles];
      } else {
        updateData.photos = uploadedFiles;
      }

      // Update profile picture if new photos uploaded and no existing profile picture
      if (!updateData.profilePicture && uploadedFiles.length > 0) {
        updateData.profilePicture = uploadedFiles[0];
      }

      console.log("📸 Updated photos:", updateData.photos);
    }

    // Handle siblings data if it's a JSON string
    if (req.body.siblings && typeof req.body.siblings === "string") {
      try {
        updateData.siblings = JSON.parse(req.body.siblings);
      } catch (e) {
        console.warn("⚠️ Failed to parse siblings data:", e.message);
      }
    }

    const person = await Person.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!person) {
      // Clean up uploaded files if person not found
      for (const uploadedFile of uploadedFiles) {
        await deleteFromSupabase(uploadedFile);
      }
      return res.status(404).json({
        message: "Person not found",
      });
    }

    // Add URLs for response
    const personWithUrls = {
      ...person.toObject(),
      photos: person.photos
        ? person.photos.map((photo) => ({
            fileName: photo,
            url: getSupabaseImageUrl(photo),
          }))
        : [],
      profilePictureUrl: person.profilePicture
        ? getSupabaseImageUrl(person.profilePicture)
        : null,
    };

    console.log("✅ Person updated successfully:", person.name);
    res.status(200).json({
      message: "Person updated successfully",
      person: personWithUrls,
    });
  } catch (error) {
    console.error("❌ Error updating person:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        message: "Person not found",
      });
    }

    res.status(400).json({
      message: "Failed to update person",
      error: error.message,
    });
  }
});

// DELETE /api/people/:id - Delete a person and their Supabase photos
router.delete("/:id", async (req, res) => {
  try {
    console.log("🗑️ Deleting person:", req.params.id);

    const person = await Person.findById(req.params.id);

    if (!person) {
      return res.status(404).json({
        message: "Person not found",
      });
    }

    // Delete associated photo files from Supabase
    if (person.photos && person.photos.length > 0) {
      console.log(
        `🗑️ Deleting ${person.photos.length} photos from Supabase...`
      );
      for (const photoFilename of person.photos) {
        await deleteFromSupabase(photoFilename);
      }
    }

    // Delete the person record
    await Person.findByIdAndDelete(req.params.id);

    console.log("✅ Person deleted successfully:", person.name);
    res.status(200).json({
      message: "Person deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting person:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        message: "Person not found",
      });
    }

    res.status(500).json({
      message: "Failed to delete person",
      error: error.message,
    });
  }
});

// DELETE /api/people/:id/photo/:filename - Delete a specific photo from Supabase
router.delete("/:id/photo/:filename", async (req, res) => {
  try {
    const { id, filename } = req.params;
    console.log(`🗑️ Deleting photo ${filename} from person ${id}`);

    const person = await Person.findById(id);
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    // Remove photo from array
    person.photos = person.photos.filter((photo) => photo !== filename);

    // Update profile picture if it was the deleted photo
    if (person.profilePicture === filename) {
      person.profilePicture =
        person.photos.length > 0 ? person.photos[0] : null;
    }

    await person.save();

    // Delete the actual file from Supabase
    await deleteFromSupabase(filename);

    // Add URLs for response
    const personWithUrls = {
      ...person.toObject(),
      photos: person.photos
        ? person.photos.map((photo) => ({
            fileName: photo,
            url: getSupabaseImageUrl(photo),
          }))
        : [],
      profilePictureUrl: person.profilePicture
        ? getSupabaseImageUrl(person.profilePicture)
        : null,
    };

    console.log("✅ Photo deleted successfully from Supabase");
    res.status(200).json({
      message: "Photo deleted successfully",
      person: personWithUrls,
    });
  } catch (error) {
    console.error("❌ Error deleting photo:", error);
    res.status(500).json({
      message: "Failed to delete photo",
      error: error.message,
    });
  }
});

// ✅ Get image URL endpoint
router.get("/image/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const imageUrl = getSupabaseImageUrl(filename);

    if (!imageUrl) {
      return res.status(404).json({
        message: "Image not found",
      });
    }

    res.status(200).json({
      url: imageUrl,
      filename: filename,
    });
  } catch (error) {
    console.error("❌ Error getting image URL:", error);
    res.status(500).json({
      message: "Failed to get image URL",
      error: error.message,
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum size is 10MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files. Maximum is 5 photos.",
      });
    }
  }

  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({
      message: "Only image files are allowed!",
    });
  }

  next(error);
});

console.log("✅ Person routes loaded successfully with Supabase Storage");

module.exports = router;
