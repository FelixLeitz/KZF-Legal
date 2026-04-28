const { expect } = require("chai");
const { chunkText } = require("../../rag/chunker");

describe("rag/chunker", () => {
  it("returns empty array for blank input", () => {
    expect(chunkText("")).to.deep.equal([]);
    expect(chunkText(null)).to.deep.equal([]);
  });

  it("returns single chunk when text is short", () => {
    const text = "Student visa subclass 500 allows full-time study in Australia.";
    expect(chunkText(text)).to.deep.equal([text]);
  });

  it("splits long text with overlap fallback", () => {
    const text = "A".repeat(1800);
    const chunks = chunkText(text, { chunkSize: 800, overlap: 100 });

    expect(chunks.length).to.be.greaterThan(2);
    expect(chunks[0].length).to.equal(800);
    expect(chunks[1].startsWith("A".repeat(100))).to.be.true;
  });

  it("prefers separator-aware chunks when possible", () => {
    const text = [
      "Visitor visas are generally temporary.",
      "Student visas require enrolment evidence.",
      "Partner visas often require relationship proof.",
    ].join("\n");

    const chunks = chunkText(text, { chunkSize: 120, overlap: 20 });

    expect(chunks.length).to.equal(2);
    expect(chunks[0]).to.include("Visitor visas");
    expect(chunks[1]).to.include("Partner visas");
  });
});
