// models/group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },

  inviteCode: { type: String, required: true },
  guestCode: { type: String, required: true },

  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  guest: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model('Group', groupSchema);
