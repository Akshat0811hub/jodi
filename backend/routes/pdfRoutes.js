// routes/pdfRoutes.js - FIXED VERSION with photo issues resolved
const express = require("express");
const PDFDocument = require("pdfkit");
const Person = require("../models/personModel");

// Try to import optional dependencies with fallbacks
let supabase = null;
let axios = null;

try {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL || 'https://anjowgqnhyatiltnencb.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuam93Z3FuaHlhdGlsdG5lbmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTM0MDQsImV4cCI6MjA3MTUyOTQwNH0.xccgtRzzj8QWdfo2ivmycYAUIK3L_KUYO_emOnzq1ZE';
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("✅ Supabase client initialized");
} catch (error) {
  console.warn("⚠️ Supabase not available:", error.message);
}

try {
  axios = require('axios');
  console.log("✅ Axios loaded");
} catch (error) {
  console.warn("⚠️ Axios not available:", error.message);
}

const router = express.Router();
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'matrimony-photos';

console.log("📄 Loading PDF routes...");

// Color scheme
const colors = {
  primary: "#2C3E50",
  secondary: "#34495E",
  accent: "#3498DB",
  success: "#27AE60",
  warning: "#F39C12",
  danger: "#E74C3C",
  light: "#ECF0F1",
  white: "#FFFFFF",
  text: "#2C3E50",
  label: "#5D6D7E",
  value: "#34495E",
};

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const addStyledField = (doc, label, value, options = {}) => {
  const {
    fontSize = 11,
    indent = 0,
    labelColor = colors.label,
    valueColor = colors.value,
  } = options;

  const x = 50 + indent;
  const labelWidth = 140;

  doc
    .fontSize(fontSize + 1)
    .font("Helvetica-Bold")
    .fillColor(labelColor)
    .text(label + ":", x, doc.y, { width: labelWidth, continued: true });

  doc
    .fontSize(fontSize)
    .font("Helvetica")
    .fillColor(valueColor)
    .text(" " + (value || "—"), { width: 400 - labelWidth });

  doc.moveDown(0.4);
};

const addStyledSectionHeader = (doc, title) => {
  doc.moveDown(1);
  const headerY = doc.y;
  doc.rect(40, headerY, 520, 30).fill(colors.primary);
  doc.rect(40, headerY, 520, 2).fill(colors.accent);
  doc.circle(55, headerY + 15, 8).fill(colors.accent);
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor(colors.white)
    .text(title, 75, headerY + 8);
  doc.fillColor(colors.text).moveDown(1.2);
};

// 🔧 FIXED: Helper function to get Supabase image URL
const getSupabaseImageUrl = (fileName) => {
  if (!fileName) return null;
  
  // Handle both string and object inputs
  const actualFileName = typeof fileName === 'object' ? fileName.fileName : fileName;
  
  if (!actualFileName) return null;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(actualFileName);
  return data.publicUrl;
};

// 🔧 FIXED: Download image with better error handling
const downloadImageFromUrl = async (imageUrl) => {
  try {
    console.log("📥 Attempting to download image:", imageUrl);
    
    // Method 1: Use axios if available
    if (axios) {
      try {
        console.log("📡 Using axios for direct download");
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'PDF-Generator/1.0'
          }
        });
        
        if (response.data && response.data.byteLength > 0) {
          console.log("✅ Axios download successful, size:", response.data.byteLength);
          return Buffer.from(response.data);
        }
      } catch (axiosError) {
        console.warn("⚠️ Axios download failed:", axiosError.message);
      }
    }

    // Method 2: Use Supabase SDK if available and URL is Supabase
    if (supabase && imageUrl.includes('supabase.co')) {
      try {
        console.log("📁 Using Supabase SDK download");
        
        // Extract file path from URL
        let filePath = '';
        if (imageUrl.includes('/storage/v1/object/public/' + BUCKET_NAME + '/')) {
          const pathStart = imageUrl.indexOf('/storage/v1/object/public/' + BUCKET_NAME + '/') + 
                           ('/storage/v1/object/public/' + BUCKET_NAME + '/').length;
          filePath = imageUrl.substring(pathStart);
        }
        
        if (filePath) {
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(filePath);
            
          if (!error && data) {
            const buffer = await data.arrayBuffer();
            console.log("✅ Supabase SDK download successful, size:", buffer.byteLength);
            return Buffer.from(buffer);
          } else {
            console.warn("⚠️ Supabase SDK error:", error);
          }
        }
      } catch (supabaseError) {
        console.warn("⚠️ Supabase download failed:", supabaseError.message);
      }
    }

    // Method 3: Use native fetch as fallback
    try {
      console.log("🌐 Using native fetch as fallback");
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(imageUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'PDF-Generator/1.0'
        }
      });
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        console.log("✅ Fetch download successful, size:", arrayBuffer.byteLength);
        return Buffer.from(arrayBuffer);
      }
    } catch (fetchError) {
      console.warn("⚠️ Fetch download failed:", fetchError.message);
    }

    return null;
  } catch (error) {
    console.error("❌ All download methods failed:", error);
    return null;
  }
};

// Add photo to PDF
const addSinglePhoto = async (doc, imageUrl, x, y, width, height, photoNumber) => {
  try {
    if (!imageUrl || (!imageUrl.trim && !imageUrl.url)) {
      console.log(`❌ Invalid image URL for photo ${photoNumber}`);
      return false;
    }

    // Handle both string URLs and object URLs
    const actualUrl = typeof imageUrl === 'string' ? imageUrl : imageUrl.url || imageUrl;
    
    console.log(`\n📸 Processing photo ${photoNumber}:`);
    console.log(`   URL: ${actualUrl.substring(0, 80)}...`);

    const imageBuffer = await downloadImageFromUrl(actualUrl.trim());

    if (!imageBuffer || imageBuffer.length === 0) {
      console.log(`❌ Failed to download photo ${photoNumber}`);
      return false;
    }

    if (imageBuffer.length > 10 * 1024 * 1024) {
      console.log(`❌ Photo ${photoNumber} too large: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      return false;
    }

    console.log(`📊 Photo ${photoNumber} buffer size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // Add frame
    doc
      .rect(x - 5, y - 5, width + 10, height + 35)
      .fill(colors.light)
      .stroke(colors.primary)
      .lineWidth(2);

    try {
      doc.image(imageBuffer, x, y, {
        width: width,
        height: height,
        fit: [width, height],
        align: "center",
        valign: "center",
      });
      console.log(`✅ Photo ${photoNumber} added successfully to PDF`);
    } catch (imageError) {
      console.error(`❌ Failed to add image to PDF for photo ${photoNumber}:`, imageError.message);
      return false;
    }

    // Add label
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(colors.primary)
      .text(`Photo ${photoNumber}`, x, y + height + 10, {
        width: width,
        align: "center",
      });

    return true;
  } catch (error) {
    console.error(`❌ Error adding photo ${photoNumber}:`, error);
    return false;
  }
};

// Add placeholder
const addPhotoPlaceholder = (doc, x, y, width, height, photoNumber, reason = "Not Available") => {
  try {
    doc
      .rect(x - 5, y - 5, width + 10, height + 35)
      .fill("#F8F9FA")
      .stroke(colors.danger)
      .lineWidth(2);

    doc.rect(x, y, width, height).fill("#E9ECEF").stroke("#DEE2E6");

    doc
      .fontSize(24)
      .font("Helvetica")
      .fillColor("#6C757D")
      .text("📷", x + width / 2 - 12, y + height / 2 - 25, { align: "left" });

    doc
      .fontSize(9)
      .fillColor("#DC3545")
      .text(`Photo ${reason}`, x, y + height / 2 + 5, {
        width: width,
        align: "center",
      });

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(colors.primary)
      .text(`Photo ${photoNumber}`, x, y + height + 10, {
        width: width,
        align: "center",
      });

    console.log(`📸 Placeholder added for photo ${photoNumber}: ${reason}`);
  } catch (error) {
    console.error(`❌ Error adding placeholder for photo ${photoNumber}:`, error);
  }
};

// 🔧 COMPLETELY REWRITTEN: Photos section with better logic
const addPhotosSection = async (doc, person) => {
  try {
    console.log("\n📸 =================================");
    console.log("📸 Starting photos section...");
    console.log("📸 Person:", person.name);
    console.log("📸 Raw person data:", {
      profilePicture: person.profilePicture,
      photos: person.photos,
      photoUrls: person.photoUrls
    });
    console.log("📸 =================================\n");

    // 🔧 FIXED: Collect all photo URLs with proper handling
    const allPhotoUrls = [];

    // Method 1: Check profilePicture (string)
    if (person.profilePicture) {
      if (typeof person.profilePicture === "string" && person.profilePicture.trim()) {
        // If it's a filename, convert to URL
        const url = person.profilePicture.includes('http') 
          ? person.profilePicture.trim() 
          : getSupabaseImageUrl(person.profilePicture.trim());
        if (url) {
          allPhotoUrls.push(url);
          console.log("📸 Added profile picture:", url);
        }
      }
    }

    // Method 2: Check photos array (could be strings or objects)
    if (person.photos && Array.isArray(person.photos)) {
      person.photos.forEach((photo, index) => {
        let url = null;
        
        if (typeof photo === "string" && photo.trim()) {
          // String filename - convert to URL
          url = photo.includes('http') ? photo.trim() : getSupabaseImageUrl(photo.trim());
        } else if (typeof photo === "object" && photo !== null) {
          // Object with url property
          url = photo.url || (photo.fileName ? getSupabaseImageUrl(photo.fileName) : null);
        }
        
        if (url) {
          allPhotoUrls.push(url);
          console.log(`📸 Added photo ${index + 1} from photos array:`, url);
        }
      });
    }

    // Method 3: Check photoUrls array (should be URLs)
    if (person.photoUrls && Array.isArray(person.photoUrls)) {
      person.photoUrls.forEach((photoUrl, index) => {
        if (photoUrl && typeof photoUrl === "string" && photoUrl.trim()) {
          allPhotoUrls.push(photoUrl.trim());
          console.log(`📸 Added photo ${index + 1} from photoUrls array:`, photoUrl);
        }
      });
    }

    // Remove duplicates and limit to 4
    const uniquePhotoUrls = [...new Set(allPhotoUrls)].slice(0, 4);
    console.log(`📸 Final photos to process: ${uniquePhotoUrls.length}`);
    console.log(`📸 URLs:`, uniquePhotoUrls);

    // Add new page
    doc.addPage();
    addStyledSectionHeader(doc, "📷 PHOTOGRAPHS");

    if (uniquePhotoUrls.length === 0) {
      doc.rect(50, doc.y, 500, 120).fill("#F8F9FA").stroke("#DEE2E6");
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#6C757D")
        .text("📷 No Photos Available", 50, doc.y - 100, { width: 500, align: "center" });
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#495057")
        .text("Photos will appear here when uploaded", 50, doc.y + 20, { width: 500, align: "center" });
      console.log("📸 No photos - added placeholder message");
      return true;
    }

    // Calculate layout
    const photosCount = uniquePhotoUrls.length;
    let photosPerRow, photoWidth, photoHeight;

    if (photosCount === 1) {
      photosPerRow = 1;
      photoWidth = 250;
      photoHeight = 300;
    } else if (photosCount === 2) {
      photosPerRow = 2;
      photoWidth = 200;
      photoHeight = 240;
    } else {
      photosPerRow = 2;
      photoWidth = 180;
      photoHeight = 216;
    }

    const pageWidth = doc.page.width - 100;
    const totalWidthUsed = photosPerRow * photoWidth + (photosPerRow - 1) * 40;
    const startX = 50 + (pageWidth - totalWidthUsed) / 2;

    let currentX = startX;
    let currentY = doc.y + 20;
    let photosInCurrentRow = 0;
    let successfulPhotos = 0;

    for (let i = 0; i < uniquePhotoUrls.length; i++) {
      const photoUrl = uniquePhotoUrls[i];

      // Handle 3 photos layout
      if (photosCount === 3 && i === 2) {
        currentY += photoHeight + 60;
        currentX = 50 + (pageWidth - photoWidth) / 2;
        photosInCurrentRow = 0;
      } else if (photosInCurrentRow >= photosPerRow) {
        currentY += photoHeight + 60;
        currentX = startX;
        photosInCurrentRow = 0;
      }

      console.log(`\n📸 Processing photo ${i + 1}/${photosCount} at (${currentX}, ${currentY})`);

      const photoAdded = await addSinglePhoto(doc, photoUrl, currentX, currentY, photoWidth, photoHeight, i + 1);

      if (photoAdded) {
        successfulPhotos++;
      } else {
        addPhotoPlaceholder(doc, currentX, currentY, photoWidth, photoHeight, i + 1, "Failed to Load");
      }

      if (!(photosCount === 3 && i === 2)) {
        currentX += photoWidth + 40;
      }
      photosInCurrentRow++;
    }

    doc.y = currentY + photoHeight + 50;

    // Add summary
    if (successfulPhotos > 0) {
      doc
        .fontSize(10)
        .fillColor(colors.success)
        .text(`✅ Successfully loaded ${successfulPhotos}/${photosCount} photos`, 50, doc.y, { align: "center" });
    } else {
      doc
        .fontSize(10)
        .fillColor(colors.danger)
        .text(`⚠️ Could not load any photos. Please check uploads.`, 50, doc.y, { align: "center" });
    }

    console.log(`\n✅ Photos section completed: ${successfulPhotos}/${photosCount} loaded`);
    return true;
  } catch (error) {
    console.error("❌ Error in photos section:", error);
    try {
      doc
        .fontSize(12)
        .fillColor(colors.danger)
        .text("⚠️ Error loading photos section", 50, doc.y, { align: "center" });
    } catch (fallbackError) {
      console.error("❌ Fallback error:", fallbackError);
    }
    return false;
  }
};

// Important note
const addImportantNote = (doc) => {
  const noteText = "NOTE: The above particulars have been provided to the best of our knowledge, as per information provided by the concerned party. We (Jodi No1) shall not be responsible for misrepresentation of any or all of the information herein. Amount will not be refunded in any case. All clients have to pay full maturity amount on ROKA CEREMONY.";

  doc.moveDown(3);
  const requiredSpace = 150;
  const availableSpace = doc.page.height - doc.y - 70;

  if (availableSpace < requiredSpace) {
    doc.addPage();
    doc.moveDown(2);
  }

  const headerY = doc.y;
  doc.rect(40, headerY, 520, 35).fill(colors.warning);
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(colors.white)
    .text("⚠️ IMPORTANT NOTICE", 55, headerY + 10);

  doc.y = headerY + 45;
  const noteHeight = 100;
  const contentY = doc.y;
  doc.rect(40, contentY, 520, noteHeight).fill("#FFF3CD").stroke(colors.warning);
  doc
    .fontSize(10)
    .fillColor("#856404")
    .font("Helvetica")
    .text(noteText, 55, contentY + 15, { width: 490, align: "justify", lineGap: 3 });

  doc.y = contentY + noteHeight + 20;
};

// Header
const addHeader = (doc, person) => {
  doc.rect(0, 0, doc.page.width, 80).fill(colors.primary);
  doc
    .fontSize(28)
    .font("Helvetica-Bold")
    .fillColor(colors.white)
    .text("JODI NO 1", 50, 25);
  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor(colors.light)
    .text("📞 9871080409 | ✉️ jodino1@gmail.com", 50, 55)
    .text("📍 G-25, Vardhman Premium Mall, Opp.Kali Mata Mandir, Deepali enclave, Delhi-110034", 50, 70);

  doc.moveDown(3);
  doc.rect(40, doc.y, 520, 40).fill(colors.accent);
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor(colors.white)
    .text(person.name || "N/A", 50, doc.y - 28, { align: "center" });

  doc.moveDown(2);
  doc.fillColor(colors.text);
};

// 🔧 MAIN PDF ROUTE with enhanced error handling
router.get("/person/:id/pdf", async (req, res) => {
  let doc = null;

  try {
    const { id } = req.params;
    console.log(`\n📄 =====================================`);
    console.log(`📄 PDF generation started for: ${id}`);
    console.log(`📄 Query params:`, req.query);
    console.log(`📄 =====================================\n`);

    // Validate ID
    if (!id || id.length !== 24) {
      console.error("❌ Invalid person ID format:", id);
      return res.status(400).json({ message: "Invalid person ID format" });
    }

    // 🔧 FIXED: Find person without .lean() to preserve Mongoose methods
    console.log("🔍 Finding person in database...");
    const person = await Person.findById(id).exec();

    if (!person) {
      console.error("❌ Person not found with ID:", id);
      return res.status(404).json({ message: "Person not found" });
    }

    console.log("✅ Person found:", person.name);
    
    // 🔧 FIXED: Convert to plain object but preserve original data structure
    const personData = person.toObject();
    
    console.log("📸 Person photo fields:", {
      profilePicture: personData.profilePicture ? "✅" : "❌",
      photos: personData.photos ? `Array(${personData.photos.length})` : "❌",
      photoUrls: personData.photoUrls ? `Array(${personData.photoUrls.length})` : "❌"
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${(person.name || "profile").replace(/[^a-zA-Z0-9]/g, "_")}_profile.pdf"`
    );

    // Create PDF
    console.log("📄 Creating PDF document...");
    doc = new PDFDocument({
      margin: 50,
      size: "A4",
      bufferPages: false,
      info: {
        Title: `${person.name || "Profile"} - JODI NO 1`,
        Author: "JODI NO 1",
        Subject: "Matrimonial Profile",
      },
    });

    doc.pipe(res);

    // Add content
    addHeader(doc, personData);

    // Personal Details
    addStyledSectionHeader(doc, "👤 PERSONAL DETAILS");
    addStyledField(doc, "Full Name", personData.name);
    addStyledField(doc, "Age", personData.age);
    addStyledField(doc, "Gender", personData.gender);
    addStyledField(doc, "Religion", personData.religion);
    addStyledField(doc, "Caste", personData.caste);
    addStyledField(doc, "Marital Status", personData.maritalStatus);
    addStyledField(doc, "State", personData.state);
    addStyledField(doc, "Phone Number", personData.phoneNumber);
    addStyledField(doc, "Area", personData.area);
    addStyledField(doc, "Date of Birth", formatDate(personData.dob));
    addStyledField(doc, "Native Place", personData.nativePlace);
    addStyledField(doc, "Birth Place & Time", personData.birthPlaceTime);
    addStyledField(doc, "Gotra", personData.gotra);
    addStyledField(doc, "Height", personData.height);
    addStyledField(doc, "Complexion", personData.complexion);

    // Lifestyle
    addStyledSectionHeader(doc, "🎯 LIFESTYLE & HABITS");
    addStyledField(doc, "Eating Habits", personData.eatingHabits);
    addStyledField(doc, "Drinking Habits", personData.drinkingHabits);
    addStyledField(doc, "Smoking Habits", personData.smokingHabits);
    addStyledField(doc, "Any Disability", personData.disability);
    addStyledField(doc, "NRI Status", personData.nri ? "Yes" : "No");
    addStyledField(doc, "Vehicle Owned", personData.vehicle ? "Yes" : "No");
    addStyledField(doc, "Horoscope Available", personData.horoscope ? "Yes" : "No");

    // Family Details
    addStyledSectionHeader(doc, "👨‍👩‍👧‍👦 FAMILY DETAILS");
    addStyledField(doc, "Father's Name", personData.fatherName);
    addStyledField(doc, "Father's Occupation", personData.fatherOccupation);
    addStyledField(doc, "Father's Office Details", personData.fatherOffice);
    addStyledField(doc, "Mother's Name", personData.motherName);
    addStyledField(doc, "Mother's Occupation", personData.motherOccupation);
    addStyledField(doc, "Residence Type", personData.residence);
    addStyledField(doc, "Other Properties", personData.otherProperty);

    // Education
    addStyledSectionHeader(doc, "🎓 EDUCATION");
    addStyledField(doc, "Education", personData.education);
    addStyledField(doc, "Higher Qualification", personData.higherQualification);
    addStyledField(doc, "Graduation", personData.graduation);
    addStyledField(doc, "Schooling", personData.schooling);

    // Income & Occupation
    addStyledSectionHeader(doc, "💼 INCOME & OCCUPATION");
    addStyledField(doc, "Income", personData.income);
    addStyledField(doc, "Personal Income", personData.personalIncome);
    addStyledField(doc, "Family Income", personData.familyIncome);
    addStyledField(doc, "Occupation", personData.occupation);

    // Siblings
    if (personData.siblings && personData.siblings.length > 0) {
      addStyledSectionHeader(doc, "👫 SIBLINGS");
      personData.siblings.forEach((sibling, index) => {
        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor(colors.accent)
          .text(`Sibling ${index + 1}:`, 50);
        doc.moveDown(0.3);

        addStyledField(doc, "  Name", sibling.name, { indent: 20, labelColor: colors.secondary });
        addStyledField(doc, "  Relation", sibling.relation || sibling.relationship, { indent: 20, labelColor: colors.secondary });
        addStyledField(doc, "  Age", sibling.age, { indent: 20, labelColor: colors.secondary });
        addStyledField(doc, "  Profession", sibling.profession || sibling.occupation, { indent: 20, labelColor: colors.secondary });
        addStyledField(doc, "  Marital Status", sibling.maritalStatus, { indent: 20, labelColor: colors.secondary });
        doc.moveDown(0.5);
      });
    }

    // 🔧 FIXED: Photos section with original data
    await addPhotosSection(doc, personData);

    // Important notice
    addImportantNote(doc);

    // Footer
    const footerY = doc.page.height - 40;
    doc
      .fontSize(10)
      .fillColor("#7F8C8D")
      .text(
        `Generated on: ${new Date().toLocaleDateString("en-IN")} | JODI NO 1 Matrimonial Services`,
        50,
        footerY,
        { align: "center" }
      );

    doc.end();
    console.log("\n✅ PDF generated successfully!");
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    console.error("❌ Error stack:", error.stack);

    if (doc && !doc.ended) {
      try {
        doc.end();
      } catch (endError) {
        console.error("❌ Error ending PDF:", endError);
      }
    }

    if (!res.headersSent) {
      res.status(500).json({
        message: "PDF generation failed",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// 🔧 DEBUG ROUTE - Enhanced for photo debugging
router.get("/person/:id/debug", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Debug request for person:", id);
    
    if (!id || id.length !== 24) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid person ID format",
        id: id,
        idLength: id ? id.length : 0
      });
    }

    const person = await Person.findById(id).lean().exec();
    
    if (!person) {
      return res.status(404).json({ 
        success: false, 
        error: "Person not found",
        id: id
      });
    }

    // 🔧 ENHANCED: Detailed photo analysis
    const photoAnalysis = {
      profilePicture: {
        exists: !!person.profilePicture,
        value: person.profilePicture,
        type: typeof person.profilePicture,
        isUrl: person.profilePicture ? person.profilePicture.includes('http') : false,
        isSupabase: person.profilePicture ? person.profilePicture.includes('supabase.co') : false,
        generatedUrl: person.profilePicture ? getSupabaseImageUrl(person.profilePicture) : null
      },
      photos: {
        exists: !!person.photos,
        isArray: Array.isArray(person.photos),
        count: person.photos ? person.photos.length : 0,
        values: person.photos || [],
        urlAnalysis: person.photos ? person.photos.map((photo, index) => ({
          index,
          value: photo,
          type: typeof photo,
          isUrl: typeof photo === 'string' ? photo.includes('http') : false,
          isSupabase: typeof photo === 'string' ? photo.includes('supabase.co') : false,
          hasUrlProperty: typeof photo === 'object' ? !!photo.url : false,
          hasFileNameProperty: typeof photo === 'object' ? !!photo.fileName : false,
          generatedUrl: typeof photo === 'string' ? getSupabaseImageUrl(photo) : 
                       (typeof photo === 'object' && photo.fileName ? getSupabaseImageUrl(photo.fileName) : null)
        })) : []
      },
      photoUrls: {
        exists: !!person.photoUrls,
        isArray: Array.isArray(person.photoUrls),
        count: person.photoUrls ? person.photoUrls.length : 0,
        values: person.photoUrls || []
      }
    };

    // Test URL accessibility
    if (photoAnalysis.profilePicture.generatedUrl) {
      try {
        const testResponse = await fetch(photoAnalysis.profilePicture.generatedUrl, { method: 'HEAD' });
        photoAnalysis.profilePicture.urlAccessible = testResponse.ok;
        photoAnalysis.profilePicture.httpStatus = testResponse.status;
      } catch (e) {
        photoAnalysis.profilePicture.urlAccessible = false;
        photoAnalysis.profilePicture.httpError = e.message;
      }
    }

    res.json({
      success: true,
      personId: id,
      personName: person.name,
      allFields: Object.keys(person),
      photoAnalysis: photoAnalysis,
      dependencies: {
        axios: !!axios,
        supabase: !!supabase,
        supabaseUrl: supabase ? 'Connected' : 'Not available'
      },
      recommendations: {
        dataStructure: person.photos && person.photos.length > 0 && typeof person.photos[0] === 'object' 
          ? "⚠️ Photos are stored as objects, this might cause PDF issues"
          : "✅ Photos data structure looks correct",
        urlGeneration: photoAnalysis.profilePicture.generatedUrl 
          ? "✅ URL generation working" 
          : "❌ URL generation failed"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Debug route error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 🔧 TEST ROUTE
router.get("/test-pdf", async (req, res) => {
  try {
    console.log("📄 Testing PDF generation...");
    
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="test.pdf"');
    doc.pipe(res);

    doc
      .fontSize(20)
      .fillColor(colors.primary)
      .text("PDF Routes Test - Success! ✅", 100, 100);
    
    doc
      .fontSize(12)
      .fillColor(colors.text)
      .text("Dependencies Status:", 100, 140);
    
    doc
      .fontSize(10)
      .fillColor(axios ? "#27AE60" : "#E74C3C")
      .text(`Axios: ${axios ? "✅ Available" : "❌ Missing"}`, 100, 170);
    
    doc
      .fontSize(10)
      .fillColor(supabase ? "#27AE60" : "#E74C3C")
      .text(`Supabase: ${supabase ? "✅ Available" : "❌ Missing"}`, 100, 190);

    if (supabase) {
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        doc
          .fontSize(10)
          .fillColor(!error ? "#27AE60" : "#E74C3C")
          .text(`Storage Connection: ${!error ? "✅ Working" : "❌ Failed"}`, 100, 210);
        
        if (buckets) {
          doc
            .fontSize(10)
            .fillColor("#666")
            .text(`Available Buckets: ${buckets.map(b => b.name).join(', ')}`, 100, 230);
        }
      } catch (bucketError) {
        doc
          .fontSize(10)
          .fillColor("#E74C3C")
          .text(`Storage Test Failed: ${bucketError.message}`, 100, 210);
      }
    }

    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`Server Time: ${new Date().toISOString()}`, 100, 270);

    doc.end();
  } catch (error) {
    console.error("❌ Test PDF failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔧 HEALTH CHECK ROUTE
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "PDF Generation Service",
    dependencies: {
      axios: !!axios,
      supabase: !!supabase,
      pdfkit: !!PDFDocument
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

console.log("✅ PDF routes loaded with enhanced photo handling!");

module.exports = router;