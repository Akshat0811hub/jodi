// models/personModel.js
const mongoose = require("mongoose");

const personSchema = new mongoose.Schema({
  // Personal Details - matching frontend fields
  name: { type: String, required: true },
  age: { type: String }, // Adding age field that frontend expects
  height: { type: String },
  gender: { type: String },
  religion: { type: String, required: true },
  caste: { type: String }, // Adding caste field that frontend expects
  maritalStatus: { type: String },
  state: { type: String }, // Adding state field that frontend expects
  phoneNumber: { type: String, required: true },
  area: { type: String }, // Adding area field that frontend expects
  dob: { type: String }, // Date of birth
  nativePlace: { type: String },
  
  // Additional personal details
  birthPlaceTime: { type: String },
  gotra: { type: String },
  complexion: { type: String },
  horoscope: { type: Boolean, default: false },
  eatingHabits: { type: String },
  drinkingHabits: { type: String },
  smokingHabits: { type: String },
  disability: { type: String },
  nri: { type: Boolean, default: false },
  vehicle: { type: Boolean, default: false },

  // Family Details
  fatherName: { type: String },
  fatherOccupation: { type: String },
  fatherOffice: { type: String },
  motherName: { type: String },
  motherOccupation: { type: String },
  residence: { type: String },
  otherProperty: { type: String },

  // Education (support both field names for compatibility)
  education: { type: String },
  higherQualification: { type: String },
  graduation: { type: String },
  schooling: { type: String },

  // Income (support both field names for compatibility)
  income: { type: String },
  personalIncome: { type: String },
  familyIncome: { type: String },
  occupation: { type: String },

  // Files and Relations
  photos: [{ type: String }], // Store filenames only
  profilePicture: { type: String },
  siblings: [{
    name: { type: String },
    relation: { type: String },
    age: { type: String },
    profession: { type: String },
    maritalStatus: { type: String }
  }],

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
personSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field on findOneAndUpdate
personSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model("Person", personSchema);