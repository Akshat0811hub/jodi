const path = require("path");
const Person = require("../models/personModel");

// 📌 Get all people with filters
const getPeople = async (req, res) => {
  try {
    const queryObj = {};

    // Personal details fields jo hum filter karna chahte hain
    const regexFields = [
      "name",
      "gotra",
      "area",
      "state",
      "religion",
      "maritalStatus",
      "gender",
      "height",
      "complexion",
      "nativePlace"
    ];

    // Loop through query params
    for (const [key, value] of Object.entries(req.query)) {
      if (!value || value.trim() === "") continue; // skip empty

      if (regexFields.includes(key)) {
        // Case-insensitive partial match
        queryObj[key] = { $regex: value.trim(), $options: "i" };
      } else {
        // Exact match
        queryObj[key] = value;
      }
    }

    const people = await Person.find(queryObj);
    res.status(200).json(people);
  } catch (err) {
    console.error("❌ Error in getPeople:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Add a new person
const addPerson = async (req, res) => {
  try {
    console.log("📥 req.body:", req.body);
    console.log("📥 req.files:", req.files);

    const requiredFields = [
      "name",
      "gender",
      "maritalStatus",
      "dob",
      "birthPlaceTime",
      "nativePlace",
      "gotra",
      "height",
      "complexion",
      "fatherName",
      "motherName",
    ];

    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === "") {
        return res.status(400).json({ message: `${field} is required.` });
      }
    }

    // Siblings parse
    if (req.body.siblings && typeof req.body.siblings === "string") {
      try {
        req.body.siblings = JSON.parse(req.body.siblings);
      } catch (err) {
        console.error("❌ Failed to parse siblings:", err);
        return res.status(400).json({ message: "Invalid siblings format" });
      }
    }

    // Photo handling
    const photoPaths = req.files?.map((file) => `/uploads/${file.filename}`) || [];

    const newPerson = new Person({
      ...req.body,
      siblings: req.body.siblings || [],
      photos: photoPaths,
    });

    await newPerson.save();
    res.status(201).json({ message: "Person added successfully", person: newPerson });
  } catch (err) {
    console.error("❌ Error in addPerson:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Update a person
const updatePerson = async (req, res) => {
  try {
    let updatedData = { ...req.body };

    // If files are uploaded, add them
    if (req.files && req.files.length > 0) {
      const photoPaths = req.files.map((file) => `/uploads/${file.filename}`);
      updatedData.photos = photoPaths;
    }

    // Handle siblings JSON parsing
    if (updatedData.siblings && typeof updatedData.siblings === "string") {
      try {
        updatedData.siblings = JSON.parse(updatedData.siblings);
      } catch (err) {
        console.error("❌ Failed to parse siblings in update:", err);
        return res.status(400).json({ message: "Invalid siblings format" });
      }
    }

    const updated = await Person.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Person not found" });
    }
    res.status(200).json({ message: "Person updated successfully", person: updated });
  } catch (err) {
    console.error("❌ Error in updatePerson:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Delete a person
const deletePerson = async (req, res) => {
  try {
    const deleted = await Person.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Person not found" });
    }
    res.status(200).json({ message: "Person deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deletePerson:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getPeople,
  addPerson,
  updatePerson,
  deletePerson,
};
