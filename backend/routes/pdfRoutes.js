// routes/pdfRoutes.js
const express = require("express");
const PDFDocument = require("pdfkit");
const Person = require("../models/personModel");
const path = require("path");
const fs = require("fs");

const router = express.Router();

console.log("📄 Loading PDF routes...");

// Field labels mapping
const fieldLabels = {
  name: "Name",
  age: "Age",
  height: "Height",
  gender: "Gender",
  religion: "Religion",
  caste: "Caste",
  maritalStatus: "Marital Status",
  state: "State",
  area: "Area",
  dob: "Date of Birth",
  nativePlace: "Native Place",
  phoneNumber: "Phone Number",
  occupation: "Occupation",
  education: "Education",
  income: "Income",
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  residence: "Residence"
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date)) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// GET /api/pdf/person/:id/pdf - Generate styled PDF for a person
router.get("/person/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const fieldsParam = req.query.fields || '';
    const selectedFields = fieldsParam ? fieldsParam.split(',') : Object.keys(fieldLabels);
    
    console.log(`📄 Generating PDF for person ${id} with fields:`, selectedFields);
    
    // Find the person
    const person = await Person.findById(id);
    if (!person) {
      console.log("❌ Person not found:", id);
      return res.status(404).json({ message: "Person not found" });
    }
    
    console.log("✅ Person found:", person.name);
    
    // Create PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${person.name.replace(/[^a-zA-Z0-9]/g, '_')}_profile.pdf"`);
    
    // Pipe the PDF to response
    doc.pipe(res);
    
    // Add header
    doc.fontSize(24)
       .fillColor('#2c3e50')
       .text('JODI - Profile Details', { align: 'center' })
       .moveDown();
    
    // Add a line
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke('#3498db')
       .moveDown();
    
    // Add person photo if available
    const photoPath = person.photos && person.photos[0] 
      ? path.join(__dirname, '../uploads', person.photos[0])
      : null;
      
    if (photoPath && fs.existsSync(photoPath)) {
      try {
        doc.image(photoPath, 450, 120, { width: 100, height: 120 });
        console.log("📸 Added photo to PDF");
      } catch (photoError) {
        console.warn("⚠️ Failed to add photo to PDF:", photoError.message);
      }
    }
    
    // Add person name prominently
    doc.fontSize(20)
       .fillColor('#2c3e50')
       .text(person.name || 'N/A', 50, 120)
       .moveDown();
    
    // Add personal details section
    doc.fontSize(16)
       .fillColor('#34495e')
       .text('Personal Information', 50, doc.y)
       .moveDown(0.5);
    
    // Current Y position
    let currentY = doc.y;
    
    // Add selected fields
    doc.fontSize(12).fillColor('#2c3e50');
    
    selectedFields.forEach((field, index) => {
      if (fieldLabels[field] && person[field] !== undefined) {
        let value = person[field];
        
        // Format specific fields
        if (field === 'dob') {
          value = formatDate(value);
        } else if (value === null || value === undefined || value === '') {
          value = '-';
        }
        
        // Add field label and value
        doc.font('Helvetica-Bold')
           .text(`${fieldLabels[field]}:`, 50, currentY, { continued: true, width: 150 })
           .font('Helvetica')
           .text(` ${value}`, { width: 300 });
        
        currentY += 20;
        
        // Check if we need a new page
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }
      }
    });
    
    // Add siblings section if available
    if (person.siblings && person.siblings.length > 0) {
      currentY += 10;
      
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      
      doc.fontSize(16)
         .fillColor('#34495e')
         .text('Family Details', 50, currentY)
         .moveDown(0.5);
      
      currentY = doc.y;
      
      person.siblings.forEach((sibling, index) => {
        doc.fontSize(14)
           .fillColor('#2c3e50')
           .text(`Sibling ${index + 1}:`, 50, currentY);
        
        currentY += 18;
        
        doc.fontSize(12);
        if (sibling.name) {
          doc.text(`Name: ${sibling.name}`, 70, currentY);
          currentY += 15;
        }
        if (sibling.relation) {
          doc.text(`Relation: ${sibling.relation}`, 70, currentY);
          currentY += 15;
        }
        if (sibling.age) {
          doc.text(`Age: ${sibling.age}`, 70, currentY);
          currentY += 15;
        }
        if (sibling.profession) {
          doc.text(`Profession: ${sibling.profession}`, 70, currentY);
          currentY += 15;
        }
        if (sibling.maritalStatus) {
          doc.text(`Marital Status: ${sibling.maritalStatus}`, 70, currentY);
          currentY += 15;
        }
        
        currentY += 10;
        
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }
      });
    }
    
    // Add footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Add page number
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text(`Page ${i + 1} of ${pages.count}`, 50, 770, { align: 'center' });
      
      // Add generation timestamp
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 
               50, 785, { align: 'center' });
    }
    
    // Finalize the PDF
    doc.end();
    
    console.log("✅ PDF generated successfully for:", person.name);
    
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    
    // If response hasn't been sent yet, send error
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to generate PDF",
        error: error.message
      });
    }
  }
});

// GET /api/pdf/bulk - Generate bulk PDF for multiple people
router.post("/bulk", async (req, res) => {
  try {
    const { personIds, selectedFields } = req.body;
    
    if (!personIds || !Array.isArray(personIds) || personIds.length === 0) {
      return res.status(400).json({
        message: "Person IDs array is required"
      });
    }
    
    console.log(`📄 Generating bulk PDF for ${personIds.length} people`);
    
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
      size: 'A4'
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bulk_profiles_${Date.now()}.pdf"`);
    
    // Pipe the PDF to response
    doc.pipe(res);
    
    // Add title page
    doc.fontSize(24)
       .fillColor('#2c3e50')
       .text('JODI - Bulk Profile Export', { align: 'center' })
       .moveDown()
       .fontSize(16)
       .text(`${people.length} Profile(s)`, { align: 'center' })
       .moveDown(2);
    
    // Add each person
    people.forEach((person, personIndex) => {
      if (personIndex > 0) {
        doc.addPage();
      }
      
      // Person header
      doc.fontSize(20)
         .fillColor('#2c3e50')
         .text(`Profile ${personIndex + 1}: ${person.name || 'N/A'}`, 50, 50)
         .moveDown();
      
      // Add line
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke('#3498db')
         .moveDown();
      
      let currentY = doc.y;
      
      // Add fields
      const fieldsToShow = selectedFields || Object.keys(fieldLabels);
      doc.fontSize(12).fillColor('#2c3e50');
      
      fieldsToShow.forEach((field) => {
        if (fieldLabels[field] && person[field] !== undefined) {
          let value = person[field];
          
          if (field === 'dob') {
            value = formatDate(value);
          } else if (value === null || value === undefined || value === '') {
            value = '-';
          }
          
          doc.font('Helvetica-Bold')
             .text(`${fieldLabels[field]}:`, 50, currentY, { continued: true, width: 150 })
             .font('Helvetica')
             .text(` ${value}`, { width: 350 });
          
          currentY += 18;
          
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }
        }
      });
    });
    
    // Finalize PDF
    doc.end();
    
    console.log("✅ Bulk PDF generated successfully");
    
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

console.log("✅ PDF routes loaded successfully");

module.exports = router;