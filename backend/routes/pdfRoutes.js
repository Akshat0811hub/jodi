// routes/pdfRoutes.js - FIXED VERSION with Photo Issues Resolved
const express = require("express");
const PDFDocument = require("pdfkit");
const Person = require("../models/personModel");
const path = require("path");
const fs = require("fs");

const router = express.Router();

console.log("📄 Loading FIXED PDF routes with photo issues resolved...");

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

// 🔧 FIXED: Improved photo path resolution with debug logging
const resolvePhotoPath = (photoPath) => {
  if (!photoPath || typeof photoPath !== "string") {
    console.log("❌ Invalid photo path type:", typeof photoPath, photoPath);
    return null;
  }

  const cleanPath = photoPath.trim();
  console.log("🔍 Looking for photo:", cleanPath);

  // Since we store only filenames, construct the full path directly
  const fullPath = path.join(process.cwd(), "uploads", cleanPath);
  console.log("📁 Full path:", fullPath);

  if (fs.existsSync(fullPath)) {
    console.log("✅ Photo found at:", fullPath);
    return fullPath;
  }

  console.log("❌ Photo not found:", fullPath);
  return null;
};

// 🔧 FIXED: Improved single photo addition with better validation
const addSinglePhoto = async (
  doc,
  photoPath,
  x,
  y,
  width,
  height,
  photoNumber
) => {
  try {
    if (!photoPath || typeof photoPath !== "string" || !photoPath.trim()) {
      console.log(`❌ Invalid photo path for photo ${photoNumber}:`, photoPath);
      return false;
    }

    console.log(`\n📸 Processing photo ${photoNumber}:`);
    console.log(`   Original path: ${photoPath}`);

    const fullPath = resolvePhotoPath(photoPath.trim());

    if (!fullPath || !fs.existsSync(fullPath)) {
      console.log(
        `❌ Photo ${photoNumber} file not found after path resolution`
      );
      return false;
    }

    // 🔧 FIXED: Better file validation
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    const ext = path.extname(fullPath).toLowerCase();

    if (!validExtensions.includes(ext)) {
      console.log(`❌ Invalid image type for photo ${photoNumber}: ${ext}`);
      console.log(`   Supported types: ${validExtensions.join(", ")}`);
      return false;
    }

    // Check file size and readability
    try {
      const stats = fs.statSync(fullPath);
      console.log(
        `📊 Photo ${photoNumber} stats: ${(stats.size / 1024).toFixed(2)} KB`
      );

      if (stats.size === 0) {
        console.log(`❌ Photo ${photoNumber} is empty (0 bytes)`);
        return false;
      }

      if (stats.size > 10 * 1024 * 1024) {
        // 10MB limit
        console.log(
          `❌ Photo ${photoNumber} too large: ${(
            stats.size /
            1024 /
            1024
          ).toFixed(2)} MB`
        );
        return false;
      }

      // Test if file is readable
      fs.accessSync(fullPath, fs.constants.R_OK);
    } catch (error) {
      console.log(`❌ Cannot access photo ${photoNumber} file:`, error.message);
      return false;
    }

    // Add decorative frame
    doc
      .rect(x - 5, y - 5, width + 10, height + 35)
      .fill(colors.light)
      .stroke(colors.primary)
      .lineWidth(2);

    // 🔧 FIXED: Better image adding with error handling
    try {
      doc.image(fullPath, x, y, {
        width: width,
        height: height,
        fit: [width, height],
        align: "center",
        valign: "center",
      });

      console.log(`✅ Photo ${photoNumber} added successfully`);
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

// 🔧 FIXED: Photos section with better error handling and debugging
const addPhotosSection = async (doc, person) => {
  try {
    console.log("\n📸 =================================");
    console.log("📸 Starting photos section processing...");
    console.log("📸 Person ID:", person._id);
    console.log("📸 Person name:", person.name);
    console.log("📸 Profile picture:", person.profilePicture);
    console.log("📸 Photos array:", person.photos);
    console.log("📸 =================================\n");

    // Collect all available photos
    const allPhotos = [];
    console.log("📸 Raw person.photos:", person.photos);
    console.log("📸 Raw person.profilePicture:", person.profilePicture);

    // Add profile picture if exists
    if (
      person.profilePicture &&
      typeof person.profilePicture === "string" &&
      person.profilePicture.trim()
    ) {
      allPhotos.push(person.profilePicture.trim());
      console.log("📸 Added profile picture to collection");
    }

    // Add photos array if exists
    if (person.photos && Array.isArray(person.photos)) {
      person.photos.forEach((photo, index) => {
        if (photo && typeof photo === "string" && photo.trim()) {
          allPhotos.push(photo.trim());
          console.log(`📸 Added photo ${index + 1} to collection`);
        } else {
          console.log(`⚠️ Skipped invalid photo ${index + 1}:`, photo);
        }
      });
    }

    // Remove duplicates and limit to 4
    const uniquePhotos = [...new Set(allPhotos)].slice(0, 4);
    console.log(`📸 Final photos to process: ${uniquePhotos.length}`);
    uniquePhotos.forEach((photo, index) => {
      console.log(`   ${index + 1}. ${photo}`);
    });

    // Add new page for photos
    doc.addPage();

    // Photos section header
    addStyledSectionHeader(doc, "📷 PHOTOGRAPHS");

    if (uniquePhotos.length === 0) {
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
        .text("Photos will be displayed here when uploaded", 50, doc.y + 20, {
          width: 500,
          align: "center",
        });

      console.log("📸 No photos available - added placeholder message");
      return true;
    }

    // Calculate layout dynamically
    const photosCount = uniquePhotos.length;
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

    for (let i = 0; i < uniquePhotos.length; i++) {
      const photoPath = uniquePhotos[i];

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

      // Try to add the photo
      const photoAdded = await addSinglePhoto(
        doc,
        photoPath,
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
          "Not Found"
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
      `\n✅ Photos section completed: ${successfulPhotos}/${photosCount} photos loaded successfully`
    );
    return true;
  } catch (error) {
    console.error("❌ Error in addPhotosSection:", error);

    try {
      doc
        .fontSize(12)
        .fillColor("#E74C3C")
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

// 🔧 MAIN FIXED PDF ROUTE
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

    const person = await Person.findById(id).lean().exec();

    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    console.log("✅ Person found:", person.name || "Unnamed");

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

    // Photos section with improved error handling
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
        )} | JODI NO 1 Matrimonial Services`,
        50,
        footerY,
        { align: "center" }
      );

    doc.end();
    console.log(
      "\n✅ PDF generated successfully with improved photo handling!"
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

// 🔧 FIXED: Test route with debug info
router.get("/test-pdf", (req, res) => {
  try {
    console.log("📄 Testing PDF generation...");
    console.log("📁 Current working directory:", process.cwd());
    console.log("📁 Routes directory:", __dirname);

    // Check if uploads directory exists
    const uploadsPath = path.join(process.cwd(), "uploads");
    const uploadsExists = fs.existsSync(uploadsPath);
    console.log("📂 Uploads directory exists:", uploadsExists, uploadsPath);

    if (uploadsExists) {
      try {
        const files = fs.readdirSync(uploadsPath);
        console.log("📂 Files in uploads:", files);
      } catch (e) {
        console.log("❌ Cannot read uploads directory:", e.message);
      }
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="test.pdf"');

    doc.pipe(res);

    doc
      .fontSize(20)
      .fillColor(colors.primary)
      .text("FIXED PDF Routes Test - Success! ✅", 100, 100);
    doc
      .fontSize(12)
      .fillColor(colors.text)
      .text("Photo issues have been resolved with better debugging.", 100, 140);
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`Uploads path: ${uploadsPath}`, 100, 170);
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`Uploads exists: ${uploadsExists}`, 100, 190);

    doc.end();
  } catch (error) {
    console.error("❌ Test PDF failed:", error);
    res.status(500).json({ error: error.message });
  }
});

console.log(
  "✅ FIXED PDF routes loaded with improved photo handling and debugging!"
);

module.exports = router;
