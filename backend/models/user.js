// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  joinedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
});

module.exports = mongoose.model('User', userSchema);
