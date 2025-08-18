const express = require("express");
const {
  getPeople,
  updatePerson,
  deletePerson,
} = require("../controllers/personController");
const { upload, handleMulterError, cleanupFiles } = require("../middleware/uploadMiddleware");
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
  handleMulterError, // ✅ Add multer error handling
  async (req, res) => {
    let uploadedFiles = req.files || [];
    
    try {
      console.log("📤 Received form data:", Object.keys(req.body));
      console.log("📸 Received files:", uploadedFiles.length);

      // ✅ Validate required fields
      if (!req.body.name || !req.body.name.trim()) {
        if (uploadedFiles.length > 0) cleanupFiles(uploadedFiles);
        return res.status(400).json({ message: "Name is required" });
      }

      if (!req.body.religion || !req.body.religion.trim()) {
        if (uploadedFiles.length > 0) cleanupFiles(uploadedFiles);
        return res.status(400).json({ message: "Religion is required" });
      }

      if (!req.body.phoneNumber || !req.body.phoneNumber.trim()) {
        if (uploadedFiles.length > 0) cleanupFiles(uploadedFiles);
        return res.status(400).json({ message: "Phone number is required" });
      }

      // ✅ Validate phone number format
      if (!/^\d{1,10}$/.test(req.body.phoneNumber.trim())) {
        if (uploadedFiles.length > 0) cleanupFiles(uploadedFiles);
        return res.status(400).json({ 
          message: "Phone number must be numeric and maximum 10 digits" 
        });
      }

      // ✅ Validate minimum photos requirement
      if (uploadedFiles.length < 3) {
        if (uploadedFiles.length > 0) cleanupFiles(uploadedFiles);
        return res.status(400).json({ 
          message: "Please upload at least 3 photos" 
        });
      }

      // ✅ Process uploaded photos - store only filenames, not full URLs
      const photoFilenames = uploadedFiles.map(file => file.filename);

      // ✅ Process siblings data
      let siblings = [];
      if (req.body.siblings) {
        try {
          siblings = typeof req.body.siblings === 'string' 
            ? JSON.parse(req.body.siblings) 
            : req.body.siblings;
          
          // Ensure siblings is an array
          if (!Array.isArray(siblings)) {
            siblings = [];
          }
        } catch (parseError) {
          console.error("❌ Error parsing siblings data:", parseError);
          siblings = [];
        }
      }

      // ✅ Create person object with proper field mapping
      const personData = {
        // Personal Details
        name: req.body.name?.trim(),
        gender: req.body.gender,
        maritalStatus: req.body.maritalStatus,
        dob: req.body.dob,
        birthPlaceTime: req.body.birthPlaceTime,
        nativePlace: req.body.nativePlace,
        gotra: req.body.gotra,
        religion: req.body.religion?.trim(),
        phoneNumber: req.body.phoneNumber?.trim(),
        height: req.body.height,
        complexion: req.body.complexion,
        horoscope: req.body.horoscope === 'Yes',
        eatingHabits: req.body.eatingHabits,
        drinkingHabits: req.body.drinkingHabits,
        smokingHabits: req.body.smokingHabits,
        disability: req.body.disability,
        nri: req.body.nri === 'Yes',
        vehicle: req.body.vehicle === 'Yes',

        // Family Details
        fatherName: req.body.fatherName,
        fatherOccupation: req.body.fatherOccupation,
        fatherOffice: req.body.fatherOffice,
        motherName: req.body.motherName,
        motherOccupation: req.body.motherOccupation,
        residence: req.body.residence,
        otherProperty: req.body.otherProperty,

        // Education
        education: req.body.higherQualification, // Map to existing field
        higherQualification: req.body.higherQualification,
        graduation: req.body.graduation,
        schooling: req.body.schooling,

        // Profession & Income
        occupation: req.body.occupation,
        income: req.body.personalIncome, // Map to existing field
        personalIncome: req.body.personalIncome,
        familyIncome: req.body.familyIncome,

        // Files and Relations
        photos: photoFilenames, // ✅ Store only filenames
        siblings: siblings,

        // Metadata
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // ✅ Remove undefined fields
      Object.keys(personData).forEach(key => {
        if (personData[key] === undefined || personData[key] === '') {
          delete personData[key];
        }
      });

      console.log("💾 Creating person with data:", {
        ...personData,
        photos: `${personData.photos?.length || 0} photos`,
        siblings: `${personData.siblings?.length || 0} siblings`
      });

      const newPerson = new Person(personData);
      const savedPerson = await newPerson.save();

      console.log("✅ Person saved successfully with ID:", savedPerson._id);

      res.status(201).json({
        message: "Person added successfully",
        person: savedPerson
      });

    } catch (error) {
      console.error("❌ Error adding person:", error);
      
      // ✅ Cleanup uploaded files on error
      if (uploadedFiles.length > 0) {
        cleanupFiles(uploadedFiles);
      }

      // ✅ Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: errors 
        });
      }

      // ✅ Handle duplicate key errors
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyValue)[0];
        return res.status(400).json({ 
          message: `${duplicateField} already exists` 
        });
      }

      res.status(500).json({ 
        message: "Failed to add person", 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// 📌 Update a person (Admin only, with optional file upload)
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  upload.array("photos", 10),
  handleMulterError,
  async (req, res) => {
    let uploadedFiles = req.files || [];
    
    try {
      const personId = req.params.id;
      const existingPerson = await Person.findById(personId);
      
      if (!existingPerson) {
        if (uploadedFiles.length > 0) cleanupFiles(uploadedFiles);
        return res.status(404).json({ message: "Person not found" });
      }

      // ✅ Process new photos if uploaded
      let updatedPhotos = existingPerson.photos || [];
      if (uploadedFiles.length > 0) {
        const newPhotoFilenames = uploadedFiles.map(file => file.filename);
        updatedPhotos = [...updatedPhotos, ...newPhotoFilenames];
      }

      // ✅ Process siblings data
      let siblings = existingPerson.siblings || [];
      if (req.body.siblings) {
        try {
          siblings = typeof req.body.siblings === 'string' 
            ? JSON.parse(req.body.siblings) 
            : req.body.siblings;
        } catch (parseError) {
          console.error("❌ Error parsing siblings data:", parseError);
        }
      }

      // ✅ Update person data
      const updateData = {
        ...req.body,
        photos: updatedPhotos,
        siblings: siblings,
        updatedAt: new Date()
      };

      // ✅ Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedPerson = await Person.findByIdAndUpdate(
        personId,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        message: "Person updated successfully",
        person: updatedPerson
      });

    } catch (error) {
      console.error("❌ Error updating person:", error);
      
      // ✅ Cleanup uploaded files on error
      if (uploadedFiles.length > 0) {
        cleanupFiles(uploadedFiles);
      }

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: errors 
        });
      }

      res.status(500).json({ 
        message: "Failed to update person", 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// 📌 Delete a person (Admin only)
router.delete("/:id", verifyToken, verifyAdmin, deletePerson);

// 📌 Get single person by ID
router.get("/:id", async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }
    res.json(person);
  } catch (error) {
    console.error("❌ Error fetching person:", error);
    res.status(500).json({ 
      message: "Failed to fetch person", 
      error: error.message 
    });
  }
});

module.exports = router;