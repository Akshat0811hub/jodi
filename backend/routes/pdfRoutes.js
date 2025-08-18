const express = require("express");
const router = express.Router();
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const os = require("os");
const Person = require("../models/personModel");

router.get("/:id/pdf", async (req, res) => {
  let browser = null;
  
  try {
    const { fields } = req.query;
    const selectedFields = fields ? fields.split(",") : [];

    const person = await Person.findById(req.params.id).lean();
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    // ✅ Use BASE_URL if available, fallback to request URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    // ✅ Process photos - keep as filenames for database storage
    if (person.photos && Array.isArray(person.photos) && person.photos.length > 0) {
      // Ensure photos are stored as filenames only
      person.photos = person.photos.map(photo => {
        if (photo.startsWith('http')) {
          // Extract filename from full URL if it exists
          const urlParts = photo.split('/');
          return urlParts[urlParts.length - 1];
        }
        return photo;
      });
    } else {
      person.photos = [];
    }

    // ✅ Process profile picture - keep as filename
    if (person.profilePicture) {
      if (person.profilePicture.startsWith('http')) {
        // Extract filename from full URL if it exists
        const urlParts = person.profilePicture.split('/');
        person.profilePicture = urlParts[urlParts.length - 1];
      }
    }

    let filteredPerson = {
      name: person.name || "N/A",
      photos: person.photos || [],
      profilePicture: person.profilePicture || "",
    };

    if (selectedFields.length > 0) {
      selectedFields.forEach((field) => {
        if (person[field] !== undefined) {
          filteredPerson[field] = 
            person[field] && person[field].toString().trim() !== ""
              ? person[field]
              : "N/A";
        }
      });

      const alwaysInclude = [
        "fatherName", "fatherOccupation", "fatherOffice",
        "motherName", "motherOccupation", "residence", 
        "otherProperty", "siblings"
      ];
      
      alwaysInclude.forEach((field) => {
        if (person[field] !== undefined && filteredPerson[field] === undefined) {
          filteredPerson[field] = 
            person[field] && person[field].toString().trim() !== ""
              ? person[field]
              : "N/A";
        }
      });
    } else {
      filteredPerson = {};
      Object.keys(person).forEach((key) => {
        filteredPerson[key] = 
          person[key] && person[key].toString().trim() !== ""
            ? person[key]
            : "N/A";
      });
    }

    // ✅ Logo path
    const logoPath = `${baseUrl}/assets/logo.png`;

    const templateData = {
      person: filteredPerson,
      logoUrl: logoPath,
      baseUrl, // ✅ Pass baseUrl to template for URL construction
      companyName: "Jodi No.1 by Mamta Aggarwal",
      PhoneNo: "9871080409, 9211729184, 9211729185, 9211729186",
      companyContact: "www.jodino1.com",
      companyEmail: "info@jodino1.com",
      companyAddress: "G-25, Vardhman Premium Mall, Opp Kali Mata Mandir Depali enclave Delhi-110034",
      generatedAt: new Date(),
    };

    console.log("🔄 Rendering EJS template...");
    const html = await ejs.renderFile(
      path.join(__dirname, "..", "templates", "person-pdf.ejs"),
      templateData,
      { async: true }
    );

    console.log("🔄 Starting Puppeteer...");
    
    // ✅ Improved Puppeteer setup
    let executablePath;
    
    if (process.env.NODE_ENV === 'production') {
      executablePath = await chromium.executablePath();
    } else {
      // For local development, try to use local Chrome
      executablePath = '/usr/bin/google-chrome' || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' || await chromium.executablePath();
    }

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless || true,
    });

    const page = await browser.newPage();
    
    // ✅ Set longer timeout and better error handling
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    console.log("🔄 Setting page content...");
    await page.setContent(html, { 
      waitUntil: ["domcontentloaded", "networkidle0"],
      timeout: 30000 
    });

    console.log("🔄 Waiting for images to load...");
    // ✅ Enhanced image loading with timeout
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      console.log(`Found ${images.length} images to load`);
      
      const imagePromises = images.map(img => {
        if (img.complete && img.naturalHeight !== 0) {
          return Promise.resolve();
        }
        
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log(`Image timeout: ${img.src}`);
            resolve();
          }, 10000); // 10 second timeout per image
          
          img.onload = () => {
            clearTimeout(timeout);
            console.log(`Image loaded: ${img.src}`);
            resolve();
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            console.log(`Image error: ${img.src}`);
            resolve();
          };
        });
      });
      
      await Promise.all(imagePromises);
    });

    await page.emulateMediaType("screen");

    console.log("🔄 Generating PDF...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { 
        top: "90px", 
        bottom: "90px", 
        left: "40px", 
        right: "40px" 
      },
      timeout: 60000, // 60 second timeout
    });

    await browser.close();
    browser = null;

    console.log("✅ PDF generated successfully");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${person.name || "profile"}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);

  } catch (err) {
    console.error("❌ PDF generation error:", err);
    
    // ✅ Clean up browser on error
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("❌ Error closing browser:", closeErr);
      }
    }
    
    res.status(500).json({ 
      message: "Failed to generate PDF", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;