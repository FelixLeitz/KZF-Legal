const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // Each document is uploaded by a user, which can be used for access control and organization in the UI
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Original filename of the uploaded document, useful for display in the UI
    filename: { type: String, required: true },
    // MIME type of the uploaded document, which can help in rendering the document or showing an appropriate icon in the UI
    mimeType: { type: String, required: true },
    // Filesize in bytes, which can be displayed in the UI and used for validating upload limits
    size: { type: Number, required: true },
    // Path to the stored document
    storageUrl: { type: String, required: true }, 
    // Text extracted from document for RAG 
    extractedText: { type: String }, 
    // Prevent duplicate uploads by storing a checksum of the file content
    checksum: { type: String, index: true }, 
  },
  { timestamps: true },
);

Document = mongoose.model("Document", documentSchema);

module.exports = Document;
