const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // Each document belongs to a chat 
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
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
    // Summary extracted from document for RAG 
    extractedSummary: { type: String },
    // Prevent duplicate uploads by storing a checksum of the file content
    checksum: { type: String, index: true },
    // Tracks the ingestion lifecycle of the document in the RAG pipeline
    status: {
      type: String,
      enum: ["pending", "ingested", "failed"],
      default: "pending",
      index: true,
    },
    // Stores the reason for failure if ingestion fails
    errorMessage: { type: String },
  },
  { timestamps: true },
);

// Create a compound index for fast retrieval
documentSchema.index({ chat: 1, user: 1, createdAt: -1 });

Document = mongoose.model("Document", documentSchema);

module.exports = Document;