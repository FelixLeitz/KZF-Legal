const mongoose = require("mongoose");

const citationSchema = new mongoose.Schema({
  // A unique identifier for the citation, which can be used to reference it in the UI or for linking to documents
  id: { type: Number, required: true }, 
  // A human-readable title for the source, which can be displayed in the UI      
  title: { type: String, required: true },
  // Source type indicates where the information came from, which can help in rendering the citation in the UI
  source: {
    type: String,
    enum: ['vector', 'web'],                   
    required: true,
  },
  // For web sources, the URL of the page where the information was retrieved
  url: { type: String },
  // Retrieved text snippet from the source, useful for showing context in the UI
  snippet: { type: String },
  // Optional: link back to your own Document collection when source === 'vector'
  documentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
}, { _id: false }); // No need for ObjectIds for citation

const messageSchema = new mongoose.Schema(
  {
    // Each message belongs to a chat and a user 
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // User submitted query 
    query: { type: String, required: true },
    // Structured response by the system, including the answer and its citations
    response: {
      answer:    { type: String, default: "" },  
      citations: { type: [citationSchema], default: [] },
    },

    // Optional: if the message is associated with uploaded documents
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],

    // Status of the message processing, useful for the UI to show loading states or errors
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    // Optional: metadata like tokens used, model name, latency
    meta: {
      model: String,
      tokensUsed: Number,
      latencyMs: Number,
    },
  },
  { timestamps: true },
);

// Fast retrieval of messages within a chat in order
messageSchema.index({ chat: 1, createdAt: 1 });

Message = mongoose.model("Message", messageSchema);

module.exports = Message;
