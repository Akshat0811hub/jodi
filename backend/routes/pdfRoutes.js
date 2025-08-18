const express = require("express");
const router = express.Router();
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const Person = require("../models/personModel");

// ✅ Updated route path - now accessible at /api/pdf/person/:id/pdf
router.get("/person/:id/pdf", async (req, res) => {
  let browser = null;
  
  try {
    console.log(`🔄 Generating PDF for person ID: ${req.params.id}`);
    
    const { fields } = req.query;
    const selectedFields = fields ? fields.split(",") : [];

    const person = await Person.findById(req.params.id).lean();
    if (!person) {
      console.log("❌ Person not found");
      return res.status(404).json({ message: "Person not found" });
    }

    console.log("✅ Person found:", person.name);

    // ✅ Use BASE_URL if available, fallback to request URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    console.log("🔗 Using base URL:", baseUrl);

    // ✅ Process photos - ensure they're stored as filenames
    if (person.photos && Array.isArray(person.photos) && person.photos.length > 0) {
      person.photos = person.photos.map(photo => {
        if (photo.startsWith('http')) {
          const urlParts = photo.split('/');
          return urlParts[urlParts.length - 1];
        }
        return photo;
      });
      console.log("📸 Processed photos:", person.photos.length);
    } else {
      person.photos = [];
      console.log("📸 No photos found");
    }

    // ✅ Process profile picture
    if (person.profilePicture) {
      if (person.profilePicture.startsWith('http')) {
        const urlParts = person.profilePicture.split('/');
        person.profilePicture = urlParts[urlParts.length - 1];
      }
      console.log("👤 Profile picture:", person.profilePicture);
    }

    let filteredPerson = {
      name: person.name || "N/A",
      photos: person.photos || [],
      profilePicture: person.profilePicture || "",
    };

    // ✅ Handle field filtering
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

    // ✅ Template data
    const templateData = {
      person: filteredPerson,
      logoUrl: `${baseUrl}/assets/logo.png`,
      baseUrl,
      companyName: "Jodi No.1 by Mamta Aggarwal",
      PhoneNo: "9871080409, 9211729184, 9211729185, 9211729186",
      companyContact: "www.jodino1.com",
      companyEmail: "info@jodino1.com",
      companyAddress: "G-25, Vardhman Premium Mall, Opp Kali Mata Mandir Depali enclave Delhi-110034",
      generatedAt: new Date(),
    };

    console.log("🔄 Rendering EJS template...");
    const templatePath = path.join(__dirname, "..", "templates", "person-pdf.ejs");
    
    // ✅ Check if template exists
    if (!fs.existsSync(templatePath)) {
      console.error("❌ Template not found:", templatePath);
      return res.status(500).json({ message: "PDF template not found" });
    }

    const html = await ejs.renderFile(templatePath, templateData, { async: true });
    console.log("✅ Template rendered successfully");

    // ✅ Puppeteer configuration
    console.log("🔄 Starting Puppeteer...");
    
    const isDevelopment = process.env.NODE_ENV !== 'production';
    let executablePath;
    
    if (isDevelopment) {
      // For local development
      const localChromePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      ];
      
      executablePath = localChromePaths.find(path => fs.existsSync(path)) || await chromium.executablePath();
    } else {
      executablePath = await chromium.executablePath();
    }

    console.log("🔧 Using Chrome executable:", executablePath);

    const browserArgs = isDevelopment 
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-gpu',
          '--single-process'
        ];

    browser = await puppeteer.launch({
      args: browserArgs,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless || true,
      timeout: 30000
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    console.log("🔄 Setting page content...");
    await page.setContent(html, { 
      waitUntil: ["domcontentloaded", "networkidle0"],
      timeout: 30000 
    });

    console.log("🔄 Waiting for images to load...");
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
          }, 8000);
          
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
      timeout: 60000,
      preferCSSPageSize: true
    });

    await browser.close();
    browser = null;

    console.log("✅ PDF generated successfully");

    // ✅ Set proper headers
    const fileName = `${(person.name || "profile").replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": pdfBuffer.length,
      "Access-Control-Allow-Origin": req.headers.origin || "*",
      "Access-Control-Allow-Credentials": "true"
    });

    res.send(pdfBuffer);

  } catch (err) {
    console.error("❌ PDF generation error:", err);
    
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
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ✅ Health check for PDF service
router.get("/health", (req, res) => {
  res.json({ 
    status: "PDF service is running",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;