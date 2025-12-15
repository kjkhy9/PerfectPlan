const request = require("supertest");
const app = require("../server"); // export app (see note below)

describe("Auth API", () => {
  it("should signup and login a user", async () => {
    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ username: "testuser", password: "testpass" });

    expect(signup.statusCode).toBe(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "testuser", password: "testpass" });

    expect(login.statusCode).toBe(200);
    expect(login.body.token).toBeDefined();
  });
});
