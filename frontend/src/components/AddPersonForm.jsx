// routes/pdfRoutes.js - FIXED VERSION with Working Images
const express = require("express");
const PDFDocument = require('pdfkit');
const Person = require("../models/personModel");
const path = require("path");
const fs = require("fs");

const router = express.Router();

console.log("📄 Loading FIXED PDFKit PDF routes...");

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

// ✅ Helper function to add field to PDF with proper spacing
const addField = (doc, label, value, options = {}) => {
  const { fontSize = 11, indent = 0, bold = false } = options;
  
  doc.fontSize(fontSize);
  
  if (bold) {
    doc.font('Helvetica-Bold');
  } else {
    doc.font('Helvetica');
  }
  
  const x = 50 + indent;
  const labelWidth = 120;
  
  // Add label
  doc.text(label + ':', x, doc.y, { width: labelWidth, continued: true });
  
  // Add value
  doc.font('Helvetica').text(' ' + (value || '—'), { width: 400 - labelWidth });
  doc.moveDown(0.3);
};

// 🔧 FIXED: Helper function to add profile photo with correct path handling
const addProfilePhoto = async (doc, photoPath) => {
  try {
    if (!photoPath) {
      console.log("📸 No photo path provided");
      return false;
    }
    
    console.log("📸 Original photo path:", photoPath);
    
    // 🔧 FIX 1: Handle different path formats
    let fullPath;
    
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      // Handle URL paths (if you're storing URLs)
      console.log("📸 Photo is a URL, cannot display in PDF");
      return false;
    } else if (photoPath.startsWith('/uploads/')) {
      // Handle absolute path from root
      fullPath = path.join(__dirname, '..', photoPath.substring(1));
    } else if (photoPath.startsWith('uploads/')) {
      // Handle relative path without leading slash
      fullPath = path.join(__dirname, '..', photoPath);
    } else if (photoPath.includes('uploads')) {
      // Handle any path containing uploads
      const uploadsIndex = photoPath.indexOf('uploads');
      const relativePath = photoPath.substring(uploadsIndex);
      fullPath = path.join(__dirname, '..', relativePath);
    } else {
      // Assume it's in uploads directory
      fullPath = path.join(__dirname, '..', 'uploads', photoPath);
    }
    
    console.log("📸 Resolved full path:", fullPath);
    
    // 🔧 FIX 2: Check if file exists and is accessible
    if (!fs.existsSync(fullPath)) {
      console.log("❌ Photo file not found at:", fullPath);
      
      // 🔧 FIX 3: Try alternative paths
      const alternatives = [
        path.join(__dirname, '..', 'uploads', path.basename(photoPath)),
        path.join(__dirname, 'uploads', path.basename(photoPath)),
        path.join(process.cwd(), 'uploads', path.basename(photoPath)),
        path.join(process.cwd(), photoPath)
      ];
      
      for (const altPath of alternatives) {
        console.log("🔍 Trying alternative path:", altPath);
        if (fs.existsSync(altPath)) {
          fullPath = altPath;
          console.log("✅ Found image at alternative path:", fullPath);
          break;
        }
      }
      
      if (!fs.existsSync(fullPath)) {
        console.log("❌ Image not found in any location");
        return false;
      }
    }
    
    // 🔧 FIX 4: Check file size and type
    const stats = fs.statSync(fullPath);
    console.log("📊 File stats:", {
      size: `${(stats.size / 1024).toFixed(2)}KB`,
      isFile: stats.isFile()
    });
    
    if (!stats.isFile()) {
      console.log("❌ Path is not a file");
      return false;
    }
    
    // 🔧 FIX 5: Validate image file type
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(fullPath).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      console.log("❌ Invalid image file type:", ext);
      return false;
    }
    
    // 🔧 FIX 6: Add image with error handling
    try {
      doc.image(fullPath, 400, 100, { 
        width: 120, 
        height: 140,
        align: 'center'
      });
      console.log("✅ Photo added successfully from:", fullPath);
      return true;
    } catch (imageError) {
      console.error("❌ Error adding image to PDF:", imageError.message);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Error in addProfilePhoto:", error.message);
    console.error("❌ Stack trace:", error.stack);
    return false;
  }
};

// 🔧 NEW: Helper function to get best available photo
const getBestPhoto = (person) => {
  // Priority order: profilePicture -> first photo in photos array
  if (person.profilePicture) {
    console.log("📸 Using profilePicture:", person.profilePicture);
    return person.profilePicture;
  }
  
  if (person.photos && Array.isArray(person.photos) && person.photos.length > 0) {
    console.log("📸 Using first photo from photos array:", person.photos[0]);
    return person.photos[0];
  }
  
  console.log("📸 No photos available for person");
  return null;
};

// ✅ Helper function to add section header with maroon background
const addSectionHeader = (doc, title) => {
  doc.moveDown(0.5);
  
  // Create maroon background rectangle
  doc.rect(50, doc.y, 500, 25)
     .fill('#8B1538'); // Maroon color matching your screenshot
  
  // Add white text on maroon background
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('white')
     .text(title, 60, doc.y - 20);
  
  // Reset color and move down
  doc.fillColor('#000000').moveDown(0.8);
};

// ✅ Helper function to add the important note with matching style
const addImportantNote = (doc) => {
  const noteText = "NOTE: The above particulars have been provided to the best of our knowledge, as per information provided by the concerned party. We (Jodi No1) shall not be responsible for misrepresentation of any or all of the information herein. Amount will not be refunded in any case. All clients have to pay full maturity amount on ROKA CEREMONY.";
  
  // Add some space before the note
  doc.moveDown(2);
  
  // Check if we need a new page for the note
  if (doc.y > doc.page.height - 150) {
    doc.addPage();
  }
  
  // Create maroon header for the note
  doc.rect(50, doc.y, 500, 25)
     .fill('#8B1538'); // Same maroon color as other headers
  
  // Add "IMPORTANT NOTE" header text in white
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('white')
     .text('IMPORTANT NOTE', 60, doc.y - 18);
  
  // Move down and create light gray background for note content
  doc.moveDown(0.5);
  const noteHeight = 80; // Adjust based on text length
  
  doc.rect(50, doc.y, 500, noteHeight)
     .fill('#F8F8F8') // Light gray background
     .stroke('#8B1538'); // Maroon border
  
  // Add the note text in black
  doc.fontSize(9)
     .fillColor('black')
     .font('Helvetica')
     .text(noteText, 60, doc.y - noteHeight + 10, {
       width: 480,
       align: 'justify',
       lineGap: 1
     });
};

// 🔧 ENHANCED: Debug route to check photo paths
router.get("/debug/person/:id/photos", async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findById(id);
    
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    const photoInfo = {
      personName: person.name,
      profilePicture: person.profilePicture,
      photos: person.photos,
      uploadsDir: path.join(__dirname, '..', 'uploads'),
      checkedPaths: []
    };

    // Check all possible photo paths
    const allPhotos = [person.profilePicture, ...(person.photos || [])].filter(Boolean);
    
    for (const photoPath of allPhotos) {
      const alternatives = [
        path.join(__dirname, '..', 'uploads', path.basename(photoPath)),
        path.join(__dirname, '..', photoPath.startsWith('/') ? photoPath.substring(1) : photoPath),
        path.join(process.cwd(), 'uploads', path.basename(photoPath))
      ];
      
      for (const altPath of alternatives) {
        const exists = fs.existsSync(altPath);
        photoInfo.checkedPaths.push({
          original: photoPath,
          checked: altPath,
          exists: exists,
          isFile: exists ? fs.statSync(altPath).isFile() : false
        });
      }
    }

    res.json(photoInfo);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔧 FIXED VERSION: Simple test endpoint that won't crash
router.get("/test-pdf", (req, res) => {
  try {
    console.log("🧪 Starting PDFKit test...");
    
    // Create a minimal PDF document
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      autoFirstPage: true,
      bufferPages: false // Prevent memory issues
    });
    
    // Set headers before piping
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="test.pdf"');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Pipe to response
    doc.pipe(res);
    
    // Add minimal content
    doc.fontSize(20).text('PDFKit Test - Success!', 100, 100);
    doc.fontSize(12).text('If you can see this PDF, PDFKit is working correctly.', 100, 140);
    doc.text('This means your PDF generation should work.', 100, 160);
    doc.text(`Generated at: ${new Date().toISOString()}`, 100, 180);
    
    // End document immediately
    doc.end();
    
    console.log("✅ PDFKit test completed successfully");
    
  } catch (error) {
    console.error("❌ PDFKit test failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: "PDFKit test failed", 
        error: error.message,
        stack: error.stack 
      });
    }
  }
});

// 🔧 MAIN FIX: Person PDF route with improved image handling
router.get("/person/:id/pdf", async (req, res) => {
  let doc = null;
  
  try {
    const { id } = req.params;
    console.log(`📄 Starting PDF generation for person ${id}`);
    
    // Step 1: Validate ID format
    if (!id || id.length !== 24) {
      console.log("❌ Invalid ID format:", id);
      return res.status(400).json({ message: "Invalid person ID format" });
    }
    
    // Step 2: Find the person with timeout
    console.log("🔍 Searching for person in database...");
    const person = await Person.findById(id).lean().exec();
    
    if (!person) {
      console.log("❌ Person not found in database:", id);
      return res.status(404).json({ message: "Person not found" });
    }
    
    console.log("✅ Person found:", person.name || 'Unnamed');
    console.log("📸 Person photo data:", {
      profilePicture: person.profilePicture,
      photos: person.photos,
      photosLength: person.photos ? person.photos.length : 0
    });

    // Step 3: Set response headers BEFORE creating PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${(person.name || 'profile').replace(/[^a-zA-Z0-9]/g, '_')}_profile.pdf"`
    );
    res.setHeader('Cache-Control', 'no-cache');

    // Step 4: Create PDF document with memory optimization
    doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      autoFirstPage: true,
      bufferPages: false, // Critical: Don't buffer pages in memory
      info: {
        Title: `${person.name || 'Profile'} - JODI NO 1`,
        Author: 'JODI NO 1',
        Subject: 'Matrimonial Profile'
      }
    });

    // Step 5: Pipe to response immediately
    doc.pipe(res);

    // Step 6: Add content efficiently
    // Header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#8B0000')
       .text('JODI NO 1', 50, 50, { align: 'center' });

    doc.fontSize(12)
       .fillColor('#000000')
       .font('Helvetica')
       .text(' 9871080409 | jodino1@gmail.com', { align: 'left' })
       .text(' Gurugram, Haryana, India', { align: 'left' })
       .text(' G-25, Vardhman Premium Mall, Opp.Kali Mata Mandir', { align: 'left' });

    doc.moveDown(1);

    // Person name
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#8B0000')
       .text(person.name || 'N/A', { align: 'center' });

    doc.moveDown(1.5);

    // 🔧 FIXED: Add profile photo with better path resolution
    const bestPhoto = getBestPhoto(person);
    if (bestPhoto) {
      console.log("📸 Attempting to add photo:", bestPhoto);
      const photoAdded = await addProfilePhoto(doc, bestPhoto);
      if (photoAdded) {
        doc.moveDown(1);
      } else {
        console.log("⚠️ Could not add photo, continuing without it");
        // Add placeholder text where photo would be
        doc.fontSize(10)
           .fillColor('#666666')
           .text('[Photo not available]', 400, 100, { width: 120, align: 'center' });
        doc.fillColor('#000000');
      }
    } else {
      console.log("📸 No photos available for this person");
    }

    // Personal details (REMOVED phone number from display but kept in data)
    addSectionHeader(doc, 'PERSONAL DETAILS');
    addField(doc, 'Name', person.name);
    addField(doc, 'Gender', person.gender);
    addField(doc, 'Marital Status', person.maritalStatus);
    addField(doc, 'Date of Birth', formatDate(person.dob));
    addField(doc, 'Birth Place & Time', person.birthPlaceTime);
    addField(doc, 'Native Place', person.nativePlace);
    addField(doc, 'Gotra', person.gotra);
    addField(doc, 'Religion', person.religion);
    addField(doc, 'Height', person.height);
    addField(doc, 'Complexion', person.complexion);

    // Lifestyle section
    addSectionHeader(doc, 'LIFESTYLE');
    addField(doc, 'Eating Habits', person.eatingHabits);
    addField(doc, 'Drinking Habits', person.drinkingHabits);
    addField(doc, 'Smoking Habits', person.smokingHabits);
    addField(doc, 'Disability', person.disability);
    addField(doc, 'NRI Status', person.nri ? 'Yes' : 'No');
    addField(doc, 'Vehicle', person.vehicle);
    addField(doc, 'Horoscope', person.horoscope);

    // Family details
    addSectionHeader(doc, 'FAMILY DETAILS');
    addField(doc, 'Father', person.fatherName);
    addField(doc, 'Father Occupation Detail', person.fatherOccupation);
    addField(doc, 'Father Office Detail', person.fatherOffice);
    addField(doc, 'Mother', person.motherName);
    addField(doc, 'Mother Occupation', person.motherOccupation);
    addField(doc, 'Residence', person.residence);
    addField(doc, 'Other Property', person.otherProperty);

    // Education section
    addSectionHeader(doc, 'EDUCATION');
    addField(doc, 'Higher Qualification', person.higherQualification);
    addField(doc, 'Graduation', person.graduation);
    addField(doc, 'Schooling', person.schooling);

    // Professional details
    addSectionHeader(doc, 'PROFESSION & INCOME');
    addField(doc, 'Occupation', person.occupation);
    addField(doc, 'Personal Income', person.personalIncome);
    addField(doc, 'Family Income', person.familyIncome);

    // 👫 SIBLINGS SECTION
    if (person.siblings && person.siblings.length > 0) {
      addSectionHeader(doc, 'SIBLINGS & FAMILY DETAILS');
      
      person.siblings.forEach((sibling, index) => {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text(`Sibling ${index + 1}:`, 50);
        doc.moveDown(0.3);
        
        addField(doc, '  Name', sibling.name, { indent: 20 });
        addField(doc, '  Relationship', sibling.relationship, { indent: 20 });
        addField(doc, '  Age', sibling.age, { indent: 20 });
        addField(doc, '  Marital Status', sibling.maritalStatus, { indent: 20 });
        addField(doc, '  Occupation', sibling.occupation, { indent: 20 });
        
        doc.moveDown(0.5);
      });
    }

    // ✅ ADD IMPORTANT NOTE
    addImportantNote(doc);

    // Footer
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Generated on: ${new Date().toLocaleDateString('en-IN')} | JODI NO 1`, 
             50, doc.page.height - 70, { align: 'center' });

    // End document
    doc.end();
    
    console.log("✅ PDF generated and streamed successfully");

  } catch (error) {
    console.error("❌ PDF generation error:", error);
    console.error("❌ Error stack:", error.stack);
    
    // Clean up document if it exists
    if (doc && !doc.ended) {
      try {
        doc.end();
      } catch (e) {
        console.error("❌ Error ending document:", e.message);
      }
    }
    
    if (!res.headersSent) {
      res.status(500).json({
        message: "PDF generation failed",
        error: error.message,
        details: {
          type: error.name,
          personId: req.params.id
        }
      });
    }
  }
});

// 🔧 FIXED: Bulk PDF with memory optimization and note
router.post("/bulk", async (req, res) => {
  let doc = null;
  
  try {
    const { personIds } = req.body;
    
    if (!personIds || !Array.isArray(personIds) || personIds.length === 0) {
      return res.status(400).json({ message: "Person IDs array is required" });
    }
    
    // Limit bulk size to prevent memory issues
    if (personIds.length > 50) {
      return res.status(400).json({ 
        message: "Too many profiles requested. Maximum 50 profiles per bulk export." 
      });
    }
    
    console.log(`📄 Generating bulk PDF for ${personIds.length} people`);
    
    // Find people with lean query
    const people = await Person.find({ _id: { $in: personIds } }).lean().exec();
    
    if (people.length === 0) {
      return res.status(404).json({ message: "No people found" });
    }

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bulk_profiles_${Date.now()}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Create document
    doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: false
    });

    doc.pipe(res);

    // Cover page
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#8B0000')
       .text('JODI NO 1', { align: 'center' });
    doc.fontSize(18).text(`Bulk Export - ${people.length} Profiles`, { align: 'center' });
    doc.moveDown(2);

    // Generate each profile with photos
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      
      if (i > 0) doc.addPage();
      
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#8B0000')
         .text(`${i + 1}. ${person.name || 'N/A'}`, 50);
      doc.moveDown(1);

      // Try to add photo for each person in bulk
      const bestPhoto = getBestPhoto(person);
      if (bestPhoto) {
        await addProfilePhoto(doc, bestPhoto);
      }
      
      // Key info only
      addField(doc, 'Gender', person.gender);
      addField(doc, 'DOB', formatDate(person.dob));
      addField(doc, 'Religion', person.religion);
      addField(doc, 'Phone', person.phoneNumber);
      addField(doc, 'Occupation', person.occupation);
    }

    // Add note to bulk PDF as well
    addImportantNote(doc);

    doc.end();
    console.log("✅ Bulk PDF completed");
    
  } catch (error) {
    console.error("❌ Bulk PDF error:", error);
    
    if (doc && !doc.ended) {
      try { doc.end(); } catch (e) {}
    }
    
    if (!res.headersSent) {
      res.status(500).json({ message: "Bulk PDF failed", error: error.message });
    }
  }
});

// ✅ Keep your existing HTML preview route
router.get("/person/:id/html", async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findById(id).lean();
    
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${person.name || 'Profile'} - JODI NO 1</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 50px; line-height: 1.6; }
          .header { text-align: center; color: #8B0000; margin-bottom: 30px; }
          .field { margin: 8px 0; display: flex; }
          .field-label { font-weight: bold; width: 150px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JODI NO 1</h1>
          <p>9871080409 | jodino1@gmail.com</p>
          <h2>${person.name || 'N/A'}</h2>
        </div>
        <div class="field"><div class="field-label">Name:</div><div>${person.name || '—'}</div></div>
        <div class="field"><div class="field-label">Gender:</div><div>${person.gender || '—'}</div></div>
        <div class="field"><div class="field-label">DOB:</div><div>${formatDate(person.dob)}</div></div>
        <div class="field"><div class="field-label">Phone:</div><div>${person.phoneNumber || '—'}</div></div>
      </body>
      </html>
    `;
    
    res.send(html);
    
  } catch (error) {
    console.error("❌ HTML preview error:", error);
    res.status(500).json({ message: "Failed to generate HTML", error: error.message });
  }
});

// ✅ Route to check PDFKit installation
router.get("/check-pdfkit", (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    console.log("✅ PDFKit check successful");
    res.json({
      message: "✅ PDFKit is installed and working",
      available: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ PDFKit check failed:", error);
    res.status(500).json({
      message: "❌ PDFKit not available",
      error: error.message
    });
  }
});

// 🔧 NEW: Route to check uploads directory
router.get("/debug/uploads", (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, '..', 'uploads');
    console.log("📁 Checking uploads directory:", uploadsPath);
    
    const exists = fs.existsSync(uploadsPath);
    let files = [];
    
    if (exists) {
      files = fs.readdirSync(uploadsPath).map(file => {
        const filePath = path.join(uploadsPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          isFile: stats.isFile(),
          modified: stats.mtime
        };
      });
    }
    
    res.json({
      uploadsPath,
      exists,
      fileCount: files.length,
      files: files.slice(0, 20) // Limit to first 20 files
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

console.log("✅ FIXED PDFKit routes loaded with enhanced image support");

module.exports = router;