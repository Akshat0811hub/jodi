// routes/pdfRoutes.js - PDFKIT VERSION (Render-Compatible)
const express = require("express");
const PDFDocument = require('pdfkit');
const Person = require("../models/personModel");
const path = require("path");
const fs = require("fs");

const router = express.Router();

console.log("📄 Loading PDFKit PDF routes (Render-compatible)...");

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

// ✅ Helper function to add section header
const addSectionHeader = (doc, title) => {
  doc.moveDown(0.5);
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#8B0000') // Maroon color
     .text(title, 50);
  
  // Add underline
  doc.moveTo(50, doc.y + 2)
     .lineTo(550, doc.y + 2)
     .stroke('#8B0000');
  
  doc.fillColor('#000000').moveDown(0.8);
};

// ✅ PDFKIT PDF GENERATION - Works on Render!
router.get("/person/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Generating PDFKit PDF for person ${id}`);
    
    // Step 1: Validate ID format
    if (!id || id.length !== 24) {
      console.log("❌ Invalid ID format:", id);
      return res.status(400).json({ message: "Invalid person ID format" });
    }
    
    // Step 2: Find the person
    console.log("🔍 Searching for person in database...");
    const person = await Person.findById(id);
    if (!person) {
      console.log("❌ Person not found in database:", id);
      return res.status(404).json({ message: "Person not found" });
    }
    
    console.log("✅ Person found:", person.name || 'Unnamed');

    // Step 3: Create PDF document
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `${person.name || 'Profile'} - JODI NO 1`,
        Author: 'JODI NO 1',
        Subject: 'Matrimonial Profile',
        Creator: 'JODI NO 1 System'
      }
    });

    // Set response headers immediately
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${(person.name || 'profile').replace(/[^a-zA-Z0-9]/g, '_')}_profile.pdf"`
    );

    // Stream PDF directly to response
    doc.pipe(res);

    // ✅ HEADER SECTION
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#8B0000') // Maroon
       .text('JODI NO 1', 50, 50, { align: 'center' });

    doc.fontSize(12)
       .fillColor('#000000')
       .font('Helvetica')
       .text('📞 9871080409 | 📧 jodino1@gmail.com', { align: 'center' })
       .text('📍 Gurugram, Haryana, India', { align: 'center' });

    doc.moveDown(1);

    // ✅ PERSON NAME (Main Title)
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#8B0000')
       .text(person.name || 'N/A', { align: 'center' });

    doc.moveDown(1.5);

    // ✅ PERSONAL DETAILS SECTION
    addSectionHeader(doc, '👤 PERSONAL DETAILS');
    
    addField(doc, 'Name', person.name);
    addField(doc, 'Gender', person.gender);
    addField(doc, 'Marital Status', person.maritalStatus);
    addField(doc, 'Date of Birth', formatDate(person.dob));
    addField(doc, 'Birth Place & Time', person.birthPlaceTime);
    addField(doc, 'Native Place', person.nativePlace);
    addField(doc, 'Gotra', person.gotra);
    addField(doc, 'Religion', person.religion);
    addField(doc, 'Phone Number', person.phoneNumber);
    addField(doc, 'Height', person.height);
    addField(doc, 'Complexion', person.complexion);

    // ✅ LIFESTYLE SECTION
    addSectionHeader(doc, '🍽️ LIFESTYLE');
    
    addField(doc, 'Eating Habits', person.eatingHabits);
    addField(doc, 'Drinking Habits', person.drinkingHabits);
    addField(doc, 'Smoking Habits', person.smokingHabits);
    addField(doc, 'Disability', person.disability);
    addField(doc, 'NRI Status', person.nri ? 'Yes' : 'No');
    addField(doc, 'Vehicle', person.vehicle);
    addField(doc, 'Horoscope', person.horoscope);

    // ✅ FAMILY DETAILS SECTION  
    addSectionHeader(doc, '👨‍👩‍👧‍👦 FAMILY DETAILS');
    
    addField(doc, 'Father Name', person.fatherName);
    addField(doc, 'Father Occupation', person.fatherOccupation);
    addField(doc, 'Father Office', person.fatherOffice);
    addField(doc, 'Mother Name', person.motherName);
    addField(doc, 'Mother Occupation', person.motherOccupation);
    addField(doc, 'Residence', person.residence);
    addField(doc, 'Other Property', person.otherProperty);

    // ✅ EDUCATION SECTION
    addSectionHeader(doc, '🎓 EDUCATION');
    
    addField(doc, 'Higher Qualification', person.higherQualification);
    addField(doc, 'Graduation', person.graduation);
    addField(doc, 'Schooling', person.schooling);

    // ✅ PROFESSION & INCOME SECTION
    addSectionHeader(doc, '💼 PROFESSION & INCOME');
    
    addField(doc, 'Occupation', person.occupation);
    addField(doc, 'Personal Income', person.personalIncome);
    addField(doc, 'Family Income', person.familyIncome);

    // ✅ SIBLINGS SECTION (if any)
    if (person.siblings && person.siblings.length > 0) {
      addSectionHeader(doc, '👫 SIBLINGS');
      
      person.siblings.forEach((sibling, index) => {
        addField(doc, `Sibling ${index + 1}`, 
          `${sibling.name || 'N/A'} - ${sibling.relationship || 'N/A'} - ${sibling.maritalStatus || 'N/A'}`);
      });
    }

    // ✅ PHOTOS SECTION (if any)
    if (person.photos && person.photos.length > 0) {
      addSectionHeader(doc, '📷 PHOTOS');
      addField(doc, 'Total Photos', person.photos.length.toString());
      
      // Note: We can't embed actual images without complex setup
      // Just list photo filenames for now
      person.photos.forEach((photo, index) => {
        addField(doc, `Photo ${index + 1}`, photo);
      });
    }

    // ✅ FOOTER
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Generated on: ${new Date().toLocaleDateString('en-IN')} | JODI NO 1 - Your Trusted Matrimonial Partner`, 
             50, doc.page.height - 70, { align: 'center' });

    // End the document
    doc.end();
    
    console.log("✅ PDFKit PDF generated and streamed successfully");

  } catch (error) {
    console.error("❌ PDFKit PDF generation error:", error);
    console.error("❌ Full error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to generate PDF",
        error: error.message,
        suggestion: "PDFKit generation failed - check server logs",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// ✅ HTML preview endpoint (keep this for debugging)
router.get("/person/:id/html", async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findById(id);
    
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    // Generate HTML preview
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${person.name || 'Profile'} - JODI NO 1</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 50px; line-height: 1.6; }
          .header { text-align: center; color: #8B0000; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; }
          .person-name { font-size: 20px; margin: 20px 0; color: #8B0000; }
          .section { margin: 20px 0; }
          .section-title { font-size: 16px; font-weight: bold; color: #8B0000; border-bottom: 2px solid #8B0000; padding-bottom: 5px; margin-bottom: 15px; }
          .field { margin: 8px 0; display: flex; }
          .field-label { font-weight: bold; width: 150px; }
          .field-value { flex: 1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">JODI NO 1</div>
          <div>📞 9871080409 | 📧 jodino1@gmail.com</div>
          <div>📍 Gurugram, Haryana, India</div>
          <div class="person-name">${person.name || 'N/A'}</div>
        </div>

        <div class="section">
          <div class="section-title">👤 PERSONAL DETAILS</div>
          <div class="field"><div class="field-label">Name:</div><div class="field-value">${person.name || '—'}</div></div>
          <div class="field"><div class="field-label">Gender:</div><div class="field-value">${person.gender || '—'}</div></div>
          <div class="field"><div class="field-label">Marital Status:</div><div class="field-value">${person.maritalStatus || '—'}</div></div>
          <div class="field"><div class="field-label">Date of Birth:</div><div class="field-value">${formatDate(person.dob)}</div></div>
          <div class="field"><div class="field-label">Birth Place & Time:</div><div class="field-value">${person.birthPlaceTime || '—'}</div></div>
          <div class="field"><div class="field-label">Native Place:</div><div class="field-value">${person.nativePlace || '—'}</div></div>
          <div class="field"><div class="field-label">Religion:</div><div class="field-value">${person.religion || '—'}</div></div>
          <div class="field"><div class="field-label">Phone:</div><div class="field-value">${person.phoneNumber || '—'}</div></div>
          <div class="field"><div class="field-label">Height:</div><div class="field-value">${person.height || '—'}</div></div>
        </div>

        <div class="section">
          <div class="section-title">👨‍👩‍👧‍👦 FAMILY DETAILS</div>
          <div class="field"><div class="field-label">Father Name:</div><div class="field-value">${person.fatherName || '—'}</div></div>
          <div class="field"><div class="field-label">Father Occupation:</div><div class="field-value">${person.fatherOccupation || '—'}</div></div>
          <div class="field"><div class="field-label">Mother Name:</div><div class="field-value">${person.motherName || '—'}</div></div>
          <div class="field"><div class="field-label">Mother Occupation:</div><div class="field-value">${person.motherOccupation || '—'}</div></div>
        </div>

        <div class="section">
          <div class="section-title">💼 PROFESSION & INCOME</div>
          <div class="field"><div class="field-label">Occupation:</div><div class="field-value">${person.occupation || '—'}</div></div>
          <div class="field"><div class="field-label">Personal Income:</div><div class="field-value">${person.personalIncome || '—'}</div></div>
          <div class="field"><div class="field-label">Family Income:</div><div class="field-value">${person.familyIncome || '—'}</div></div>
        </div>

        <div style="margin-top: 50px; text-align: center; color: #666; font-size: 10px;">
          Generated on: ${new Date().toLocaleDateString('en-IN')} | JODI NO 1 - Your Trusted Matrimonial Partner
        </div>
      </body>
      </html>
    `;
    
    res.send(html);
    
  } catch (error) {
    console.error("❌ HTML preview error:", error);
    res.status(500).json({ message: "Failed to generate HTML preview", error: error.message });
  }
});

// ✅ PDFKIT BULK PDF GENERATION
router.post("/bulk", async (req, res) => {
  try {
    const { personIds, selectedFields } = req.body;
    
    if (!personIds || !Array.isArray(personIds) || personIds.length === 0) {
      return res.status(400).json({
        message: "Person IDs array is required"
      });
    }
    
    console.log(`📄 Generating PDFKit bulk PDF for ${personIds.length} people`);
    
    // Find all people
    const people = await Person.find({ _id: { $in: personIds } });
    
    if (people.length === 0) {
      return res.status(404).json({
        message: "No people found"
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Bulk Profiles Export - JODI NO 1`,
        Author: 'JODI NO 1',
        Subject: 'Bulk Matrimonial Profiles'
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bulk_profiles_${Date.now()}.pdf"`);

    // Stream PDF to response
    doc.pipe(res);

    // ✅ BULK PDF COVER PAGE
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#8B0000')
       .text('JODI NO 1', { align: 'center' });

    doc.fontSize(12)
       .fillColor('#000000')
       .font('Helvetica')
       .text('📞 9871080409 | 📧 jodino1@gmail.com', { align: 'center' })
       .text('📍 Gurugram, Haryana, India', { align: 'center' });

    doc.moveDown(2);

    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('Bulk Profiles Export', { align: 'center' });

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Total Profiles: ${people.length}`, { align: 'center' })
       .text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });

    // ✅ Generate each person's profile
    people.forEach((person, index) => {
      // Add page break for each person (except first)
      if (index > 0) {
        doc.addPage();
      } else {
        doc.moveDown(3);
      }

      // Person header
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#8B0000')
         .text(`Profile ${index + 1}: ${person.name || 'N/A'}`, 50);

      doc.moveDown(1);

      // Key details in compact format
      const keyFields = [
        ['Name', person.name],
        ['Gender', person.gender], 
        ['Date of Birth', formatDate(person.dob)],
        ['Religion', person.religion],
        ['Height', person.height],
        ['Phone Number', person.phoneNumber],
        ['Occupation', person.occupation],
        ['Personal Income', person.personalIncome],
        ['Father Name', person.fatherName],
        ['Mother Name', person.motherName],
        ['Native Place', person.nativePlace],
        ['Marital Status', person.maritalStatus]
      ];

      // Add fields in two columns
      keyFields.forEach((field, fieldIndex) => {
        if (fieldIndex % 2 === 0) {
          // Left column
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(field[0] + ':', 50, doc.y, { width: 200, continued: true });
          doc.font('Helvetica')
             .text(' ' + (field[1] || '—'), { width: 200 });
        } else {
          // Right column - go back up
          const currentY = doc.y - 15;
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(field[0] + ':', 300, currentY, { width: 200, continued: true });
          doc.font('Helvetica')
             .text(' ' + (field[1] || '—'), { width: 200 });
        }
        
        if (fieldIndex % 2 === 1) {
          doc.moveDown(0.3);
        }
      });
    });

    // End the document
    doc.end();
    
    console.log("✅ PDFKit bulk PDF generated and streamed successfully");
    
  } catch (error) {
    console.error("❌ Bulk PDF generation error:", error);
    
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to generate bulk PDF",
        error: error.message
      });
    }
  }
});

// ✅ Test endpoint to verify PDFKit is working
router.get("/test-pdf", (req, res) => {
  try {
    console.log("🧪 Testing PDFKit functionality...");
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
    
    doc.pipe(res);
    
    doc.fontSize(20).text('PDFKit Test - Success!', 100, 100);
    doc.fontSize(12).text('If you can see this PDF, PDFKit is working correctly on your server.');
    doc.text('This means your PDF generation should work without PhantomJS or Puppeteer.');
    
    doc.end();
    
    console.log("✅ PDFKit test PDF generated");
    
  } catch (error) {
    console.error("❌ PDFKit test failed:", error);
    res.status(500).json({ 
      message: "PDFKit test failed", 
      error: error.message 
    });
  }
});

// ✅ Route to check PDFKit installation
router.get("/check-pdfkit", (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    res.json({
      message: "✅ PDFKit is installed and working",
      version: require('pdfkit/package.json').version,
      available: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ PDFKit not available",
      error: error.message,
      suggestion: "Run: npm install pdfkit"
    });
  }
});

console.log("✅ PDFKit PDF routes loaded successfully");

module.exports = router;