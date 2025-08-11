// controllers/personController.js
const path = require("path");
const Person = require("../models/personModel");

// 📌 Get all people
const getPeople = async (req, res) => {
  try {
    const people = await Person.find();
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

    if (req.body.siblings) {
      try {
        req.body.siblings = JSON.parse(req.body.siblings);
      } catch (err) {
        console.error("❌ Failed to parse siblings:", err);
        return res.status(400).json({ message: "Invalid siblings format" });
      }
    }

    const photoPaths = req.files?.map((file) => `/uploads/${file.filename}`) || [];

    const newPerson = new Person({
      name: req.body.name,
      gender: req.body.gender,
      maritalStatus: req.body.maritalStatus,
      dob: req.body.dob,
      birthPlaceTime: req.body.birthPlaceTime,
      nativePlace: req.body.nativePlace,
      gotra: req.body.gotra,
      height: req.body.height,
      complexion: req.body.complexion,
      horoscope: req.body.horoscope,
      eatingHabits: req.body.eatingHabits,
      drinkingHabits: req.body.drinkingHabits,
      smokingHabits: req.body.smokingHabits,
      disability: req.body.disability,
      nri: req.body.nri,
      vehicle: req.body.vehicle,
      fatherName: req.body.fatherName,
      fatherOccupation: req.body.fatherOccupation,
      fatherOffice: req.body.fatherOffice,
      motherName: req.body.motherName,
      motherOccupation: req.body.motherOccupation,
      residence: req.body.residence,
      otherProperty: req.body.otherProperty,
      higherQualification: req.body.higherQualification,
      graduation: req.body.graduation,
      schooling: req.body.schooling,
      occupation: req.body.occupation,
      personalIncome: req.body.personalIncome,
      familyIncome: req.body.familyIncome,
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
    const updated = await Person.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
