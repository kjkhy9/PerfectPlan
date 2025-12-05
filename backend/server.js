/**
 * server.js
 *
 * System Architecture Overview (MVC / Layered)
 * ------------------------------------------------
 * - Presentation Layer (View in MVC):
 *   React frontend (separate project) sends HTTP requests to this API.
 *
 * - Application / Routing Layer (Controller in MVC):
 *   Express route handlers below act as controllers that coordinate requests,
 *   enforce basic rules, and call the data layer.
 *
 * - Data Access Layer (Model in MVC):
 *   Mongoose models (User, Group, Event) below encapsulate MongoDB collections.
 */

require('dotenv').config({ debug: true, override: true });const express = require('express');

const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

// Global middleware setup
// - CORS: Allows frontend client (View) to access this backend API.
// - express.json(): Parses JSON request bodies for all controllers.
app.use(cors());
app.use(express.json());

/**
 * DATABASE CONNECTION (Infrastructure Layer)
 * -----------------------------------------
 * This connects the application to MongoDB using the MONGO_URI defined
 * in the environment variables (.env). In a layered design, this is part
 * of the infrastructure/configuration layer shared by all models.
 */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


/**
 * MONGOOSE SCHEMAS & MODELS (Model Layer / "M" in MVC)
 * ----------------------------------------------------
 * These represent the domain entities in the system:
 * - User: application user account.
 * - Group: groups that users create and join.
 * - Event: scheduled events associated with groups.
 *
 * Each schema defines the structure and relationships of data, and Mongoose
 * turns them into model classes with query and persistence methods (OOP style).
 */

// --- User Model ---
const userSchema = new mongoose.Schema({
  // Unique username that identifies a user (primary credential for login)
  username: { type: String, required: true, unique: true },
  // Hashed password stored using bcrypt (never store raw passwords)
  password: { type: String, required: true },
  // Groups created by this user (one-to-many)
  createdGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  // Groups this user has joined (many-to-many via membership array in Group)
  joinedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
});

// --- Group Model ---
const groupSchema = new mongoose.Schema({
  // Human-readable group name
  name: String,
  // Invite code users can use to join
  inviteCode: String,
  // Creator of the group
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Members of the group 
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

// --- Event Model ---
const eventSchema = new mongoose.Schema({
  // Group this event belongs to (foreign key to Group)
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  // Short title describing the event
  title: { type: String, required: true },
  // Optional extended description / notes
  description: { type: String },
  // Date and time of the event
  date: { type: Date, required: true },
  // User who created the event 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Model classes (OOP-style) that encapsulate persistence logic
const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);
const Event = mongoose.model('Event', eventSchema);

/**
 * ROUTE HANDLERS (Controllers / Application Layer)
 * ------------------------------------------------
 * These functions handle incoming HTTP requests, call the appropriate
 * model operations, and return HTTP responses.
 *
 * In a more refined Week 2/3 version, these would be moved into dedicated
 * controller modules:
 *   - controllers/authController.js
 *   - controllers/groupController.js
 *   - controllers/eventController.js
 *
 * That refactor would make it easier to unit test and reuse logic.
 */

// ====================== AUTH CONTROLLERS ======================

/**
 * POST /api/signup
 * Controller responsibility:
 * - Validate and create a new user account.
 * - Hash the password before saving.
 * - Return a success message (no token yet).
 *
 * Pattern:
 * - Controller pattern: this handler encapsulates the "sign up" use case.
 */
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  
  // Check if username is already taken 
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: 'Username already in use' });
  
  // Hash password using bcrypt
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hashed });

  res.json({ message: 'User created successfully' });
});

/**
 * POST /api/login
 * Controller responsibility:
 * - Authenticate a user with username + password.
 * - Issue a signed JWT token on success for stateless auth.
 *
 * Pattern:
 * - Uses the "Token-based Authentication" pattern via JWT.
 */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Invalid password' });

  // JWT payload acts as a lightweight session
  const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// ====================== GROUP CONTROLLERS ======================

/**
 * POST /api/groups
 * Use case:
 * - Create a new group with an auto-generated invite code.
 * - Add the creator as an initial member.
 *
 * MVC Mapping:
 * - Controller: this handler.
 * - Model: Group model (and User references).
 */
app.post('/api/groups', async (req, res) => {
  const { name, userId } = req.body;
  // Simple invite code generator 
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const group = await Group.create({ 
    name, 
    inviteCode, 
    creator: new mongoose.Types.ObjectId(userId), 
    members: [new mongoose.Types.ObjectId(userId)]
  });
  res.json(group);
});

/**
 * POST /api/groups/join
 * Use case:
 * - Join an existing group using its invite code.
 * - Ensure user is not added twice.
 */
app.post('/api/groups/join', async (req, res) => {
  const { code, userId } = req.body;
  const group = await Group.findOne({ inviteCode: code });
  if (!group) return res.status(404).json({ message: 'Invalid invite code' });

  const userObjId = new mongoose.Types.ObjectId(userId);

  // Avoid duplicate membership (id.equals handles ObjectId comparison)
  if (!group.members.some(id => id.equals(userObjId))) {
    group.members.push(userObjId);
    await group.save();
  }
  res.json({ message: 'Joined group successfully', group });
});

// Avoid duplicate membership (id.equals handles ObjectId comparison)
app.post('/api/groups/leave', async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Creator can't leave if there are other members
    if (group.creator.toString() === userId && group.members.length > 1) {
      return res.status(400).json({ message: "Creator cannot leave a group with members" });
    }

    // Removing user from members array
    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();

    res.json({ message: "Left group successfully" });

  } catch (err) {
    console.error("Leave group error:", err);
    res.status(500).json({ message: "Error leaving group" });
  }
});

/**
 * GET /api/groups/user/:id
 * Use case:
 * - Fetch groups a user has created and groups they have joined.
 *
 * MVC Mapping:
 * - Controller assembles data from Group model and returns a combined view model:
 *   { created: [...], joined: [...] }.
 */
app.get('/api/groups/user/:id', async (req, res) => {
  const userId = req.params.id;
  // Groups where the user is the creator
  const created = await Group.find({ creator: userId })
    .populate('members', 'username')
    .lean();

  // Groups where the user is in the members array
  const joined = await Group.find({ members: userId })
    .populate('members', 'username')
    .lean();

  res.json({ created, joined });
});

// ====================== EVENT CONTROLLERS ======================

/**
 * POST /api/events
 * Use case:
 * - Create an event within a specific group, associated to a creator.
 *
 * Design note:
 * - All event creation logic is centralized in this controller; in Week 3
 *   we could move validation/business rules into EventService.
 */
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

/**
 * GET /api/events/group/:groupId
 * Use case:
 * - Retrieve all events for a single group, ordered by date.
 *
 * View mapping:
 * - Frontend can render these events on a group calendar/timeline.
 */
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

/**
 * GET /api/events/user/:userId
 * Use case (Master Planner):
 * - Return a consolidated list of events from all groups the user belongs to.
 *
 * Design pattern:
 * - This acts like a "facade" endpoint, hiding the details of:
 *   1) Finding user's groups.
 *   2) Fetching events for those groups.
 */
app.get('/api/events/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the groups user is a member of
    const groups = await Group.find({ members: userId }).select("_id");

    const groupIds = groups.map(g => g._id);

    // Fetch events across those groups
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

/**
 * DELETE /api/events/:id
 * Use case:
 * - Delete a single event by ID.
 *
 * Future enhancement:
 * - Add authorization check so only the event creator or group admin
 *   can delete the event.
 */
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
// Infrastructure: HTTP server entry point.
// This is the outermost layer that exposes the API to the network.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
