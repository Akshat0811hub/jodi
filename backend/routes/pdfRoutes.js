// routes/pdfRoutes.js - LIGHTWEIGHT VERSION WITH html-pdf
const express = require("express");
const ejs = require("ejs");
const Person = require("../models/personModel");
const path = require("path");
const fs = require("fs");

// ✅ Use html-pdf instead of puppeteer (much lighter for free hosting)
// npm install html-pdf
const pdf = require('html-pdf');

const router = express.Router();

console.log("📄 Loading Lightweight PDF routes...");

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

// ✅ LIGHTWEIGHT PDF GENERATION - Replace your existing PDF route
router.get("/person/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Generating lightweight PDF for person ${id}`);
    
    // Find the person
    const person = await Person.findById(id);
    if (!person) {
      console.log("❌ Person not found:", id);
      return res.status(404).json({ message: "Person not found" });
    }
    
    console.log("✅ Person found:", person.name);

    // ✅ Complete template data with ALL fields from AddPersonForm
    const templateData = {
      person: {
        // Personal Details
        name: person.name || "—",
        gender: person.gender || "—",
        maritalStatus: person.maritalStatus || "—",
        dob: person.dob || "—",
        birthPlaceTime: person.birthPlaceTime || "—",
        nativePlace: person.nativePlace || "—",
        gotra: person.gotra || "—",
        religion: person.religion || "—",
        phoneNumber: person.phoneNumber || "—",
        height: person.height || "—",
        complexion: person.complexion || "—",
        horoscope: person.horoscope || "—",
        eatingHabits: person.eatingHabits || "—",
        drinkingHabits: person.drinkingHabits || "—",
        smokingHabits: person.smokingHabits || "—",
        disability: person.disability || "—",
        nri: person.nri || false,
        vehicle: person.vehicle || "—",
        
        // Family Details
        fatherName: person.fatherName || "—",
        fatherOccupation: person.fatherOccupation || "—",
        fatherOffice: person.fatherOffice || "—",
        motherName: person.motherName || "—",
        motherOccupation: person.motherOccupation || "—",
        residence: person.residence || "—",
        otherProperty: person.otherProperty || "—",
        
        // Education
        higherQualification: person.higherQualification || "—",
        graduation: person.graduation || "—",
        schooling: person.schooling || "—",
        
        // Profession & Income
        occupation: person.occupation || "—",
        personalIncome: person.personalIncome || "—",
        familyIncome: person.familyIncome || "—",
        
        // Photos and Siblings
        photos: person.photos || [],
        siblings: person.siblings || [],
        profilePicture: person.photos?.[0] || null,
        
        // Additional fields for compatibility
        family: {
          father: person.fatherName || "—",
          mother: person.motherName || "—"
        }
      },
      companyName: "JODI NO 1",
      PhoneNo: "9871080409",
      companyEmail: "jodino1@gmail.com",
      companyAddress: "Gurugram, Haryana, India",
      logoUrl: "", // Add if you have logo
      baseUrl: process.env.BASE_URL || `${req.protocol}://${req.get('host')}`,
      currentDate: new Date().toLocaleDateString('en-IN')
    };

    console.log("📊 Template data prepared with all fields");

    // ✅ Render EJS template
    const templatePath = path.join(__dirname, '../templates/person-pdf.ejs');
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      console.error("❌ EJS template not found at:", templatePath);
      return res.status(500).json({ 
        message: "PDF template not found", 
        path: templatePath 
      });
    }

    const html = await ejs.renderFile(templatePath, templateData);
    console.log("📝 HTML rendered successfully, length:", html.length);

    // ✅ html-pdf configuration (optimized for free hosting)
    const options = {
      format: 'A4',
      border: {
        top: "0.2in",
        right: "0.3in",
        bottom: "0.2in",
        left: "0.3in"
      },
      timeout: 25000, // Reduced timeout
      quality: '75', // Reduced quality for performance
      zoomFactor: 0.9,
      // Optimize for free hosting
      phantomArgs: [
        '--disk-cache=false', 
        '--load-images=yes',
        '--local-to-remote-url-access=yes',
        '--ignore-ssl-errors=yes'
      ],
      // Additional optimizations
      height: "11.7in",
      width: "8.3in",
      type: 'pdf'
    };

    // ✅ Generate PDF with html-pdf (much lighter than Puppeteer)
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error("❌ html-pdf error:", err);
        return res.status(500).json({ 
          message: "PDF generation failed", 
          error: err.message 
        });
      }

      console.log("✅ PDF generated successfully with html-pdf");

      // ✅ Send PDF with proper headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 
        `attachment; filename="${(person.name || 'profile').replace(/[^a-zA-Z0-9]/g, '_')}_detailed_profile.pdf"`
      );
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    });

  } catch (error) {// Enhanced route with detailed error logging
router.get("/person/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Starting PDF generation for person ${id}`);
    
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
    console.log("📊 Person data keys:", Object.keys(person.toObject ? person.toObject() : person));

    // Step 3: Build template data with extra safety
    const templateData = {
      person: {
        name: person.name || "—",
        gender: person.gender || "—",
        maritalStatus: person.maritalStatus || "—",
        dob: person.dob || "—",
        birthPlaceTime: person.birthPlaceTime || "—",
        nativePlace: person.nativePlace || "—",
        gotra: person.gotra || "—",
        religion: person.religion || "—",
        phoneNumber: person.phoneNumber || "—",
        height: person.height || "—",
        complexion: person.complexion || "—",
        horoscope: person.horoscope || "—",
        eatingHabits: person.eatingHabits || "—",
        drinkingHabits: person.drinkingHabits || "—",
        smokingHabits: person.smokingHabits || "—",
        disability: person.disability || "—",
        nri: person.nri || false,
        vehicle: person.vehicle || "—",
        fatherName: person.fatherName || "—",
        fatherOccupation: person.fatherOccupation || "—",
        fatherOffice: person.fatherOffice || "—",
        motherName: person.motherName || "—",
        motherOccupation: person.motherOccupation || "—",
        residence: person.residence || "—",
        otherProperty: person.otherProperty || "—",
        higherQualification: person.higherQualification || "—",
        graduation: person.graduation || "—",
        schooling: person.schooling || "—",
        occupation: person.occupation || "—",
        personalIncome: person.personalIncome || "—",
        familyIncome: person.familyIncome || "—",
        photos: Array.isArray(person.photos) ? person.photos : [],
        siblings: Array.isArray(person.siblings) ? person.siblings : [],
        profilePicture: (Array.isArray(person.photos) && person.photos.length > 0) ? person.photos[0] : null,
        family: {
          father: person.fatherName || "—",
          mother: person.motherName || "—"
        }
      },
      companyName: "JODI NO 1",
      PhoneNo: "9871080409",
      companyEmail: "jodino1@gmail.com",
      companyAddress: "Gurugram, Haryana, India",
      logoUrl: "",
      baseUrl: process.env.BASE_URL || `${req.protocol}://${req.get('host')}`,
      currentDate: new Date().toLocaleDateString('en-IN')
    };

    console.log("📊 Template data prepared successfully");

    // Step 4: Check template file
    const templatePath = path.join(__dirname, '../templates/pdf-person.ejs');
    console.log("📁 Template path:", templatePath);
    
    if (!fs.existsSync(templatePath)) {
      console.error("❌ EJS template not found at:", templatePath);
      console.log("📁 Directory contents:", fs.readdirSync(path.dirname(templatePath)));
      return res.status(500).json({ 
        message: "PDF template not found", 
        path: templatePath,
        suggestion: "Make sure pdf-person-lite.ejs exists in the views folder"
      });
    }

    console.log("✅ Template file exists");

    // Step 5: Render EJS with detailed error catching
    let html;
    try {
      console.log("🎨 Rendering EJS template...");
      html = await ejs.renderFile(templatePath, templateData);
      console.log("✅ HTML rendered successfully, length:", html.length);
    } catch (ejsError) {
      console.error("❌ EJS Rendering Error:", ejsError);
      return res.status(500).json({ 
        message: "Template rendering failed", 
        error: ejsError.message,
        line: ejsError.line || 'unknown',
        stack: process.env.NODE_ENV === 'development' ? ejsError.stack : undefined
      });
    }

    // Step 6: Generate PDF
    const options = {
      format: 'A4',
      border: {
        top: "0.2in",
        right: "0.3in",
        bottom: "0.2in",
        left: "0.3in"
      },
      timeout: 25000,
      quality: '75',
      zoomFactor: 0.9,
      phantomArgs: [
        '--disk-cache=false', 
        '--load-images=yes',
        '--local-to-remote-url-access=yes',
        '--ignore-ssl-errors=yes'
      ],
      height: "11.7in",
      width: "8.3in",
      type: 'pdf'
    };

    console.log("🖨️ Starting PDF generation with html-pdf...");
    
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error("❌ html-pdf generation error:", err);
        console.error("❌ Error details:", {
          message: err.message,
          stack: err.stack,
          phantomjsPath: err.phantomjsPath
        });
        
        if (!res.headersSent) {
          return res.status(500).json({ 
            message: "PDF generation failed", 
            error: err.message,
            suggestion: "Check if PhantomJS is installed correctly"
          });
        }
        return;
      }

      console.log("✅ PDF generated successfully, size:", buffer.length, "bytes");

      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
          `attachment; filename="${(person.name || 'profile').replace(/[^a-zA-Z0-9]/g, '_')}_profile.pdf"`
        );
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
      }
    });

  } catch (error) {
    console.error("❌ PDF route error:", error);
    console.error("❌ Full error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to generate PDF",
        error: error.message,
        suggestion: "Check server logs for detailed error information",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});
    console.error("❌ PDF generation error:", error);
    
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to generate PDF",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// ✅ HTML preview endpoint (same as before but with lite template)
router.get("/person/:id/html", async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findById(id);
    
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    // Same template data as PDF
    const templateData = {
      person: {
        // All fields exactly as in PDF route above
        name: person.name || "—",
        gender: person.gender || "—",
        maritalStatus: person.maritalStatus || "—",
        dob: person.dob || "—",
        birthPlaceTime: person.birthPlaceTime || "—",
        nativePlace: person.nativePlace || "—",
        gotra: person.gotra || "—",
        religion: person.religion || "—",
        phoneNumber: person.phoneNumber || "—",
        height: person.height || "—",
        complexion: person.complexion || "—",
        horoscope: person.horoscope || "—",
        eatingHabits: person.eatingHabits || "—",
        drinkingHabits: person.drinkingHabits || "—",
        smokingHabits: person.smokingHabits || "—",
        disability: person.disability || "—",
        nri: person.nri || false,
        vehicle: person.vehicle || "—",
        fatherName: person.fatherName || "—",
        fatherOccupation: person.fatherOccupation || "—",
        fatherOffice: person.fatherOffice || "—",
        motherName: person.motherName || "—",
        motherOccupation: person.motherOccupation || "—",
        residence: person.residence || "—",
        otherProperty: person.otherProperty || "—",
        higherQualification: person.higherQualification || "—",
        graduation: person.graduation || "—",
        schooling: person.schooling || "—",
        occupation: person.occupation || "—",
        personalIncome: person.personalIncome || "—",
        familyIncome: person.familyIncome || "—",
        photos: person.photos || [],
        siblings: person.siblings || [],
        profilePicture: person.photos?.[0] || null,
        family: {
          father: person.fatherName || "—",
          mother: person.motherName || "—"
        }
      },
      companyName: "JODI NO 1",
      PhoneNo: "9871080409",
      companyEmail: "jodino1@gmail.com",
      companyAddress: "Gurugram, Haryana, India",
      logoUrl: "",
      baseUrl: process.env.BASE_URL || `${req.protocol}://${req.get('host')}`,
      currentDate: new Date().toLocaleDateString('en-IN')
    };

    const templatePath = path.join(__dirname, '../templates/person-pdf.ejs');
    const html = await ejs.renderFile(templatePath, templateData);
    
    res.send(html); // Send HTML to browser for preview
    
  } catch (error) {
    console.error("❌ HTML preview error:", error);
    res.status(500).json({ message: "Failed to generate HTML preview", error: error.message });
  }
});

// ✅ Lightweight bulk PDF (using html-pdf)
router.post("/bulk", async (req, res) => {
  try {
    const { personIds, selectedFields } = req.body;
    
    if (!personIds || !Array.isArray(personIds) || personIds.length === 0) {
      return res.status(400).json({
        message: "Person IDs array is required"
      });
    }
    
    console.log(`📄 Generating lightweight bulk PDF for ${personIds.length} people`);
    
    // Find all people
    const people = await Person.find({ _id: { $in: personIds } });
    
    if (people.length === 0) {
      return res.status(404).json({
        message: "No people found"
      });
    }

    // ✅ Generate combined HTML for all people
    let combinedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bulk Profiles Export</title>
        <style>
          @page { size: A4; margin: 0.5in; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          .bulk-header { text-align: center; margin-bottom: 30px; page-break-after: always; }
          .person-page { page-break-before: always; padding: 20px 0; }
          .person-title { font-size: 20px; color: maroon; margin-bottom: 20px; text-align: center; border-bottom: 2px solid maroon; padding-bottom: 10px; }
          .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .detail-item { padding: 8px; border-bottom: 1px solid #eee; display: flex; }
          .detail-label { font-weight: bold; color: #333; width: 150px; flex-shrink: 0; }
          .detail-value { color: #666; flex: 1; }
          .company-header { color: maroon; font-size: 24px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="bulk-header">
          <div class="company-header">JODI NO 1</div>
          <p>📞 9871080409 | 📧 jodino1@gmail.com</p>
          <p>📍 Gurugram, Haryana, India</p>
          <h2>Bulk Profiles Export</h2>
          <p>Total Profiles: ${people.length}</p>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
    `;

    people.forEach((person, index) => {
      combinedHtml += `
        <div class="person-page">
          <h2 class="person-title">Profile ${index + 1}: ${person.name || 'N/A'}</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">Name:</div>
              <div class="detail-value">${person.name || "—"}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Gender:</div>
              <div class="detail-value">${person.gender || "—"}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Date of Birth:</div>
              <div class="detail-value">${formatDate(person.dob)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Religion:</div>
              <div class="detail-value">${person.religion || "—"}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Height:</div>
              <div class="detail-value">${person.height || "—"}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Phone Number:</div>
              <div class="detail-value">${person.phoneNumber || "—"}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Occupation:</div>
              <div class="detail-value">${person.occupation || "—"}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Personal Income:</div>
              <div class="detail-value">${person.personalIncome || "—"}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Father Name:</div>
              <div class="detail-value">${person.fatherName || "—"}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Mother Name:</div>
              <div class="detail-value">${person.motherName || "—"}</div>
            </div>
          </div>
        </div>
      `;
    });

    combinedHtml += `</body></html>`;

    // ✅ Generate PDF with html-pdf
    const options = {
      format: 'A4',
      border: {
        top: "0.5in",
        right: "0.5in", 
        bottom: "0.5in",
        left: "0.5in"
      },
      timeout: 25000,
      quality: '75'
    };

    pdf.create(combinedHtml, options).toBuffer((err, buffer) => {
      if (err) {
        console.error("❌ Bulk PDF error:", err);
        return res.status(500).json({ message: "Failed to generate bulk PDF" });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bulk_profiles_${Date.now()}.pdf"`);
      res.send(buffer);
      
      console.log("✅ Bulk PDF generated successfully");
    });
    
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

console.log("✅ Lightweight PDF routes loaded successfully");

module.exports = router;