// routes/pdfRoutes.js - FIXED VERSION with Supabase Integration
const express = require("express");
const PDFDocument = require("pdfkit");
const Person = require("../models/personModel");
const { createClient } = require('@supabase/supabase-js');
const path = require("path");

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

// 🆓 SUPABASE: Download image from URL and return buffer
const downloadImageFromSupabase = async (imageUrl) => {
  try {
    console.log("📥 Downloading image from Supabase:", imageUrl);
    
    // Extract the file path from the URL
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === BUCKET_NAME);
    
    if (bucketIndex === -1) {
      throw new Error("Invalid Supabase URL format");
    }
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    console.log("📁 Extracted file path:", filePath);
    
    // Download from Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error("No data received from Supabase");
    }
    
    // Convert blob to buffer
    const buffer = await data.arrayBuffer();
    console.log("✅ Image downloaded successfully, size:", buffer.byteLength, "bytes");
    
    return Buffer.from(buffer);
  } catch (error) {
    console.error("❌ Error downloading image from Supabase:", error);
    return null;
  }
};

// 🆓 SUPABASE: Add single photo from URL
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

    console.log(`\n📸 Processing photo ${photoNumber} from Supabase:`);
    console.log(`   URL: ${imageUrl}`);

    // Download image from Supabase
    const imageBuffer = await downloadImageFromSupabase(imageUrl.trim());

    if (!imageBuffer) {
      console.log(`❌ Failed to download photo ${photoNumber} from Supabase`);
      return false;
    }

    // Validate buffer
    if (imageBuffer.length === 0) {
      console.log(`❌ Photo ${photoNumber} buffer is empty`);
      return false;
    }

    if (imageBuffer.length > 10 * 1024 * 1024) { // 10MB limit
      console.log(
        `❌ Photo ${photoNumber} too large: ${(
          imageBuffer.length / 1024 / 1024
        ).toFixed(2)} MB`
      );
      return false;
    }

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

      console.log(`✅ Photo ${photoNumber} added successfully from Supabase`);
    } catch (imageError) {
      console.log(
        `❌ Failed to add image to PDF for photo ${photoNumber}:`,
        imageError.message
      );
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
    console.error(
      `❌ Error adding placeholder for photo ${photoNumber}:`,
      error
    );
  }
};

// 🆓 SUPABASE: Photos section with URL-based loading
const addPhotosSection = async (doc, person) => {
  try {
    console.log("\n📸 =================================");
    console.log("📸 Starting photos section processing (Supabase)...");
    console.log("📸 Person ID:", person._id);
    console.log("📸 Person name:", person.name);
    console.log("📸 Profile picture URL:", person.profilePicture);
    console.log("📸 Photos URLs:", person.photos);
    console.log("📸 =================================\n");

    // Collect all available photo URLs
    const allPhotoUrls = [];

    // Add profile picture if exists
    if (
      person.profilePicture &&
      typeof person.profilePicture === "string" &&
      person.profilePicture.trim() &&
      person.profilePicture.includes('supabase')
    ) {
      allPhotoUrls.push(person.profilePicture.trim());
      console.log("📸 Added profile picture URL to collection");
    }

    // Add photos array if exists
    if (person.photos && Array.isArray(person.photos)) {
      person.photos.forEach((photoUrl, index) => {
        if (photoUrl && typeof photoUrl === "string" && photoUrl.trim() && photoUrl.includes('supabase')) {
          allPhotoUrls.push(photoUrl.trim());
          console.log(`📸 Added photo URL ${index + 1} to collection`);
        } else {
          console.log(`⚠️ Skipped invalid photo URL ${index + 1}:`, photoUrl);
        }
      });
    }

    // Remove duplicates and limit to 4
    const uniquePhotoUrls = [...new Set(allPhotoUrls)].slice(0, 4);
    console.log(`📸 Final photo URLs to process: ${uniquePhotoUrls.length}`);
    uniquePhotoUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url.substring(0, 60)}...`);
    });

    // Add new page for photos
    doc.addPage();

    // Photos section header
    addStyledSectionHeader(doc, "📷 PHOTOGRAPHS");

    if (uniquePhotoUrls.length === 0) {
      doc.rect(50, doc.y, 500, 100).fill("#F8F9FA").stroke("#DEE2E6");

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#6C757D")
        .text("📷 No photos uploaded", 50, doc.y - 80, {
          width: 500,
          align: "center",
        });

      doc
        .fontSize(11)
        .font("Helvetica")
        .text("Photos will be displayed here when uploaded to Supabase", 50, doc.y + 20, {
          width: 500,
          align: "center",
        });

      console.log("📸 No photos available - added placeholder message");
      return true;
    }

    // Calculate layout dynamically
    const photosCount = uniquePhotoUrls.length;
    let photosPerRow, photoWidth, photoHeight;

    if (photosCount === 1) {
      photosPerRow = 1;
      photoWidth = 200;
      photoHeight = 240;
    } else if (photosCount === 2) {
      photosPerRow = 2;
      photoWidth = 180;
      photoHeight = 216;
    } else if (photosCount === 3) {
      photosPerRow = 2;
      photoWidth = 150;
      photoHeight = 180;
    } else {
      photosPerRow = 2;
      photoWidth = 150;
      photoHeight = 180;
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

      // Special handling for 3 photos layout
      if (photosCount === 3 && i === 2) {
        currentY += photoHeight + 60;
        currentX = 50 + (pageWidth - photoWidth) / 2;
        photosInCurrentRow = 0;
      } else if (photosInCurrentRow >= photosPerRow) {
        currentY += photoHeight + 60;
        currentX = startX;
        photosInCurrentRow = 0;
      }

      console.log(
        `\n📸 Processing photo ${
          i + 1
        }/${photosCount} at position (${currentX}, ${currentY})`
      );

      // Try to add the photo from Supabase URL
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
        // Add placeholder with specific reason
        addPhotoPlaceholder(
          doc,
          currentX,
          currentY,
          photoWidth,
          photoHeight,
          i + 1,
          "Download Failed"
        );
      }

      // Move to next position
      if (!(photosCount === 3 && i === 2)) {
        currentX += photoWidth + 40;
      }
      photosInCurrentRow++;
    }

    // Update doc.y position
    const finalPhotoY = currentY + photoHeight + 50;
    doc.y = finalPhotoY;

    console.log(
      `\n✅ Photos section completed: ${successfulPhotos}/${photosCount} photos loaded successfully from Supabase`
    );
    return true;
  } catch (error) {
    console.error("❌ Error in addPhotosSection (Supabase):", error);

    try {
      doc
        .fontSize(12)
        .fillColor("#E74C3C")
        .text("⚠️ Error loading photos section from Supabase", 50, doc.y, {
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

// 🆓 MAIN PDF ROUTE with Supabase Integration
router.get("/person/:id/pdf", async (req, res) => {
  let doc = null;

  try {
    const { id } = req.params;
    console.log(`\n📄 =====================================`);
    console.log(`📄 Starting PDF generation for person ${id} (Supabase)`);
    console.log(`📄 =====================================\n`);

    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Invalid person ID format" });
    }

    const person = await Person.findById(id).lean().exec();

    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    console.log("✅ Person found:", person.name || "Unnamed");
    console.log("📸 Photos in database:", person.photos?.length || 0);
    console.log("📸 Profile picture:", person.profilePicture ? "✅" : "❌");

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

    // Photos section with Supabase integration
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
    console.log(
      "\n✅ PDF generated successfully with Supabase photo integration!"
    );
  } catch (error) {
    console.error("❌ PDF generation error:", error);

    if (doc && !doc.ended) {
      try {
        doc.end();
      } catch (e) {}
    }

    if (!res.headersSent) {
      res.status(500).json({
        message: "PDF generation failed",
        error: error.message,
      });
    }
  }
});

// 🆓 Test route with Supabase info
router.get("/test-pdf", async (req, res) => {
  try {
    console.log("📄 Testing PDF generation with Supabase...");
    
    // Test Supabase connection
    const { data: buckets, error } = await supabase.storage.listBuckets();
    const supabaseWorking = !error;

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="test.pdf"');

    doc.pipe(res);

    doc
      .fontSize(20)
      .fillColor(colors.primary)
      .text("PDF Routes with Supabase Test - Success! ✅", 100, 100);
    doc
      .fontSize(12)
      .fillColor(colors.text)
      .text("Photo integration updated for Supabase storage.", 100, 140);
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

// 🆓 Bulk PDF generation (placeholder)
router.post("/bulk", async (req, res) => {
  try {
    console.log("📄 Bulk PDF generation requested (Supabase enabled)");
    
    // This would be implemented for generating multiple PDFs
    res.status(501).json({
      message: "Bulk PDF generation not yet implemented",
      storage: "Supabase",
      note: "Individual PDF generation is working with Supabase"
    });
  } catch (error) {
    res.status(500).json({
      message: "Bulk PDF generation failed",
      error: error.message
    });
  }
});

console.log(
  "✅ PDF routes loaded with Supabase integration for photo handling!"
);

module.exports = router;