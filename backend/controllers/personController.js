const Person = require("../models/Person");
const fs = require("fs");
const path = require("path");

// GET /api/people – Get people with filters
const getPeople = async (req, res) => {
  try {
    const query = {};

    // Apply filters from query parameters
    const filterFields = [
      "name", "age", "height", "religion", "caste",
      "maritalStatus", "gender", "state", "country", "area",
    ];

    filterFields.forEach((field) => {
      if (req.query[field]) {
        query[field] = req.query[field];
      }
    });

    const people = await Person.find(query);
    res.json(people);
  } catch (err) {
    console.error("❌ Failed to get people:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/people – Add person (Admin only)
const addPerson = async (req, res) => {
  try {
    const {
      name, age, height, religion, caste,
      maritalStatus, gender, state, country, area,
    } = req.body;

    if (!name || !age || !height || !religion || !caste || !maritalStatus || !gender || !state || !country || !area) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ message: "At least 3 photos are required." });
    }

    const photoPaths = req.files.map(file => file.filename);

    const newPerson = new Person({
      name,
      age,
      height,
      religion,
      caste,
      maritalStatus,
      gender,
      state,
      country,
      area,
      photos: photoPaths,
    });

    await newPerson.save();
    res.status(201).json({ message: "Person added successfully." });
  } catch (err) {
    console.error("❌ Failed to add person:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/people/:id – Update person (Admin only)
const updatePerson = async (req, res) => {
  try {
    const updated = await Person.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Person not found" });
    res.json({ message: "Person updated successfully", person: updated });
  } catch (err) {
    console.error("❌ Failed to update person:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// DELETE /api/people/:id – Delete person (Admin only)
const deletePerson = async (req, res) => {
  try {
    const person = await Person.findByIdAndDelete(req.params.id);
    if (!person) return res.status(404).json({ message: "Person not found" });

    // Optionally delete associated photo files
    if (person.photos && person.photos.length) {
      person.photos.forEach((file) => {
        const filePath = path.join(__dirname, "../uploads", file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    res.json({ message: "Person deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete person:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getPeople,
  addPerson,
  updatePerson,
  deletePerson,
};
