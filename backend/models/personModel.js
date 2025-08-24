// models/personModel.js - FIXED VERSION with proper photo URL storage
const mongoose = require("mongoose");

const siblingSchema = new mongoose.Schema({
  name: { type: String },
  relation: { type: String },        // Keep 'relation' as per your form
  relationship: { type: String },    // Also support 'relationship' for compatibility
  age: { type: String },
  profession: { type: String },
  occupation: { type: String },      // Support both field names
  maritalStatus: { type: String }
}, { _id: false }); // Don't auto-generate _id for subdocuments

const personSchema = new mongoose.Schema({
  // Personal Details - matching frontend fields
  name: { type: String, required: true },
  age: { type: String },
  height: { type: String },
  gender: { type: String },
  religion: { type: String, required: true },
  caste: { type: String },
  maritalStatus: { type: String },
  state: { type: String },
  phoneNumber: { type: String, required: true },
  area: { type: String },
  dob: { type: String }, // Consider changing to Date type later for better date handling
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

  // Income and Occupation (support multiple field names for compatibility)
  income: { type: String },
  personalIncome: { type: String },
  familyIncome: { type: String },
  occupation: { type: String },

  // Contact Information
  email: { type: String },
  currentAddress: { type: String },

  // 🆓 PHOTOS - FIXED: Store complete Supabase URLs, not just filenames
  photos: [{ type: String }], // Array of complete Supabase URLs
  profilePicture: { type: String }, // Complete Supabase URL for profile picture
  
  // Additional photo fields for flexibility
  photoUrls: [{ type: String }], // Alternative field for photo URLs
  photoFilenames: [{ type: String }], // Keep filenames for reference if needed
  
  // Siblings with flexible field support
  siblings: [siblingSchema],

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 🆓 Add indexes for better performance
personSchema.index({ phoneNumber: 1 }, { unique: true });
personSchema.index({ name: 1 });
personSchema.index({ religion: 1 });
personSchema.index({ createdAt: -1 });

// 🆓 Update the updatedAt field on save
personSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 🆓 Update the updatedAt field on findOneAndUpdate
personSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// 🆓 Virtual for getting photo count
personSchema.virtual('photoCount').get(function() {
  let count = 0;
  if (this.profilePicture) count++;
  if (this.photos && this.photos.length) count += this.photos.length;
  if (this.photoUrls && this.photoUrls.length) count += this.photoUrls.length;
  return count;
});

// 🆓 Method to get all photo URLs
personSchema.methods.getAllPhotoUrls = function() {
  const allUrls = [];
  
  // Add profile picture if exists
  if (this.profilePicture && this.profilePicture.trim()) {
    allUrls.push(this.profilePicture.trim());
  }
  
  // Add photos array
  if (this.photos && Array.isArray(this.photos)) {
    this.photos.forEach(url => {
      if (url && typeof url === 'string' && url.trim()) {
        allUrls.push(url.trim());
      }
    });
  }
  
  // Add photoUrls array
  if (this.photoUrls && Array.isArray(this.photoUrls)) {
    this.photoUrls.forEach(url => {
      if (url && typeof url === 'string' && url.trim()) {
        allUrls.push(url.trim());
      }
    });
  }
  
  // Remove duplicates and return
  return [...new Set(allUrls)];
};

// 🆓 Method to validate photo URLs
personSchema.methods.validatePhotoUrls = function() {
  const allUrls = this.getAllPhotoUrls();
  const validUrls = allUrls.filter(url => {
    return url.includes('supabase.co') && url.includes('storage/v1/object/public/');
  });
  
  return {
    total: allUrls.length,
    valid: validUrls.length,
    invalid: allUrls.length - validUrls.length,
    validUrls: validUrls,
    invalidUrls: allUrls.filter(url => !validUrls.includes(url))
  };
};

// 🆓 Static method to find people with photos
personSchema.statics.findWithPhotos = function() {
  return this.find({
    $or: [
      { profilePicture: { $exists: true, $ne: "", $ne: null } },
      { photos: { $exists: true, $not: { $size: 0 } } },
      { photoUrls: { $exists: true, $not: { $size: 0 } } }
    ]
  });
};

// 🆓 Static method to find people without photos
personSchema.statics.findWithoutPhotos = function() {
  return this.find({
    $and: [
      { $or: [{ profilePicture: { $exists: false } }, { profilePicture: "" }, { profilePicture: null }] },
      { $or: [{ photos: { $exists: false } }, { photos: { $size: 0 } }] },
      { $or: [{ photoUrls: { $exists: false } }, { photoUrls: { $size: 0 } }] }
    ]
  });
};

// 🆓 Ensure virtuals are included when converting to JSON
personSchema.set('toJSON', { virtuals: true });
personSchema.set('toObject', { virtuals: true });

console.log("✅ Person Model loaded with enhanced photo URL support");

module.exports = mongoose.model("Person", personSchema);