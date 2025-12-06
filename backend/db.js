// db.js
const mongoose = require('mongoose');

let connected = false;

async function connectToDatabase(uri) {
  if (connected) return;

  if (!uri) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(uri);
  connected = true;
  console.log('MongoDB connected');
}

module.exports = { connectToDatabase };
