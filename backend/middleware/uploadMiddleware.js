// controllers/personController.js
const Person = require("../models/personModel");

const addPerson = async (req, res) => {
  try {
    // Multer se uploaded files ka array milega
    const photos = req.files?.map(file => file.filename) || [];

    const person = new Person({
      ...req.body,
      photos, // yaha store karein
    });

    await person.save();
    res.status(201).json(person);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addPerson,
  // baaki controllers
};
