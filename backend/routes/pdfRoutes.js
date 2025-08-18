// routes/pdfRoutes.js - ENHANCED VERSION with Photos at End & Better Styling
const express = require("express");
const PDFDocument = require('pdfkit');
const Person = require("../models/personModel");
const path = require("path");
const fs = require("fs");

const router = express.Router();

console.log("📄 Loading ENHANCED PDFKit PDF routes with photos at end...");

// Color scheme for better styling
const colors = {
  primary: '#2C3E50',      // Dark blue-gray
  secondary: '#34495E',     // Lighter blue-gray
  accent: '#3498DB',        // Blue
  success: '#27AE60',       // Green
  warning: '#F39C12',       // Orange
  danger: '#E74C3C',        // Red
  light: '#ECF0F1',         // Light gray
  dark: '#2C3E50',          // Dark
  white: '#FFFFFF',
  text: '#2C3E50',
  label: '#5D6D7E',
  value: '#34495E'
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

// ✨ ENHANCED: Helper function to add styled field
const addStyledField = (doc, label, value, options = {}) => {
  const { fontSize = 11, indent = 0, labelColor = colors.label, valueColor = colors.value } = options;
  
  const x = 50 + indent;
  const labelWidth = 140;
  
  // Add label with styling
  doc.fontSize(fontSize + 1)
     .font('Helvetica-Bold')
     .fillColor(labelColor)
     .text(label + ':', x, doc.y, { width: labelWidth, continued: true });
  
  // Add value with styling
  doc.fontSize(fontSize)
     .font('Helvetica')
     .fillColor(valueColor)
     .text(' ' + (value || '—'), { width: 400 - labelWidth });
  
  doc.moveDown(0.4);
};

// ✨ ENHANCED: Beautiful section header with gradient-like effect
const addStyledSectionHeader = (doc, title) => {
  doc.moveDown(1);
  
  // Create main header rectangle with rounded corners effect
  const headerY = doc.y;
  
  // Background rectangle
  doc.rect(40, headerY, 520, 30)
     .fill(colors.primary);
  
  // Add subtle border effect
  doc.rect(40, headerY, 520, 2)
     .fill(colors.accent);
  
  // Add icon-like decoration
  doc.circle(55, headerY + 15, 8)
     .fill(colors.accent);
  
  // Add title text
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(colors.white)
     .text(title, 75, headerY + 8);
  
  // Reset and move down
  doc.fillColor(colors.text).moveDown(1.2);
};

// ✨ ENHANCED: Add all photos at the end with styling
const addPhotosSection = async (doc, person) => {
  try {
    // Collect all available photos
    const allPhotos = [];
    
    if (person.profilePicture) {
      allPhotos.push(person.profilePicture);
    }
    
    if (person.photos && Array.isArray(person.photos)) {
      allPhotos.push(...person.photos);
    }
    
    // Remove duplicates and limit to 3
    const uniquePhotos = [...new Set(allPhotos)].slice(0, 3);
    
    if (uniquePhotos.length === 0) {
      console.log("📸 No photos available for photos section");
      return;
    }
    
    console.log(`📸 Adding ${uniquePhotos.length} photos to end of PDF`);
    
    // Add new page for photos
    doc.addPage();
    
    // Photos section header
    addStyledSectionHeader(doc, '📸 PHOTOGRAPHS');
    
    // Calculate layout for photos
    const pageWidth = doc.page.width - 100; // 50 margin on each side
    const photoWidth = Math.min(150, (pageWidth - 40) / 3); // Max 150px or fit 3 in a row
    const photoHeight = photoWidth * 1.2; // Slightly taller than wide
    
    let currentX = 50;
    let currentY = doc.y + 20;
    let photosInCurrentRow = 0;
    
    for (let i = 0; i < uniquePhotos.length; i++) {
      const photoPath = uniquePhotos[i];
      
      // Check if we need a new row (max 2 photos per row for better visibility)
      if (photosInCurrentRow >= 2) {
        currentY += photoHeight + 60;
        currentX = 50;
        photosInCurrentRow = 0;
      }
      
      // Try to add the photo
      const photoAdded = await addSinglePhoto(doc, photoPath, currentX, currentY, photoWidth, photoHeight, i + 1);
      
      if (photoAdded) {
        currentX += photoWidth + 60; // Space between photos
        photosInCurrentRow++;
      } else {
        // Add placeholder if photo fails
        addPhotoPlaceholder(doc, currentX, currentY, photoWidth, photoHeight, i + 1);
        currentX += photoWidth + 60;
        photosInCurrentRow++;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Error in addPhotosSection:", error);
    return false;
  }
};

// ✨ Helper function to add single photo with styling
const addSinglePhoto = async (doc, photoPath, x, y, width, height, photoNumber) => {
  try {
    if (!photoPath) return false;
    
    console.log(`📸 Processing photo ${photoNumber}:`, photoPath);
    
    // Resolve photo path
    let fullPath = resolvePhotoPath(photoPath);
    
    if (!fullPath || !fs.existsSync(fullPath)) {
      console.log(`❌ Photo ${photoNumber} not found:`, fullPath);
      return false;
    }
    
    // Validate image
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(fullPath).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      console.log(`❌ Invalid image type for photo ${photoNumber}:`, ext);
      return false;
    }
    
    // Add decorative frame
    doc.rect(x - 5, y - 5, width + 10, height + 35)
       .fill(colors.light)
       .stroke(colors.primary);
    
    // Add photo
    doc.image(fullPath, x, y, { 
      width: width, 
      height: height,
      align: 'center'
    });
    
    // Add photo label
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(colors.primary)
       .text(`Photo ${photoNumber}`, x, y + height + 10, { width: width, align: 'center' });
    
    console.log(`✅ Photo ${photoNumber} added successfully`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error adding photo ${photoNumber}:`, error);
    return false;
  }
};

// ✨ Helper function to add photo placeholder
const addPhotoPlaceholder = (doc, x, y, width, height, photoNumber) => {
  // Add frame
  doc.rect(x - 5, y - 5, width + 10, height + 35)
     .fill('#F8F9FA')
     .stroke(colors.primary);
  
  // Add placeholder content
  doc.rect(x, y, width, height)
     .fill('#E9ECEF')
     .stroke('#DEE2E6');
  
  // Add icon/text
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#6C757D')
     .text('📷', x + width/2 - 10, y + height/2 - 20, { align: 'center' });
  
  doc.fontSize(9)
     .text('Photo Not Available', x, y + height/2, { width: width, align: 'center' });
  
  // Add label
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(colors.primary)
     .text(`Photo ${photoNumber}`, x, y + height + 10, { width: width, align: 'center' });
};

// ✨ Helper function to resolve photo path
const resolvePhotoPath = (photoPath) => {
  if (!photoPath) return null;
  
  const alternatives = [
    path.join(__dirname, '..', 'uploads', path.basename(photoPath)),
    path.join(__dirname, '..', photoPath.startsWith('/') ? photoPath.substring(1) : photoPath),
    path.join(process.cwd(), 'uploads', path.basename(photoPath)),
    path.join(__dirname, 'uploads', path.basename(photoPath))
  ];
  
  for (const altPath of alternatives) {
    if (fs.existsSync(altPath)) {
      return altPath;
    }
  }
  
  return null;
};

// ✨ ENHANCED: Add beautiful important note
const addEnhancedImportantNote = (doc) => {
  const noteText = "NOTE: The above particulars have been provided to the best of our knowledge, as per information provided by the concerned party. We (Jodi No1) shall not be responsible for misrepresentation of any or all of the information herein. Amount will not be refunded in any case. All clients have to pay full maturity amount on ROKA CEREMONY.";
  
  doc.moveDown(2);
  
  // Check if we need a new page
  if (doc.y > doc.page.height - 150) {
    doc.addPage();
  }
  
  // Create styled header
  doc.rect(40, doc.y, 520, 35)
     .fill(colors.warning);
  
  // Add warning icon and text
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(colors.white)
     .text('⚠️ IMPORTANT NOTICE', 55, doc.y - 25);
  
  doc.moveDown(0.8);
  
  // Create content box
  const noteHeight = 90;
  doc.rect(40, doc.y, 520, noteHeight)
     .fill('#FFF3CD')
     .stroke(colors.warning);
  
  // Add note content
  doc.fontSize(10)
     .fillColor('#856404')
     .font('Helvetica')
     .text(noteText, 55, doc.y - noteHeight + 15, {
       width: 490,
       align: 'justify',
       lineGap: 2
     });
};

// ✨ ENHANCED: Header with better styling
const addStyledHeader = (doc, person) => {
  // Company header background
  doc.rect(0, 0, doc.page.width, 80)
     .fill(colors.primary);
  
  // Company name
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor(colors.white)
     .text('JODI NO 1', 50, 25);
  
  // Contact info
  doc.fontSize(11)
     .font('Helvetica')
     .fillColor(colors.light)
     .text('📞 9871080409 | ✉️ jodino1@gmail.com', 50, 55)
     .text('📍 G-25, Vardhman Premium Mall, Opp.Kali Mata Mandir, Gurugram, Haryana', 50, 70);
  
  doc.moveDown(3);
  
  // Person name with styled background
  doc.rect(40, doc.y, 520, 40)
     .fill(colors.accent);
  
  doc.fontSize(22)
     .font('Helvetica-Bold')
     .fillColor(colors.white)
     .text(person.name || 'N/A', 50, doc.y - 28, { align: 'center' });
  
  doc.moveDown(2);
  doc.fillColor(colors.text);
};

// ✨ MAIN ENHANCED PDF ROUTE
router.get("/person/:id/pdf", async (req, res) => {
  let doc = null;
  
  try {
    const { id } = req.params;
    console.log(`📄 Starting ENHANCED PDF generation for person ${id}`);
    
    // Validate and find person
    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Invalid person ID format" });
    }
    
    const person = await Person.findById(id).lean().exec();
    
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }
    
    console.log("✅ Person found:", person.name || 'Unnamed');

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${(person.name || 'profile').replace(/[^a-zA-Z0-9]/g, '_')}_profile.pdf"`
    );

    // Create PDF with enhanced settings
    doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: false,
      info: {
        Title: `${person.name || 'Profile'} - JODI NO 1`,
        Author: 'JODI NO 1',
        Subject: 'Matrimonial Profile'
      }
    });

    doc.pipe(res);

    // Add styled header
    addStyledHeader(doc, person);

    // Personal Details Section
    addStyledSectionHeader(doc, '👤 PERSONAL DETAILS');
    addStyledField(doc, 'Full Name', person.name);
    addStyledField(doc, 'Gender', person.gender);
    addStyledField(doc, 'Marital Status', person.maritalStatus);
    addStyledField(doc, 'Date of Birth', formatDate(person.dob));
    addStyledField(doc, 'Birth Place & Time', person.birthPlaceTime);
    addStyledField(doc, 'Native Place', person.nativePlace);
    addStyledField(doc, 'Gotra', person.gotra);
    addStyledField(doc, 'Religion', person.religion);
    addStyledField(doc, 'Height', person.height);
    addStyledField(doc, 'Complexion', person.complexion);

    // Lifestyle Section
    addStyledSectionHeader(doc, '🏃 LIFESTYLE & HABITS');
    addStyledField(doc, 'Eating Habits', person.eatingHabits);
    addStyledField(doc, 'Drinking Habits', person.drinkingHabits);
    addStyledField(doc, 'Smoking Habits', person.smokingHabits);
    addStyledField(doc, 'Any Disability', person.disability);
    addStyledField(doc, 'NRI Status', person.nri ? 'Yes' : 'No');
    addStyledField(doc, 'Vehicle Owned', person.vehicle);
    addStyledField(doc, 'Horoscope Available', person.horoscope);

    // Family Details Section
    addStyledSectionHeader(doc, '👨‍👩‍👧‍👦 FAMILY DETAILS');
    addStyledField(doc, 'Father\'s Name', person.fatherName);
    addStyledField(doc, 'Father\'s Occupation', person.fatherOccupation);
    addStyledField(doc, 'Father\'s Office Details', person.fatherOffice);
    addStyledField(doc, 'Mother\'s Name', person.motherName);
    addStyledField(doc, 'Mother\'s Occupation', person.motherOccupation);
    addStyledField(doc, 'Residence Type', person.residence);
    addStyledField(doc, 'Other Properties', person.otherProperty);

    // Education Section
    addStyledSectionHeader(doc, '🎓 EDUCATIONAL QUALIFICATIONS');
    addStyledField(doc, 'Highest Qualification', person.higherQualification);
    addStyledField(doc, 'Graduation Details', person.graduation);
    addStyledField(doc, 'School Education', person.schooling);

    // Professional Section
    addStyledSectionHeader(doc, '💼 PROFESSION & INCOME');
    addStyledField(doc, 'Current Occupation', person.occupation);
    addStyledField(doc, 'Personal Income', person.personalIncome);
    addStyledField(doc, 'Family Income', person.familyIncome);

    // Contact Information Section
    addStyledSectionHeader(doc, '📞 CONTACT INFORMATION');
    addStyledField(doc, 'Phone Number', person.phoneNumber);
    addStyledField(doc, 'Email Address', person.email);
    addStyledField(doc, 'Current Address', person.currentAddress);

    // Siblings Section
    if (person.siblings && person.siblings.length > 0) {
      addStyledSectionHeader(doc, '👫 SIBLINGS INFORMATION');
      
      person.siblings.forEach((sibling, index) => {
        doc.fontSize(13)
           .font('Helvetica-Bold')
           .fillColor(colors.accent)
           .text(`Sibling ${index + 1}:`, 50);
        doc.moveDown(0.3);
        
        addStyledField(doc, '  Name', sibling.name, { indent: 20, labelColor: colors.secondary });
        addStyledField(doc, '  Relationship', sibling.relationship, { indent: 20, labelColor: colors.secondary });
        addStyledField(doc, '  Age', sibling.age, { indent: 20, labelColor: colors.secondary });
        addStyledField(doc, '  Marital Status', sibling.maritalStatus, { indent: 20, labelColor: colors.secondary });
        addStyledField(doc, '  Occupation', sibling.occupation, { indent: 20, labelColor: colors.secondary });
        
        doc.moveDown(0.5);
      });
    }

    // Add photos section at the end
    await addPhotosSection(doc, person);

    // Add important notice
    addEnhancedImportantNote(doc);

    // Footer
    doc.fontSize(10)
       .fillColor('#7F8C8D')
       .text(`Generated on: ${new Date().toLocaleDateString('en-IN')} | JODI NO 1 Matrimonial Services`, 
             50, doc.page.height - 50, { align: 'center' });

    doc.end();
    console.log("✅ Enhanced PDF generated successfully with photos at end");

  } catch (error) {
    console.error("❌ Enhanced PDF generation error:", error);
    
    if (doc && !doc.ended) {
      try { doc.end(); } catch (e) {}
    }
    
    if (!res.headersSent) {
      res.status(500).json({
        message: "Enhanced PDF generation failed",
        error: error.message
      });
    }
  }
});

// Keep existing routes (test, debug, etc.)
router.get("/test-pdf", (req, res) => {
  try {
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="test.pdf"');
    
    doc.pipe(res);
    
    doc.fontSize(20).fillColor(colors.primary).text('Enhanced PDFKit Test - Success!', 100, 100);
    doc.fontSize(12).fillColor(colors.text).text('Enhanced styling is working correctly.', 100, 140);
    
    doc.end();
    
  } catch (error) {
    console.error("❌ Test PDF failed:", error);
    res.status(500).json({ error: error.message });
  }
});

console.log("✅ Enhanced PDFKit routes loaded with photos at end and beautiful styling");

module.exports = router;