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
  try {
    const { fields } = req.query;
    const selectedFields = fields ? fields.split(",") : [];

    const person = await Person.findById(req.params.id).lean();
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    // ✅ Use BASE_URL if available
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    // ✅ Absolute URL conversion for photos
    if (person.photos && person.photos.length > 0) {
      person.photos = person.photos.map((photo) =>
        photo.startsWith("http")
          ? photo
          : `${baseUrl}/uploads/${photo}`
      );
    }

    // ✅ Absolute URL for profile picture
    if (person.profilePicture && !person.profilePicture.startsWith("http")) {
      person.profilePicture = `${baseUrl}/uploads/${person.profilePicture}`;
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

    // ✅ Absolute URL for logo
    const logoPath = `${baseUrl}/assets/logo.png`;

    const templateData = {
      person: filteredPerson,
      logoUrl: logoPath,
      companyName: "Jodi No.1  by Mamta Aggarwal",
      PhoneNo: "9871080409 , 9211729184 , 9211729185 , 9211729186",
      companyContact: "www.jodino1.com",
      companyEmail: "info@jodino1.com",
      companyAddress:
        "G-25, Vardhman Premium Mall, Opp Kali Mata Mandir Depali enclave Delhi-110034",
      generatedAt: new Date(),
    };

    const html = await ejs.renderFile(
      path.join(__dirname, "..", "templates", "person-pdf.ejs"),
      templateData,
      { async: true }
    );

    const execPath = await chromium.executablePath();
    const tmpExecPath = path.join(os.tmpdir(), "chromium");
    if (!fs.existsSync(tmpExecPath)) {
      fs.copyFileSync(execPath, tmpExecPath);
      fs.chmodSync(tmpExecPath, 0o755);
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: tmpExecPath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    // ✅ Wait for all images to load
    await page.evaluate(async () => {
      const selectors = Array.from(document.images).map(img => {
        if (img.complete) return;
        return new Promise(resolve => {
          img.onload = img.onerror = resolve;
        });
      });
      await Promise.all(selectors);
    });

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
