// server.js
require("dotenv").config({ debug: true, override: true });

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const { connectToDatabase } = require("./db");

// Models
const User = require("./models/user");
const Group = require("./models/group");
const Event = require("./models/event");
const Poll = require("./models/poll");


// Services
const AuthService = require("./services/authservice");
const GroupService = require("./services/groupservice");
const EventService = require("./services/eventservice");
const PollService = require("./services/pollservice");

// Controllers
const authControllerFactory = require("./controllers/authcontroller");
const groupControllerFactory = require("./controllers/groupcontroller");
const eventControllerFactory = require("./controllers/eventcontroller");
const pollControllerFactory = require("./controllers/pollcontroller");

// Routes
const authRoutesFactory = require("./routes/authroutes");
const groupRoutesFactory = require("./routes/grouproutes");
const eventRoutesFactory = require("./routes/eventroutes");
const pollRoutesFactory = require("./routes/pollroutes");



const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------
// CONNECT TO DATABASE
// -------------------------------
connectToDatabase(process.env.MONGO_URI).catch((err) => {
  console.error("MongoDB connection error:", err);
});

// -------------------------------
// BUILD SERVICES
// -------------------------------
const authService = new AuthService(User, process.env.JWT_SECRET);
const groupService = new GroupService(Group);
const eventService = new EventService(Event, Group);
const pollService = new PollService(Poll, Group);

// -------------------------------
// BUILD CONTROLLERS
// -------------------------------
const authController = authControllerFactory(authService);
const groupController = groupControllerFactory(groupService);
const eventController = eventControllerFactory(eventService);
const pollController = pollControllerFactory(pollService);

// -------------------------------
// MOUNT ROUTES
// -------------------------------
app.use("/api/auth", authRoutesFactory(authController)); // /api/auth/signup, /api/auth/login
app.use("/api/groups", groupRoutesFactory(groupController)); // /api/groups/...
app.use("/api/events", eventRoutesFactory(eventController)); // /api/events/...
app.use("/api/polls", pollRoutesFactory(pollController));

// -------------------------------
// SOCKET.IO WRAPPER
// -------------------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// -------------------------------
// SOCKET.IO EVENT HANDLERS
// -------------------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join real-time group room
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  // Chat feature
  socket.on("chatMessage", (msg) => {
    io.to(msg.groupId).emit("chatMessage", msg);
  });

  // Poll created
  socket.on("newPoll", (poll) => {
    io.to(poll.groupId).emit("newPoll", poll);
  });

  // Poll vote updated
  socket.on("pollUpdate", (poll) => {
    io.to(poll.groupId).emit("pollUpdate", poll);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// -------------------------------
// START SERVER
// -------------------------------
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test"){
  server.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );
}

module.exports = app;
