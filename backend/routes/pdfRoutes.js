const express = require("express");
const router = express.Router();
const chromium = require("@sparticuz/chromium"); // ✅ Render-friendly chromium
const puppeteer = require("puppeteer-core"); // ✅ core version
const ejs = require("ejs");
const path = require("path");
const Person = require("../models/personModel");

router.get("/:id/pdf", async (req, res) => {
  try {
    const { fields } = req.query;
    const selectedFields = fields ? fields.split(",") : [];

    const person = await Person.findById(req.params.id).lean();
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    if (person.photos && person.photos.length > 0) {
      person.photos = person.photos.map((photo) =>
        photo.startsWith("http")
          ? photo
          : `${req.protocol}://${req.get("host")}${photo}`
      );
    }

    let filteredPerson = {
      name: person.name || "N/A",
      photos: person.photos || [],
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
        "fatherName",
        "fatherOccupation",
        "fatherOffice",
        "motherName",
        "motherOccupation",
        "residence",
        "otherProperty",
        "siblings",
      ];
      alwaysInclude.forEach((field) => {
        if (
          person[field] !== undefined &&
          filteredPerson[field] === undefined
        ) {
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

    const logoPath = `${req.protocol}://${req.get("host")}/assets/logo.png`;

    const templateData = {
      person: filteredPerson,
      logoUrl: logoPath,
      companyName: "Jodi No.1  by Mamta Aggarwal",
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

    // ✅ FIXED Puppeteer launch for Render
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(), // direct executablePath — no temp copy
      headless: chromium.headless,
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
      "Content-Disposition": `attachment; filename="${
        person.name || "profile"
      }.pdf"`,
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
