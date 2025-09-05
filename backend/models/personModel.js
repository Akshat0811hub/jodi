const mongoose = require("mongoose");

const siblingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ["Male", "Female"], required: true },
  maritalStatus: { 
    type: String, 
    enum: ["Single", "Married", "Divorced", "Widowed"], 
    required: true 
  },
  profession: { type: String },
});

const personSchema = new mongoose.Schema(
  {
    // Basic Personal Information
    name: { type: String, required: true, trim: true },
    gender: { 
      type: String, 
      enum: ["Male", "Female", "Other"], 
      required: true 
    },
    dob: { type: Date, required: true },
    age: { type: Number },
    
    // Physical Attributes
    height: { type: String, required: true },
    complexion: { type: String, required: true },
    
    // Contact Information
    phoneNumber: { type: String, trim: true },
    area: { type: String, trim: true },
    state: { type: String, trim: true },
    
    // Religious & Cultural Details
    religion: { type: String, trim: true },
    caste: { type: String, trim: true },
    gotra: { type: String, required: true, trim: true },
    nativePlace: { type: String, required: true, trim: true },
    birthPlaceTime: { type: String, required: true },
    
    // Marital Status
    maritalStatus: { 
      type: String, 
      enum: ["Never Married", "Married", "Divorced", "Widowed"], 
      required: true 
    },
    
    // Family Information
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, required: true, trim: true },
    siblings: [siblingSchema],
    
    // Lifestyle Preferences
    horoscope: { 
      type: String, 
      enum: ["Yes", "No"], 
      default: "No" 
    },
    eatingHabits: { 
      type: String, 
      enum: ["Vegetarian", "Non-Vegetarian", "Vegan", "Jain"] 
    },
    drinkingHabits: { 
      type: String, 
      enum: ["Never", "Occasionally", "Socially", "Regularly"] 
    },
    smokingHabits: { 
      type: String, 
      enum: ["Never", "Occasionally", "Regularly", "Quit"] 
    },
    
    // Financial Information
    budget: { 
      type: String, 
      trim: true,
      // This stores the display value like "₹5,00,000" or "5 Lakhs"
    },
    budgetNumeric: { 
      type: Number,
      // This stores the numeric value for range queries and sorting
      // e.g., 500000 for ₹5,00,000
      index: true // Add index for faster queries
    },
    
    // Other Details
    disability: { type: String, trim: true },
    nri: { 
      type: String, 
      enum: ["Yes", "No"], 
      default: "No" 
    },
    vehicle: { 
      type: String, 
      enum: ["Yes", "No"], 
      default: "No" 
    },
    
    // Education & Career (optional additions)
    education: { type: String, trim: true },
    profession: { type: String, trim: true },
    income: { type: String, trim: true },
    
    // Photos
    photos: [{ type: String }], // Array of photo paths/URLs
    profilePictureUrl: { type: String }, // Main profile picture
    
    // Metadata
    createdBy: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Middleware to calculate age from DOB before saving
personSchema.pre("save", function (next) {
  if (this.dob) {
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    this.age = age;
  }
  
  // Extract numeric value from budget string for filtering
  if (this.budget && this.isModified('budget')) {
    const numericBudget = parseFloat(this.budget.replace(/[₹,\s]/g, ""));
    if (!isNaN(numericBudget)) {
      this.budgetNumeric = numericBudget;
    }
  }
  
  next();
});

// Add indexes for better query performance
personSchema.index({ name: 1 });
personSchema.index({ gender: 1 });
personSchema.index({ maritalStatus: 1 });
personSchema.index({ religion: 1 });
personSchema.index({ state: 1 });
personSchema.index({ budgetNumeric: 1 }); // Index for budget filtering
personSchema.index({ age: 1 });
personSchema.index({ createdAt: -1 });

// Compound indexes for common filter combinations
personSchema.index({ gender: 1, maritalStatus: 1 });
personSchema.index({ religion: 1, state: 1 });
personSchema.index({ budgetNumeric: 1, gender: 1 });

const Person = mongoose.model("Person", personSchema);

module.exports = Person;