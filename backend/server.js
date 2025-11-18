require('dotenv').config({ debug: true, override: true });const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB using MONGO_URI from .env
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  joinedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
});

const groupSchema = new mongoose.Schema({
  name: String,
  inviteCode: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const eventSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);
const Event = mongoose.model('Event', eventSchema);

// --- ROUTES ---
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: 'Username already in use' });
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hashed });
  res.json({ message: 'User created successfully' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Invalid password' });

  const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// CREATE GROUP
app.post('/api/groups', async (req, res) => {
  const { name, userId } = req.body;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const group = await Group.create({ 
    name, 
    inviteCode, 
    creator: new mongoose.Types.ObjectId(userId), 
    members: [new mongoose.Types.ObjectId(userId)]
  });
  res.json(group);
});

// JOIN GROUP
app.post('/api/groups/join', async (req, res) => {
  const { code, userId } = req.body;
  const group = await Group.findOne({ inviteCode: code });
  if (!group) return res.status(404).json({ message: 'Invalid invite code' });

  const userObjId = new mongoose.Types.ObjectId(userId);

  if (!group.members.some(id => id.equals(userObjId))) {
    group.members.push(userObjId);
    await group.save();
  }
  res.json({ message: 'Joined group successfully', group });
});

app.post('/api/groups/leave', async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // creator can't leave if there are other members
    if (group.creator.toString() === userId && group.members.length > 1) {
      return res.status(400).json({ message: "Creator cannot leave a group with members" });
    }

    // romving user from array
    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();

    res.json({ message: "Left group successfully" });

  } catch (err) {
    console.error("Leave group error:", err);
    res.status(500).json({ message: "Error leaving group" });
  }
});

app.get('/api/groups/user/:id', async (req, res) => {
  const userId = req.params.id;
  const created = await Group.find({ creator: userId })
    .populate('members', 'username')
    .lean();

  const joined = await Group.find({ members: userId })
    .populate('members', 'username')
    .lean();

  res.json({ created, joined });
});

// CREATE EVENT
app.post('/api/events', async (req, res) => {
  try {
    const { groupId, title, description, date, userId } = req.body;

    const event = await Event.create({
      groupId,
      title,
      description,
      date,
      createdBy: new mongoose.Types.ObjectId(userId)
    });

    res.json(event);
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ message: "Server error creating event" });
  }
});

// GET EVENTS FOR A GROUP
app.get('/api/events/group/:groupId', async (req, res) => {
  try {
    const events = await Event.find({ groupId: req.params.groupId })
      .populate("createdBy", "username")
      .sort({ date: 1 });

    res.json(events);
  } catch (err) {
    console.error("Fetch events error:", err);
    res.status(500).json({ message: "Error fetching events" });
  }
});

// GET ALL EVENTS FOR A USER (MASTER PLANNER)
app.get('/api/events/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // find the groups user is in
    const groups = await Group.find({ members: userId }).select("_id");

    const groupIds = groups.map(g => g._id);

    // grab the events
    const events = await Event.find({ groupId: { $in: groupIds } })
      .populate("createdBy", "username")
      .populate("groupId", "name")
      .sort({ date: 1 });

    res.json(events);
  } catch (err) {
    console.error("Master planner fetch error:", err);
    res.status(500).json({ message: "Error fetching planner events" });
  }
});


// DELETE EVENT
app.delete('/api/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ message: "Error deleting event" });
  }
});


// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
