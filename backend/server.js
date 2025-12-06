// server.js
require('dotenv').config({ debug: true, override: true });

const express = require('express');
const cors = require('cors');

const { connectToDatabase } = require('./db');

// Models
const User = require('./models/user');
const Group = require('./models/group');
const Event = require('./models/event');

// Services
const AuthService = require('./services/authservice');
const GroupService = require('./services/groupservice');
const EventService = require('./services/eventservice');

// Controllers
const authControllerFactory = require('./controllers/authcontroller');
const groupControllerFactory = require('./controllers/groupcontroller');
const eventControllerFactory = require('./controllers/eventcontroller');

// Routes
const authRoutesFactory = require('./routes/authroutes');
const groupRoutesFactory = require('./routes/grouproutes');
const eventRoutesFactory = require('./routes/eventroutes');

const app = express();
app.use(cors());
app.use(express.json());

// DB connection
connectToDatabase(process.env.MONGO_URI).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Build services
const authService = new AuthService(User, process.env.JWT_SECRET);
const groupService = new GroupService(Group);
const eventService = new EventService(Event, Group);

// Build controllers
const authController = authControllerFactory(authService);
const groupController = groupControllerFactory(groupService);
const eventController = eventControllerFactory(eventService);

// Mount routes
app.use('/api', authRoutesFactory(authController));          // /api/signup, /api/login
app.use('/api/groups', groupRoutesFactory(groupController)); // /api/groups/...
app.use('/api/events', eventRoutesFactory(eventController)); // /api/events/...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
