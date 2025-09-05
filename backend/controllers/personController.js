const path = require("path");
const Person = require("../models/personModel");

// 📌 Get all people with filters (with budget support)
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
      "nativePlace",
      "budget", // Added budget to regex fields for partial matching
    ];

    // Numeric/range fields for special handling
    const numericFields = ["budget"];

    // Loop through query params
    for (const [key, value] of Object.entries(req.query)) {
      if (!value || value.trim() === "") continue; // skip empty

      if (key === "budget") {
        // Special handling for budget - can handle ranges and partial matches
        const budgetValue = value.trim();
        
        // Check if it's a range query like "5,00,000-10,00,000" or "500000-1000000"
        if (budgetValue.includes("-")) {
          const [minStr, maxStr] = budgetValue.split("-");
          const min = parseFloat(minStr.replace(/,/g, ""));
          const max = parseFloat(maxStr.replace(/,/g, ""));
          
          if (!isNaN(min) && !isNaN(max)) {
            // Create a range query for numeric values
            queryObj.budgetNumeric = { $gte: min, $lte: max };
          } else {
            // Fallback to regex if not numeric
            queryObj[key] = { $regex: budgetValue, $options: "i" };
          }
        } else {
          // Single value - try both numeric and text matching
          const numericValue = parseFloat(budgetValue.replace(/,/g, ""));
          if (!isNaN(numericValue)) {
            // If it's a valid number, search for exact or approximate match
            queryObj.$or = [
              { budgetNumeric: numericValue },
              { budget: { $regex: budgetValue, $options: "i" } }
            ];
          } else {
            // Text-based search for budget
            queryObj[key] = { $regex: budgetValue, $options: "i" };
          }
        }
      } else if (regexFields.includes(key)) {
        // Case-insensitive partial match for other fields
        queryObj[key] = { $regex: value.trim(), $options: "i" };
      } else {
        // Exact match for boolean/enum fields
        queryObj[key] = value;
      }
    }

    console.log("🔍 Query object:", JSON.stringify(queryObj, null, 2));
    
    const people = await Person.find(queryObj);
    res.status(200).json(people);
  } catch (err) {
    console.error("❌ Error in getPeople:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Add a new person (with budget support)
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

    // Budget processing - extract numeric value for filtering
    if (req.body.budget) {
      const budgetStr = req.body.budget.toString();
      const numericBudget = parseFloat(budgetStr.replace(/[₹,\s]/g, ""));
      if (!isNaN(numericBudget)) {
        req.body.budgetNumeric = numericBudget;
      }
    }

    // Photo handling
    const photoPaths =
      req.files?.map((file) => `/uploads/${file.filename}`) || [];

    const newPerson = new Person({
      ...req.body,
      siblings: req.body.siblings || [],
      photos: photoPaths,
    });

    await newPerson.save();
    res
      .status(201)
      .json({ message: "Person added successfully", person: newPerson });
  } catch (err) {
    console.error("❌ Error in addPerson:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Update a person (with budget support)
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

    // Budget processing - extract numeric value for filtering
    if (updatedData.budget) {
      const budgetStr = updatedData.budget.toString();
      const numericBudget = parseFloat(budgetStr.replace(/[₹,\s]/g, ""));
      if (!isNaN(numericBudget)) {
        updatedData.budgetNumeric = numericBudget;
      }
    }

    const updated = await Person.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Person not found" });
    }
    res
      .status(200)
      .json({ message: "Person updated successfully", person: updated });
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