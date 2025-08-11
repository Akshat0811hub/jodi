const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const Person = require("../models/Person"); // adjust path to your Mongoose model

// GET /api/people/:id/pdf
router.get("/:id/pdf", async (req, res) => {
  try {
    const id = req.params.id;
    // fetch person from DB
    const person = await Person.findById(id).lean();
    if (!person) return res.status(404).json({ message: "Person not found" });

    // Prepare data for the template
    // Ensure photos are full public URLs (e.g. /uploads/filename.jpg or absolute URLs)
    // logoUrl can be stored in DB or config; set default here
    const templateData = {
      person,
      logoUrl: process.env.COMPANY_LOGO_URL || `${req.protocol}://${req.get("host")}/assets/logo.png`,
      companyName: process.env.COMPANY_NAME || "SHADIEVERGREEN A UNIT OF LAGANPARTNERS",
      companyContact: process.env.COMPANY_CONTACT || "contact@laganpartners.com",
      companyAddress: process.env.COMPANY_ADDRESS || "Delhi Branch - C 7, Netaji Road Adarsh Nagar Delhi 110033",
      generatedAt: new Date(),
    };

    // Render EJS to HTML
    const html = await ejs.renderFile(path.join(__dirname, "..", "templates", "person-pdf.ejs"), templateData, { async: true });

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set HTML content
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Emulate print CSS
    await page.emulateMediaType("screen");

    // Create PDF buffer
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "90px", bottom: "90px", left: "40px", right: "40px" },
    });

    await browser.close();

    // send as download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${person.name || "profile"}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});

module.exports = router;
