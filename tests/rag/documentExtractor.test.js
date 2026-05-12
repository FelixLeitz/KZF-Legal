const fs = require("fs");
const os = require("os");
const path = require("path");
const { expect } = require("chai");
const {
  extractDocumentText,
  resolveMimeType,
} = require("../../rag/documentExtractor");

describe("rag/documentExtractor", () => {
  const pdfFixture = path.join(__dirname, "fixtures/student-visa.pdf");

  it("resolves mime type from extension when mimeType is omitted", () => {
    expect(resolveMimeType(undefined, "/tmp/report.pdf")).to.equal("application/pdf");
    expect(resolveMimeType(undefined, "/tmp/notes.txt")).to.equal("text/plain");
  });

  it("extracts text from a real PDF fixture", async () => {
    const text = await extractDocumentText({
      filePath: pdfFixture,
      mimeType: "application/pdf",
    });

    expect(text.length).to.be.greaterThan(5);
    expect(text.toLowerCase()).to.include("dummy pdf");
  });

  it("extracts text from plain text files", async () => {
    const tmpFile = path.join(os.tmpdir(), `rag-extract-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, "Subclass 500 student visa checklist");

    try {
      const text = await extractDocumentText({
        filePath: tmpFile,
        mimeType: "text/plain",
      });

      expect(text).to.include("Subclass 500");
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  });

  it("throws RAG_VALIDATION_ERROR for unsupported types", async () => {
    const tmpFile = path.join(os.tmpdir(), `rag-extract-${Date.now()}.zip`);
    fs.writeFileSync(tmpFile, "not-a-document");

    try {
      await extractDocumentText({
        filePath: tmpFile,
        mimeType: "application/zip",
      });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err.code).to.equal("RAG_VALIDATION_ERROR");
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  });

  it("throws RAG_VALIDATION_ERROR when the file does not exist", async () => {
    try {
      await extractDocumentText({
        filePath: "/nonexistent/document.pdf",
        mimeType: "application/pdf",
      });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err.code).to.equal("RAG_VALIDATION_ERROR");
      expect(err.message).to.include("Cannot read file");
    }
  });
});
