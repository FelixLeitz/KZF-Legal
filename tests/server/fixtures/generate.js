// This script generates test fixture files for the document upload tests.
// It creates a sample PDF, a sample text file, an oversized PDF, and a disguised binary file.
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const FIXTURES_DIR = __dirname;

// create a simple PDF with a title and some body text, using pdf-lib to ensure it's a valid PDF file
const createPdf = async (title, bodyLines) => {
    const pdfDoc = await PDFDocument.create();

    // Document metadata — visible in any PDF reader
    pdfDoc.setTitle(title);
    pdfDoc.setAuthor("KFZ-Legal Test Suite");
    pdfDoc.setSubject("Test fixture for document upload tests");
    pdfDoc.setCreator("tests/server/fixtures/generate.js");
    pdfDoc.setProducer("pdf-lib");
    pdfDoc.setCreationDate(new Date());

    const page = pdfDoc.addPage([595, 842]); // A4 in points
    const { width, height } = page.getSize();

    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont  = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Title
    page.drawText(title, {
        x: 50,
        y: height - 80,
        size: 20,
        font: titleFont,
        color: rgb(0.1, 0.1, 0.1),
    });

    // Horizontal divider under title
    page.drawLine({
        start: { x: 50, y: height - 95 },
        end:   { x: width - 50, y: height - 95 },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
    });

    // Body
    let cursorY = height - 130;
    for (const line of bodyLines) {
        page.drawText(line, {
            x: 50,
            y: cursorY,
            size: 12,
            font: bodyFont,
            color: rgb(0.2, 0.2, 0.2),
        });
        cursorY -= 20;
    }

    return pdfDoc.save();
};

// Fixture generation logic
const generateFixtures = async () => {
    console.log("Generating test fixtures in", FIXTURES_DIR);

    // sample.pdf 
    const samplePdf = await createPdf(
        "Skilled Worker Visa Requirements",
        [
            "This is a test fixture for the KFZ-Legal document upload suite.",
            "",
            "Sample legal content:",
            "",
            "To meet the English language requirement for a UK Skilled Worker visa,",
            "you must demonstrate English at level B1 or above on the Common European",
            "Framework of Reference (CEFR). Accepted evidence includes a recognised",
            "Secure English Language Test (SELT) such as IELTS for UKVI, Trinity ISE,",
            "or LanguageCert.",
            "",
            "Generated: " + new Date().toISOString(),
        ]
    );
    fs.writeFileSync(path.join(FIXTURES_DIR, "sample.pdf"), samplePdf);
    console.log("    ✓ sample.pdf       (" + samplePdf.length + " bytes)");

    // sample.txt
    const txtContent = [
        "KFZ-Legal Test Fixture",
        "======================",
        "",
        "This is a plain text test document used by the document upload test suite.",
        "It contains realistic legal content to exercise the RAG ingestion pipeline.",
        "",
        "Sample query: What are the English language requirements for a UK Skilled",
        "Worker visa, and which tests are accepted by the Home Office?",
        "",
        "Generated: " + new Date().toISOString(),
    ].join("\n");
    fs.writeFileSync(path.join(FIXTURES_DIR, "sample.txt"), txtContent);
    console.log("    ✓ sample.txt       (" + Buffer.byteLength(txtContent) + " bytes)");

    // sample.exe
    const exeContent = Buffer.from([
        0x4d, 0x5a, // "MZ" — DOS executable magic bytes
        0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00,
        0x00, 0x00, 0xff, 0xff, 0x00, 0x00,
    ]);
    fs.writeFileSync(path.join(FIXTURES_DIR, "sample.exe"), exeContent);
    console.log("    ✓ sample.exe       (" + exeContent.length + " bytes)");

    // oversized.pdf 
    const baseOversized = await createPdf(
        "Oversized Test Fixture",
        ["This file is intentionally padded to exceed the 10MB upload limit."]
    );

    // Buffer the PDF content to over 10 MB
    const TARGET_SIZE = 11 * 1024 * 1024; 
    const padding = Buffer.alloc(TARGET_SIZE - baseOversized.length, 0x20);
    const oversized = Buffer.concat([Buffer.from(baseOversized), padding]);

    fs.writeFileSync(path.join(FIXTURES_DIR, "oversized.pdf"), oversized);
    console.log("    ✓ oversized.pdf    (" + oversized.length + " bytes ≈ " +
        (oversized.length / 1024 / 1024).toFixed(2) + " MB)");

    console.log();
    console.log("✅  All fixtures generated successfully");
};


generateFixtures().catch((err) => {
    console.error("Fixture generation failed:", err.message);
    process.exit(1);
});
