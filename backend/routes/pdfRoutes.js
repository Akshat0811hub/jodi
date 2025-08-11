const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const Person = require("../models/personModel");

// GET /api/people/:id/pdf?fields=age,height
router.get("/:id/pdf", async (req, res) => {
  try {
    const { fields } = req.query;
    const selectedFields = fields ? fields.split(",") : [];

    const person = await Person.findById(req.params.id).lean();
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    // ✅ Ensure photos have absolute URLs so they show in PDF
    if (person.photos && person.photos.length > 0) {
      person.photos = person.photos.map((photo) =>
        photo.startsWith("http")
          ? photo
          : `${req.protocol}://${req.get("host")}${photo}`
      );
    }

    let filteredPerson = { name: person.name, photos: person.photos };

    if (selectedFields.length > 0) {
      selectedFields.forEach((field) => {
        if (person[field] !== undefined) {
          filteredPerson[field] = person[field];
        }
      });

      // ✅ Always include relationship details if available
      ["father", "mother", "siblings", "other"].forEach((rel) => {
        if (person[rel] !== undefined) {
          filteredPerson[rel] = person[rel];
        }
      });
    } else {
      filteredPerson = person;
    }

    const logoPath = `${req.protocol}://${req.get("host")}/assets/logo.png`;

    const templateData = {
      person: filteredPerson,
      logoUrl: logoPath,
      companyName: "Jodi No.1",
      PhoneNo: "9871080409 , 9211729184 , 9211729185 , 9211729186",
      companyContact: "www.jodino1.com",
      companyAddress:
        "G-25, Vardhman Premium Mall, Opp Kali Mata Mandir Depali enclave Delhi-110034",
      generatedAt: new Date(),
    };

    const html = await ejs.renderFile(
      path.join(__dirname, "..", "templates", "person-pdf.ejs"),
      templateData,
      { async: true }
    );

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "90px", bottom: "90px", left: "40px", right: "40px" },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${person.name || "profile"}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ PDF generation error:", err);
    res
      .status(500)
      .json({ message: "Failed to generate PDF", error: err.message });
  }
});

module.exports = router;
