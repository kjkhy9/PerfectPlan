const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  question: { type: String, default: "Select a final meeting time" },

  // List of proposed dates
  options: [
    {
      date: { type: Date, required: true },
      votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    }
  ],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Track which users have voted
  voterStatus: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      hasVoted: { type: Boolean, default: false }
    }
  ],

  isClosed: { type: Boolean, default: false },
  winningDate: { type: Date, default: null }
});

module.exports = mongoose.model("Poll", pollSchema);
