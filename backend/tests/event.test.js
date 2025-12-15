const request = require("supertest");
const app = require("../server");

it("guest cannot create event", async () => {
  const res = await request(app)
    .post("/api/events")
    .send({
      groupId: "fake",
      title: "Test",
      startTime: "18:00",
      endTime: "18:30",
      userId: "guestId"
    });

  expect(res.statusCode).toBe(403);
});
