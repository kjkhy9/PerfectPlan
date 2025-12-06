// models/group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: String,
  inviteCode: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Group', groupSchema);
