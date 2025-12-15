const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const Group = require("../models/group");
const User = require("../models/user");

it("guest cannot create event", async () => {
  // create owner
  const owner = await User.create({
    username: "owner",
    password: "pass",
  });

  // create guest
  const guest = await User.create({
    username: "guest",
    password: "pass",
  });

  // create group with owner + guest
  const group = await Group.create({
  name: "Test Group",
  creator: owner._id,
  members: [owner._id],
  guest: [guest._id],
  inviteCode: "INVITE123",
  guestCode: "GUEST123",
  });


  const res = await request(app)
    .post("/api/events")
    .send({
      groupId: group._id,
      title: "Test Event",
      description: "desc",
      startTime: new Date("2025-01-01T18:00:00"),
      endTime: new Date("2025-01-01T18:30:00"),
      userId: guest._id,
    });

  expect(res.statusCode).toBe(403);
});
