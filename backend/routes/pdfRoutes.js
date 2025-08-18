// routes/pdfRoutes.js
const express = require("express");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const Person = require("../models/personModel");
const path = require("path");
const fs = require("fs");

const router = express.Router();

console.log("📄 Loading PDF routes...");

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

// GET /api/pdf/person/:id/pdf - Generate styled PDF using EJS template
router.get("/person/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Generating styled PDF for person ${id}`);
    
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
      baseUrl: process.env.BASE_URL || `${req.protocol}://${req.get('host')}`
    };

    console.log("📊 Template data prepared with all fields");

    // ✅ Render EJS template
    const templatePath = path.join(__dirname, '../views/pdf-person.ejs');
    
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

    // ✅ Launch Puppeteer with proper config
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor',
        '--run-all-compositor-stages-before-draw',
        '--disable-backgrounding-occluded-windows'
      ]
    });

    const page = await browser.newPage();
    
    // ✅ Set viewport and emulate screen
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    
    // ✅ Set content and wait for everything to load
    await page.setContent(html, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000 
    });

    // ✅ Wait a bit more for fonts and styles to load
    await page.waitForTimeout(2000);

    // ✅ Generate PDF with optimal settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // ✅ CRITICAL for your styling
      margin: {
        top: '0px',
        right: '0px', 
        bottom: '0px',
        left: '0px'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      scale: 1,
      quality: 100
    });

    await browser.close();
    console.log("✅ PDF generated successfully with styling");

    // ✅ Send PDF with proper headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${(person.name || 'profile').replace(/[^a-zA-Z0-9]/g, '_')}_detailed_profile.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
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

// ✅ HTML preview endpoint for debugging (same data as PDF)
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
        // Personal Details - ALL fields from form
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
        
        // Compatibility
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
      baseUrl: process.env.BASE_URL || `${req.protocol}://${req.get('host')}`
    };

    const templatePath = path.join(__dirname, '../views/pdf-person.ejs');
    const html = await ejs.renderFile(templatePath, templateData);
    
    res.send(html); // Send HTML to browser for preview
    
  } catch (error) {
    console.error("❌ HTML preview error:", error);
    res.status(500).json({ message: "Failed to generate HTML preview", error: error.message });
  }
});

// POST /api/pdf/bulk - Generate bulk PDF for multiple people (keeping same functionality)
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

    // ✅ Use Puppeteer for bulk PDF as well for consistency
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // ✅ Generate combined HTML for all people
    let combinedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bulk Profiles Export</title>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .bulk-header { text-align: center; margin-bottom: 30px; page-break-after: always; }
          .person-page { page-break-before: always; padding: 40px; }
          .person-title { font-size: 24px; color: maroon; margin-bottom: 20px; text-align: center; }
          .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .detail-item { padding: 8px; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #333; }
          .detail-value { color: #666; }
        </style>
      </head>
      <body>
        <div class="bulk-header">
          <h1 style="color: maroon;">JODI NO 1 - Bulk Profiles Export</h1>
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
          </div>
        </div>
      `;
    });

    combinedHtml += `</body></html>`;

    await page.setContent(combinedHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bulk_profiles_${Date.now()}.pdf"`);
    res.send(pdfBuffer);
    
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