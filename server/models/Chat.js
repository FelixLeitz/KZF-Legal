const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    // Each chat belongs to a user
    user: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true,
      index: true,
    },
    // Optional: a title for the chat, can be auto-generated from the first query
    title: {
      type: String,
      default: "New Chat",
    }, 
    // Track the time of the last message for sorting chats by recent activity
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

// Provides fast retrieval of a user's chats sorted by recent activity
chatSchema.index({ user: 1, lastMessageAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
