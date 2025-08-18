// models/personModel.js - Make sure these fields exist
const mongoose = require("mongoose");

const personSchema = new mongoose.Schema({
  // Personal Details
  name: { type: String, required: true },
  gender: String,
  maritalStatus: String,
  dob: String,
  birthPlaceTime: String,
  nativePlace: String,
  gotra: String,
  religion: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  height: String,
  complexion: String,
  horoscope: Boolean,
  eatingHabits: String,
  drinkingHabits: String,
  smokingHabits: String,
  disability: String,
  nri: Boolean,
  vehicle: Boolean,

  // Family Details
  fatherName: String,
  fatherOccupation: String,
  fatherOffice: String,
  motherName: String,
  motherOccupation: String,
  residence: String,
  otherProperty: String,

  // Education (support both field names for compatibility)
  education: String,
  higherQualification: String,
  graduation: String,
  schooling: String,

  // Income (support both field names for compatibility)
  income: String,
  personalIncome: String,
  familyIncome: String,
  occupation: String,

  // Files and Relations
  photos: [String], // Store filenames only
  profilePicture: String,
  siblings: [{
    name: String,
    relation: String,
    age: String,
    profession: String,
    maritalStatus: String
  }],

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Person", personSchema);