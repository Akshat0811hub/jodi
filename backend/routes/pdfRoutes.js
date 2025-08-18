// routes/pdfRoutes.js - FIXED VERSION (Memory Optimized for Render)
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

// 🔧 FIXED: Simple test endpoint that won't crash
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

// 🔧 FIXED: Person PDF route with better error handling
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
    const person = await Person.findById(id).lean().exec(); // Use lean() for better performance
    
    if (!person) {
      console.log("❌ Person not found in database:", id);
      return res.status(404).json({ message: "Person not found" });
    }
    
    console.log("✅ Person found:", person.name || 'Unnamed');

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
       .text('9871080409 | jodino1@gmail.com', { align: 'center' })
       .text('Gurugram, Haryana, India', { align: 'center' });

    doc.moveDown(1);

    // Person name
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#8B0000')
       .text(person.name || 'N/A', { align: 'center' });

    doc.moveDown(1.5);

    // Personal details
    addSectionHeader(doc, 'PERSONAL DETAILS');
    addField(doc, 'Name', person.name);
    addField(doc, 'Gender', person.gender);
    addField(doc, 'Marital Status', person.maritalStatus);
    addField(doc, 'Date of Birth', formatDate(person.dob));
    addField(doc, 'Native Place', person.nativePlace);
    addField(doc, 'Religion', person.religion);
    addField(doc, 'Phone Number', person.phoneNumber);
    addField(doc, 'Height', person.height);

    // Family details
    addSectionHeader(doc, 'FAMILY DETAILS');
    addField(doc, 'Father Name', person.fatherName);
    addField(doc, 'Father Occupation', person.fatherOccupation);
    addField(doc, 'Mother Name', person.motherName);
    addField(doc, 'Mother Occupation', person.motherOccupation);

    // Professional details
    addSectionHeader(doc, 'PROFESSION & INCOME');
    addField(doc, 'Occupation', person.occupation);
    addField(doc, 'Personal Income', person.personalIncome);
    addField(doc, 'Family Income', person.familyIncome);

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

// 🔧 FIXED: Bulk PDF with memory optimization
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

    // Generate each profile
    people.forEach((person, index) => {
      if (index > 0) doc.addPage();
      
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#8B0000')
         .text(`${index + 1}. ${person.name || 'N/A'}`, 50);
      doc.moveDown(1);
      
      // Key info only
      addField(doc, 'Gender', person.gender);
      addField(doc, 'DOB', formatDate(person.dob));
      addField(doc, 'Religion', person.religion);
      addField(doc, 'Phone', person.phoneNumber);
      addField(doc, 'Occupation', person.occupation);
    });

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
          <p>📞 9871080409 | 📧 jodino1@gmail.com</p>
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

console.log("✅ FIXED PDFKit routes loaded");

module.exports = router;