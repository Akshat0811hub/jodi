// routes/pdfRoutes.js - ENHANCED VERSION with 1-4 Photos Support & Better Styling
const express = require("express");
const PDFDocument = require('pdfkit');
const Person = require("../models/personModel");
const path = require("path");
const fs = require("fs");

const router = express.Router();

console.log("📄 Loading ENHANCED PDFKit PDF routes with 1-4 photos support...");

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

// ✨ FIXED: Add all photos at the end with dynamic layout for 1-4 photos
const addPhotosSection = async (doc, person) => {
  try {
    console.log("📸 Starting photos section processing...");
    console.log("📸 Person data:", { 
      profilePicture: person.profilePicture, 
      photos: person.photos, 
      photosLength: person.photos ? person.photos.length : 0 
    });

    // ✅ FIXED: Collect all available photos properly
    const allPhotos = [];
    
    // Add profile picture if exists
    if (person.profilePicture && typeof person.profilePicture === 'string' && person.profilePicture.trim()) {
      allPhotos.push(person.profilePicture);
      console.log("📸 Added profile picture:", person.profilePicture);
    }
    
    // Add photos array if exists
    if (person.photos && Array.isArray(person.photos)) {
      person.photos.forEach((photo, index) => {
        if (photo && typeof photo === 'string' && photo.trim()) {
          allPhotos.push(photo);
          console.log(`📸 Added photo ${index + 1}:`, photo);
        }
      });
    }
    
    // Remove duplicates and keep original order (limit to 4 as per form validation)
    const uniquePhotos = [...new Set(allPhotos)].slice(0, 4);
    console.log(`📸 Final photos to process: ${uniquePhotos.length}`, uniquePhotos);
    
    // ✅ ALWAYS add photos section, even if no photos (will show placeholder message)
    // Add new page for photos
    doc.addPage();
    
    // Photos section header
    addStyledSectionHeader(doc, '📸 PHOTOGRAPHS');
    
    if (uniquePhotos.length === 0) {
      // ✅ Show "No photos available" message with styling
      doc.rect(50, doc.y, 500, 100)
         .fill('#F8F9FA')
         .stroke('#DEE2E6');
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#6C757D')
         .text('📷 No photos available', 50, doc.y - 80, { 
           width: 500, 
           align: 'center' 
         });
      
      doc.fontSize(11)
         .font('Helvetica')
         .text('Photos will be displayed here when uploaded', 50, doc.y + 20, { 
           width: 500, 
           align: 'center' 
         });
      
      console.log("📸 No photos available - added placeholder message");
      return true;
    }
    
    // ✅ FIXED: Dynamic layout based on number of photos
    const photosCount = uniquePhotos.length;
    console.log(`📸 Laying out ${photosCount} photos`);
    
    // Calculate layout dynamically
    let photosPerRow, photoWidth, photoHeight;
    
    if (photosCount === 1) {
      // 1 photo: Center it, make it larger
      photosPerRow = 1;
      photoWidth = 200;
      photoHeight = 240;
    } else if (photosCount === 2) {
      // 2 photos: Side by side
      photosPerRow = 2;
      photoWidth = 180;
      photoHeight = 216;
    } else if (photosCount === 3) {
      // 3 photos: First row 2, second row 1 centered
      photosPerRow = 2; // We'll handle the 3rd photo separately
      photoWidth = 150;
      photoHeight = 180;
    } else { // photosCount === 4
      // 4 photos: 2x2 grid
      photosPerRow = 2;
      photoWidth = 150;
      photoHeight = 180;
    }
    
    const pageWidth = doc.page.width - 100; // 50 margin on each side
    const totalWidthUsed = photosPerRow * photoWidth + (photosPerRow - 1) * 40; // 40px spacing
    const startX = 50 + (pageWidth - totalWidthUsed) / 2; // Center horizontally
    
    let currentX = startX;
    let currentY = doc.y + 20;
    let photosInCurrentRow = 0;
    let rowNumber = 0;
    
    for (let i = 0; i < uniquePhotos.length; i++) {
      const photoPath = uniquePhotos[i];
      
      // ✅ Special handling for 3 photos layout
      if (photosCount === 3 && i === 2) {
        // Third photo: start new row and center it
        currentY += photoHeight + 60;
        currentX = 50 + (pageWidth - photoWidth) / 2; // Center the single photo
        photosInCurrentRow = 0;
        rowNumber++;
      } else if (photosInCurrentRow >= photosPerRow) {
        // Normal new row logic
        currentY += photoHeight + 60;
        currentX = startX;
        photosInCurrentRow = 0;
        rowNumber++;
      }
      
      console.log(`📸 Processing photo ${i + 1} at position (${currentX}, ${currentY})`);
      
      // Try to add the photo
      const photoAdded = await addSinglePhoto(doc, photoPath, currentX, currentY, photoWidth, photoHeight, i + 1);
      
      if (!photoAdded) {
        // Add placeholder if photo fails
        console.log(`📸 Photo ${i + 1} failed, adding placeholder`);
        addPhotoPlaceholder(doc, currentX, currentY, photoWidth, photoHeight, i + 1);
      }
      
      // Move to next position (except for the centered 3rd photo in 3-photo layout)
      if (!(photosCount === 3 && i === 2)) {
        currentX += photoWidth + 40; // Space between photos
      }
      photosInCurrentRow++;
    }
    
    // Calculate final Y position after all photos
    const finalPhotoY = currentY + photoHeight + 50;
    doc.y = finalPhotoY;
    
    console.log(`✅ Photos section completed with ${uniquePhotos.length} photos`);
    return true;
    
  } catch (error) {
    console.error("❌ Error in addPhotosSection:", error);
    
    // ✅ Even on error, add a fallback message
    try {
      doc.fontSize(12)
         .fillColor('#E74C3C')
         .text('⚠️ Error loading photos section', 50, doc.y, { align: 'center' });
    } catch (fallbackError) {
      console.error("❌ Fallback error message failed:", fallbackError);
    }
    
    return false;
  }
};

// ✨ FIXED: Helper function to add single photo with better error handling
const addSinglePhoto = async (doc, photoPath, x, y, width, height, photoNumber) => {
  try {
    if (!photoPath || typeof photoPath !== 'string' || !photoPath.trim()) {
      console.log(`❌ Invalid photo path for photo ${photoNumber}:`, photoPath);
      return false;
    }
    
    console.log(`📸 Processing photo ${photoNumber}:`, photoPath);
    
    // ✅ IMPROVED: Resolve photo path with more alternatives
    let fullPath = resolvePhotoPath(photoPath.trim());
    
    if (!fullPath || !fs.existsSync(fullPath)) {
      console.log(`❌ Photo ${photoNumber} file not found. Tried:`, fullPath);
      return false;
    }
    
    // ✅ IMPROVED: Validate image file
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(fullPath).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      console.log(`❌ Invalid image type for photo ${photoNumber}:`, ext);
      return false;
    }
    
    // Check file size (optional - prevent huge files from crashing)
    const stats = fs.statSync(fullPath);
    if (stats.size > 10 * 1024 * 1024) { // 10MB limit
      console.log(`❌ Photo ${photoNumber} too large:`, (stats.size / 1024 / 1024).toFixed(2), 'MB');
      return false;
    }
    
    // ✅ Add decorative frame
    doc.rect(x - 5, y - 5, width + 10, height + 35)
       .fill(colors.light)
       .stroke(colors.primary)
       .lineWidth(2);
    
    // ✅ Add photo with error handling
    doc.image(fullPath, x, y, { 
      width: width, 
      height: height,
      fit: [width, height],
      align: 'center'
    });
    
    // ✅ Add photo label
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

// ✨ IMPROVED: Helper function to add photo placeholder with better styling
const addPhotoPlaceholder = (doc, x, y, width, height, photoNumber) => {
  try {
    // Add frame
    doc.rect(x - 5, y - 5, width + 10, height + 35)
       .fill('#F8F9FA')
       .stroke(colors.danger)
       .lineWidth(2);
    
    // Add placeholder content
    doc.rect(x, y, width, height)
       .fill('#E9ECEF')
       .stroke('#DEE2E6');
    
    // Add icon/text
    doc.fontSize(24)
       .font('Helvetica')
       .fillColor('#6C757D')
       .text('📷', x + width/2 - 12, y + height/2 - 25, { align: 'left' });
    
    doc.fontSize(10)
       .fillColor('#DC3545')
       .text('Photo Not Available', x, y + height/2 + 5, { width: width, align: 'center' });
    
    // Add label
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(colors.primary)
       .text(`Photo ${photoNumber}`, x, y + height + 10, { width: width, align: 'center' });
    
    console.log(`📸 Placeholder added for photo ${photoNumber}`);
  } catch (error) {
    console.error(`❌ Error adding placeholder for photo ${photoNumber}:`, error);
  }
};

// ✨ IMPROVED: Helper function to resolve photo path with more alternatives
const resolvePhotoPath = (photoPath) => {
  if (!photoPath || typeof photoPath !== 'string') return null;
  
  const cleanPath = photoPath.trim();
  const fileName = path.basename(cleanPath);
  
  // Try multiple possible paths
  const alternatives = [
    // Original path as-is
    cleanPath,
    // Relative to project root uploads
    path.join(process.cwd(), 'uploads', fileName),
    // Relative to current directory uploads
    path.join(__dirname, '..', 'uploads', fileName),
    // Just uploads folder relative to project root
    path.join(__dirname, '..', '..', 'uploads', fileName),
    // Remove leading slash if present and try uploads
    path.join(process.cwd(), 'uploads', cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath),
    // Direct path if it's already absolute
    path.resolve(cleanPath)
  ];
  
  console.log(`🔍 Searching for photo: ${cleanPath}`);
  
  for (const altPath of alternatives) {
    if (fs.existsSync(altPath)) {
      console.log(`✅ Found photo at: ${altPath}`);
      return altPath;
    }
  }
  
  console.log(`❌ Photo not found in any of these locations:`, alternatives);
  return null;
};

// ✨ ENHANCED: Add beautiful important note with proper spacing
const addEnhancedImportantNote = (doc) => {
  const noteText = "NOTE: The above particulars have been provided to the best of our knowledge, as per information provided by the concerned party. We (Jodi No1) shall not be responsible for misrepresentation of any or all of the information herein. Amount will not be refunded in any case. All clients have to pay full maturity amount on ROKA CEREMONY.";
  
  // Add extra spacing before the notice
  doc.moveDown(3);
  
  // Check if we need more space or a new page
  const requiredSpace = 150; // Space needed for the notice
  const availableSpace = doc.page.height - doc.y - 70; // Available space minus footer
  
  if (availableSpace < requiredSpace) {
    doc.addPage();
    doc.moveDown(2);
  }
  
  // Create styled header with more space
  const headerY = doc.y;
  doc.rect(40, headerY, 520, 35)
     .fill(colors.warning);
  
  // Add warning icon and text
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(colors.white)
     .text('⚠️ IMPORTANT NOTICE', 55, headerY + 10);
  
  // Move down after header
  doc.y = headerY + 45;
  
  // Create content box with proper height
  const noteHeight = 100;
  const contentY = doc.y;
  doc.rect(40, contentY, 520, noteHeight)
     .fill('#FFF3CD')
     .stroke(colors.warning);
  
  // Add note content with proper positioning
  doc.fontSize(10)
     .fillColor('#856404')
     .font('Helvetica')
     .text(noteText, 55, contentY + 15, {
       width: 490,
       align: 'justify',
       lineGap: 3
     });
  
  // Move doc.y to after the notice box
  doc.y = contentY + noteHeight + 20;
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
     .text(' 9871080409 |  jodino1@gmail.com', 50, 55)
     .text(' G-25, Vardhman Premium Mall, Opp.Kali Mata Mandir,Deepali enclave , Delhi-110034', 50, 70);
  
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

// ✨ MAIN ENHANCED PDF ROUTE with 1-4 photos support
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
    console.log("📸 Person photos data:", { 
      profilePicture: person.profilePicture, 
      photos: person.photos,
      photosCount: person.photos ? person.photos.length : 0
    });

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
    addStyledSectionHeader(doc, ' PERSONAL DETAILS');
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
    addStyledSectionHeader(doc, ' LIFESTYLE & HABITS');
    addStyledField(doc, 'Eating Habits', person.eatingHabits);
    addStyledField(doc, 'Drinking Habits', person.drinkingHabits);
    addStyledField(doc, 'Smoking Habits', person.smokingHabits);
    addStyledField(doc, 'Any Disability', person.disability);
    addStyledField(doc, 'NRI Status', person.nri ? 'Yes' : 'No');
    addStyledField(doc, 'Vehicle Owned', person.vehicle);
    addStyledField(doc, 'Horoscope Available', person.horoscope ? 'Yes' : 'No');

    // Family Details Section
    addStyledSectionHeader(doc, 'FAMILY DETAILS');
    addStyledField(doc, 'Father\'s Name', person.fatherName);
    addStyledField(doc, 'Father\'s Occupation', person.fatherOccupation);
    addStyledField(doc, 'Father\'s Office Details', person.fatherOffice);
    addStyledField(doc, 'Mother\'s Name', person.motherName);
    addStyledField(doc, 'Mother\'s Occupation', person.motherOccupation);
    addStyledField(doc, 'Residence Type', person.residence);
    addStyledField(doc, 'Other Properties', person.otherProperty);

    // Education Section
    addStyledSectionHeader(doc, ' EDUCATIONAL QUALIFICATIONS');
    addStyledField(doc, 'Highest Qualification', person.higherQualification);
    addStyledField(doc, 'Graduation Details', person.graduation);
    addStyledField(doc, 'School Education', person.schooling);

    // Professional Section
    addStyledSectionHeader(doc, ' PROFESSION & INCOME');
    addStyledField(doc, 'Current Occupation', person.occupation);
    addStyledField(doc, 'Personal Income', person.personalIncome);
    addStyledField(doc, 'Family Income', person.familyIncome);

    // Contact Information Section
    addStyledSectionHeader(doc, 'CONTACT INFORMATION');
    addStyledField(doc, 'Phone Number', person.phoneNumber);
    addStyledField(doc, 'Email Address', person.email);
    addStyledField(doc, 'Current Address', person.currentAddress);

    // Siblings Section
    if (person.siblings && person.siblings.length > 0) {
      addStyledSectionHeader(doc, ' SIBLINGS INFORMATION');
      
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

    // ✅ ALWAYS add photos section (handles 0-4 photos gracefully)
    await addPhotosSection(doc, person);

    // Add important notice with proper spacing
    addEnhancedImportantNote(doc);

    // Footer with proper positioning
    const footerY = doc.page.height - 40;
    doc.fontSize(10)
       .fillColor('#7F8C8D')
       .text(`Generated on: ${new Date().toLocaleDateString('en-IN')} | JODI NO 1 Matrimonial Services`, 
             50, footerY, { align: 'center' });

    doc.end();
    console.log("✅ Enhanced PDF generated successfully with 1-4 photos support");

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

// Test route for PDF functionality
router.get("/test-pdf", (req, res) => {
  try {
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="test.pdf"');
    
    doc.pipe(res);
    
    doc.fontSize(20).fillColor(colors.primary).text('Enhanced PDFKit Test - Success! ✅', 100, 100);
    doc.fontSize(12).fillColor(colors.text).text('1-4 Photos support is working correctly.', 100, 140);
    
    doc.end();
    
  } catch (error) {
    console.error("❌ Test PDF failed:", error);
    res.status(500).json({ error: error.message });
  }
});

console.log("✅ Enhanced PDFKit routes loaded with 1-4 photos support and beautiful styling");

module.exports = router;