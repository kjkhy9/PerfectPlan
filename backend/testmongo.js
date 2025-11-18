require('dotenv').config();
const mongoose = require('mongoose');

console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing! Check your .env file.");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected successfully!");
  process.exit(0);
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});