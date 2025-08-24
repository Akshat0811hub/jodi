// routes/pdfRoutes.js - FIXED VERSION with proper Supabase Integration
const express = require("express");
const PDFDocument = require("pdfkit");
const Person = require("../models/personModel");
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios'); // Add this dependency

const router = express.Router();

console.log("📄 Loading PDF routes with Supabase integration...");

// 🆓 SUPABASE CONFIGURATION
const supabaseUrl = process.env.SUPABASE_URL || 'https://anjowgqnhyatiltnencb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuam93Z3FuaHlhdGlsdG5lbmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTM0MDQsImV4cCI6MjA3MTUyOTQwNH0.xccgtRzzj8QWdfo2ivmycYAUIK3L_KUYO_emOnzq1ZE';
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'matrimony-photos';

// Color scheme for better styling
const colors = {
  primary: "#2C3E50",
  secondary: "#34495E",
  accent: "#3498DB",
  success: "#27AE60",
  warning: "#F39C12",
  danger: "#E74C3C",
  light: "#ECF0F1",
  dark: "#2C3E50",
  white: "#FFFFFF",
  text: "#2C3E50",
  label: "#5D6D7E",
  value: "#34495E",
};

// Helper function to format date
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

// Helper function to add styled field
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

// Beautiful section header
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

// 🆓 FIXED: Download image from Supabase URL
const downloadImageFromSupabase = async (imageUrl) => {
  try {
    console.log("📥 Downloading image from URL:", imageUrl);
    
    // Method 1: Try direct URL download first (for public URLs)
    if (imageUrl.includes('supabase.co') && imageUrl.includes('/storage/v1/object/public/')) {
      console.log("📡 Using direct public URL download");
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'PDF-Generator/1.0'
        }
      });
      
      if (response.data && response.data.byteLength > 0) {
        console.log("✅ Direct download successful, size:", response.data.byteLength);
        return Buffer.from(response.data);
      }
    }

    // Method 2: Extract path and use Supabase SDK
    console.log("📁 Trying Supabase SDK download");
    const urlParts = imageUrl.split('/');
    let filePath = '';
    
    // More flexible path extraction
    if (imageUrl.includes('/storage/v1/object/public/' + BUCKET_NAME + '/')) {
      const pathStart = imageUrl.indexOf('/storage/v1/object/public/' + BUCKET_NAME + '/') + 
                       ('/storage/v1/object/public/' + BUCKET_NAME + '/').length;
      filePath = imageUrl.substring(pathStart);
    } else {
      // Fallback: try to find bucket name and extract path
      const bucketIndex = urlParts.findIndex(part => part === BUCKET_NAME);
      if (bucketIndex !== -1) {
        filePath = urlParts.slice(bucketIndex + 1).join('/');
      } else {
        throw new Error("Cannot extract file path from URL");
      }
    }
    
    console.log("📁 Extracted file path:", filePath);
    
    if (!filePath) {
      throw new Error("Empty file path extracted");
    }
    
    // Download from Supabase using SDK
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);
      
    if (error) {
      console.error("❌ Supabase download error:", error);
      throw error;
    }
    
    if (!data) {
      throw new Error("No data received from Supabase");
    }
    
    // Convert blob to buffer
    const buffer = await data.arrayBuffer();
    console.log("✅ Supabase SDK download successful, size:", buffer.byteLength);
    
    return Buffer.from(buffer);
  } catch (error) {
    console.error("❌ Error downloading image:", error.message);
    return null;
  }
};

// 🆓 FIXED: Add single photo from URL with better error handling
const addSinglePhotoFromUrl = async (
  doc,
  imageUrl,
  x,
  y,
  width,
  height,
  photoNumber
) => {
  try {
    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
      console.log(`❌ Invalid image URL for photo ${photoNumber}:`, imageUrl);
      return false;
    }

    console.log(`\n📸 Processing photo ${photoNumber}:`);
    console.log(`   URL: ${imageUrl.substring(0, 80)}...`);

    // Download image
    const imageBuffer = await downloadImageFromSupabase(imageUrl.trim());

    if (!imageBuffer || imageBuffer.length === 0) {
      console.log(`❌ Failed to download photo ${photoNumber}`);
      return false;
    }

    // Validate buffer size
    if (imageBuffer.length > 10 * 1024 * 1024) { // 10MB limit
      console.log(`❌ Photo ${photoNumber} too large: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      return false;
    }

    console.log(`📊 Photo ${photoNumber} buffer size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // Add decorative frame
    doc
      .rect(x - 5, y - 5, width + 10, height + 35)
      .fill(colors.light)
      .stroke(colors.primary)
      .lineWidth(2);

    try {
      // Add image to PDF from buffer
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

    // Add photo label
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
    console.error(`❌ Unexpected error adding photo ${photoNumber}:`, error);
    return false;
  }
};

// Photo placeholder with better styling
const addPhotoPlaceholder = (
  doc,
  x,
  y,
  width,
  height,
  photoNumber,
  reason = "Not Available"
) => {
  try {
    // Add frame
    doc
      .rect(x - 5, y - 5, width + 10, height + 35)
      .fill("#F8F9FA")
      .stroke(colors.danger)
      .lineWidth(2);

    // Add placeholder content
    doc.rect(x, y, width, height).fill("#E9ECEF").stroke("#DEE2E6");

    // Add icon/text
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

    // Add label
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

// 🆓 FIXED: Photos section with better URL handling
const addPhotosSection = async (doc, person) => {
  try {
    console.log("\n📸 =================================");
    console.log("📸 Starting photos section processing...");
    console.log("📸 Person ID:", person._id);
    console.log("📸 Person name:", person.name);
    console.log("📸 Person data keys:", Object.keys(person));
    
    // Debug: Check all possible photo fields
    console.log("📸 profilePicture:", person.profilePicture);
    console.log("📸 photos array:", person.photos);
    console.log("📸 photoUrls array:", person.photoUrls); // Check if this exists
    console.log("📸 =================================\n");

    // Collect all available photo URLs from all possible fields
    const allPhotoUrls = [];

    // Check profilePicture
    if (person.profilePicture && typeof person.profilePicture === "string" && 
        person.profilePicture.trim()) {
      allPhotoUrls.push(person.profilePicture.trim());
      console.log("📸 Added profile picture to collection");
    }

    // Check photos array
    if (person.photos && Array.isArray(person.photos)) {
      person.photos.forEach((photoUrl, index) => {
        if (photoUrl && typeof photoUrl === "string" && photoUrl.trim()) {
          allPhotoUrls.push(photoUrl.trim());
          console.log(`📸 Added photo ${index + 1} from photos array`);
        }
      });
    }

    // Check photoUrls array (if it exists)
    if (person.photoUrls && Array.isArray(person.photoUrls)) {
      person.photoUrls.forEach((photoUrl, index) => {
        if (photoUrl && typeof photoUrl === "string" && photoUrl.trim()) {
          allPhotoUrls.push(photoUrl.trim());
          console.log(`📸 Added photo ${index + 1} from photoUrls array`);
        }
      });
    }

    // Remove duplicates and limit to 4
    const uniquePhotoUrls = [...new Set(allPhotoUrls)].slice(0, 4);
    console.log(`📸 Final photo URLs to process: ${uniquePhotoUrls.length}`);
    uniquePhotoUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url.length > 80 ? url.substring(0, 80) + '...' : url}`);
    });

    // Add new page for photos
    doc.addPage();

    // Photos section header
    addStyledSectionHeader(doc, "📷 PHOTOGRAPHS");

    if (uniquePhotoUrls.length === 0) {
      // Enhanced no photos message
      doc.rect(50, doc.y, 500, 120).fill("#F8F9FA").stroke("#DEE2E6");

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#6C757D")
        .text("📷 No Photos Available", 50, doc.y - 100, {
          width: 500,
          align: "center",
        });

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#495057")
        .text("Photos will appear here when uploaded through the form", 50, doc.y + 20, {
          width: 500,
          align: "center",
        });

      doc
        .fontSize(10)
        .fillColor("#6C757D")
        .text("Supported: JPEG, PNG, GIF, WebP | Stored in Supabase Cloud", 50, doc.y + 15, {
          width: 500,
          align: "center",
        });

      console.log("📸 No photos available - added enhanced placeholder");
      return true;
    }

    // Calculate layout dynamically
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

    // Process each photo
    for (let i = 0; i < uniquePhotoUrls.length; i++) {
      const photoUrl = uniquePhotoUrls[i];

      // Layout calculations for 3 photos (special case)
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

      // Try to add the photo
      const photoAdded = await addSinglePhotoFromUrl(
        doc,
        photoUrl,
        currentX,
        currentY,
        photoWidth,
        photoHeight,
        i + 1
      );

      if (photoAdded) {
        successfulPhotos++;
      } else {
        addPhotoPlaceholder(
          doc,
          currentX,
          currentY,
          photoWidth,
          photoHeight,
          i + 1,
          "Failed to Load"
        );
      }

      // Move to next position
      if (!(photosCount === 3 && i === 2)) {
        currentX += photoWidth + 40;
      }
      photosInCurrentRow++;
    }

    // Update doc position
    const finalPhotoY = currentY + photoHeight + 50;
    doc.y = finalPhotoY;

    // Add photos summary
    if (successfulPhotos > 0) {
      doc
        .fontSize(10)
        .fillColor(colors.success)
        .text(
          `✅ Successfully loaded ${successfulPhotos}/${photosCount} photos from Supabase Cloud Storage`,
          50,
          doc.y,
          { align: "center" }
        );
    } else {
      doc
        .fontSize(10)
        .fillColor(colors.danger)
        .text(
          `⚠️ Could not load any photos. Please check if images are properly uploaded to Supabase.`,
          50,
          doc.y,
          { align: "center" }
        );
    }

    console.log(`\n✅ Photos section completed: ${successfulPhotos}/${photosCount} photos loaded`);
    return true;
  } catch (error) {
    console.error("❌ Error in addPhotosSection:", error);

    try {
      doc
        .fontSize(12)
        .fillColor(colors.danger)
        .text("⚠️ Error loading photos section", 50, doc.y, {
          align: "center",
        });
    } catch (fallbackError) {
      console.error("❌ Fallback error message failed:", fallbackError);
    }

    return false;
  }
};

// Enhanced important note
const addEnhancedImportantNote = (doc) => {
  const noteText =
    "NOTE: The above particulars have been provided to the best of our knowledge, as per information provided by the concerned party. We (Jodi No1) shall not be responsible for misrepresentation of any or all of the information herein. Amount will not be refunded in any case. All clients have to pay full maturity amount on ROKA CEREMONY.";

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
  doc
    .rect(40, contentY, 520, noteHeight)
    .fill("#FFF3CD")
    .stroke(colors.warning);

  doc
    .fontSize(10)
    .fillColor("#856404")
    .font("Helvetica")
    .text(noteText, 55, contentY + 15, {
      width: 490,
      align: "justify",
      lineGap: 3,
    });

  doc.y = contentY + noteHeight + 20;
};

// Styled header
const addStyledHeader = (doc, person) => {
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
    .text(
      "📍 G-25, Vardhman Premium Mall, Opp.Kali Mata Mandir, Deepali enclave, Delhi-110034",
      50,
      70
    );

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

// 🆓 MAIN PDF ROUTE with enhanced debugging
router.get("/person/:id/pdf", async (req, res) => {
  let doc = null;

  try {
    const { id } = req.params;
    console.log(`\n📄 =====================================`);
    console.log(`📄 Starting PDF generation for person ${id}`);
    console.log(`📄 =====================================\n`);

    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Invalid person ID format" });
    }

    // Fetch person with more details
    const person = await Person.findById(id).lean().exec();

    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    console.log("✅ Person found:", person.name || "Unnamed");
    console.log("📸 Person object keys:", Object.keys(person));
    console.log("📸 Photos field:", person.photos);
    console.log("📸 PhotoUrls field:", person.photoUrls);
    console.log("📸 Profile picture:", person.profilePicture);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${(person.name || "profile").replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_profile.pdf"`
    );

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

    // Add all sections
    addStyledHeader(doc, person);

    // Personal Details Section
    addStyledSectionHeader(doc, "👤 PERSONAL DETAILS");
    addStyledField(doc, "Full Name", person.name);
    addStyledField(doc, "Gender", person.gender);
    addStyledField(doc, "Marital Status", person.maritalStatus);
    addStyledField(doc, "Date of Birth", formatDate(person.dob));
    addStyledField(doc, "Birth Place & Time", person.birthPlaceTime);
    addStyledField(doc, "Native Place", person.nativePlace);
    addStyledField(doc, "Gotra", person.gotra);
    addStyledField(doc, "Religion", person.religion);
    addStyledField(doc, "Height", person.height);
    addStyledField(doc, "Complexion", person.complexion);

    // Lifestyle Section
    addStyledSectionHeader(doc, "🎯 LIFESTYLE & HABITS");
    addStyledField(doc, "Eating Habits", person.eatingHabits);
    addStyledField(doc, "Drinking Habits", person.drinkingHabits);
    addStyledField(doc, "Smoking Habits", person.smokingHabits);
    addStyledField(doc, "Any Disability", person.disability);
    addStyledField(doc, "NRI Status", person.nri ? "Yes" : "No");
    addStyledField(doc, "Vehicle Owned", person.vehicle);
    addStyledField(doc, "Horoscope Available", person.horoscope ? "Yes" : "No");

    // Family Details Section
    addStyledSectionHeader(doc, "👨‍👩‍👧‍👦 FAMILY DETAILS");
    addStyledField(doc, "Father's Name", person.fatherName);
    addStyledField(doc, "Father's Occupation", person.fatherOccupation);
    addStyledField(doc, "Father's Office Details", person.fatherOffice);
    addStyledField(doc, "Mother's Name", person.motherName);
    addStyledField(doc, "Mother's Occupation", person.motherOccupation);
    addStyledField(doc, "Residence Type", person.residence);
    addStyledField(doc, "Other Properties", person.otherProperty);

    // Education Section
    addStyledSectionHeader(doc, "🎓 EDUCATIONAL QUALIFICATIONS");
    addStyledField(doc, "Highest Qualification", person.higherQualification);
    addStyledField(doc, "Graduation Details", person.graduation);
    addStyledField(doc, "School Education", person.schooling);

    // Professional Section
    addStyledSectionHeader(doc, "💼 PROFESSION & INCOME");
    addStyledField(doc, "Current Occupation", person.occupation);
    addStyledField(doc, "Personal Income", person.personalIncome);
    addStyledField(doc, "Family Income", person.familyIncome);

    // Contact Information Section
    addStyledSectionHeader(doc, "📞 CONTACT INFORMATION");
    addStyledField(doc, "Phone Number", person.phoneNumber);
    addStyledField(doc, "Email Address", person.email);
    addStyledField(doc, "Current Address", person.currentAddress);

    // Siblings Section
    if (person.siblings && person.siblings.length > 0) {
      addStyledSectionHeader(doc, "👫 SIBLINGS INFORMATION");

      person.siblings.forEach((sibling, index) => {
        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor(colors.accent)
          .text(`Sibling ${index + 1}:`, 50);
        doc.moveDown(0.3);

        addStyledField(doc, "  Name", sibling.name, {
          indent: 20,
          labelColor: colors.secondary,
        });
        addStyledField(doc, "  Relationship", sibling.relationship, {
          indent: 20,
          labelColor: colors.secondary,
        });
        addStyledField(doc, "  Age", sibling.age, {
          indent: 20,
          labelColor: colors.secondary,
        });
        addStyledField(doc, "  Marital Status", sibling.maritalStatus, {
          indent: 20,
          labelColor: colors.secondary,
        });
        addStyledField(doc, "  Occupation", sibling.occupation, {
          indent: 20,
          labelColor: colors.secondary,
        });

        doc.moveDown(0.5);
      });
    }

    // Photos section - this is the key fix
    await addPhotosSection(doc, person);

    // Add important notice
    addEnhancedImportantNote(doc);

    // Footer
    const footerY = doc.page.height - 40;
    doc
      .fontSize(10)
      .fillColor("#7F8C8D")
      .text(
        `Generated on: ${new Date().toLocaleDateString(
          "en-IN"
        )} | JODI NO 1 Matrimonial Services | Storage: Supabase`,
        50,
        footerY,
        { align: "center" }
      );

    doc.end();
    console.log("\n✅ PDF generated successfully!");
  } catch (error) {
    console.error("❌ PDF generation error:", error);

    if (doc && !doc.ended) {
      try {
        doc.end();
      } catch (e) {
        console.error("Error ending PDF:", e);
      }
    }

    if (!res.headersSent) {
      res.status(500).json({
        message: "PDF generation failed",
        error: error.message,
      });
    }
  }
});

// Enhanced test route
router.get("/test-pdf", async (req, res) => {
  try {
    console.log("📄 Testing PDF generation with Supabase...");
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    const supabaseWorking = !error;

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="test.pdf"');

    doc.pipe(res);

    doc
      .fontSize(20)
      .fillColor(colors.primary)
      .text("PDF Routes Fixed - Success! ✅", 100, 100);
    doc
      .fontSize(12)
      .fillColor(colors.text)
      .text("Photo integration fixed for Supabase storage.", 100, 140);
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`Supabase URL: ${supabaseUrl}`, 100, 170);
    doc
      .fontSize(10)
      .fillColor(supabaseWorking ? "#27AE60" : "#E74C3C")
      .text(`Supabase Status: ${supabaseWorking ? "✅ Connected" : "❌ Failed"}`, 100, 190);
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`Bucket: ${BUCKET_NAME}`, 100, 210);

    if (supabaseWorking && buckets) {
      doc
        .fontSize(10)
        .fillColor("#666")
        .text(`Available Buckets: ${buckets.map(b => b.name).join(', ')}`, 100, 230);
    }

    doc.end();
  } catch (error) {
    console.error("❌ Test PDF failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Debug route to check person data
router.get("/person/:id/debug", async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findById(id).lean().exec();
    
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    res.json({
      success: true,
      personId: id,
      personName: person.name,
      hasProfilePicture: !!person.profilePicture,
      profilePictureUrl: person.profilePicture,
      photosArray: person.photos,
      photosCount: person.photos ? person.photos.length : 0,
      photoUrlsArray: person.photoUrls,
      photoUrlsCount: person.photoUrls ? person.photoUrls.length : 0,
      allFields: Object.keys(person),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

console.log("✅ PDF routes loaded with enhanced Supabase photo debugging!");

module.exports = router;