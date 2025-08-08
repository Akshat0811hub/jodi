// /backend/models/Person.js
const mongoose = require("mongoose");

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: Number,
  height: Number,
  religion: String,
  caste: String,
  maritalStatus: String,
  gender: String,
  state: String,
  country: String,
  area: String,
  photo:[String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Person", personSchema);
