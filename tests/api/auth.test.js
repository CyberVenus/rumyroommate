const request = require("supertest");
const { createApp } = require("../../app");
const { getPool } = require("../../src/config/db");
const { createTestUser, loginAs } = require("../helpers/auth.helper");
const { data, error } = require("../helpers/contract.helper");

// Fixed identities deliberately exercise the harness's per-test database cleanup.
const credentials = { netid: "auth@rutgers.edu", password: "TestPass1!" };
const requiredMessage = "NetID and password are required.";
const emailMessage = "Invalid NetID format. Use @rutgers.edu or @scarletmail.rutgers.edu";
const passwordMessage = "Password must be 8+ chars and include uppercase, lowercase, number, and special (@$!%*?&).";

describe("PR-014 auth API", () => {
  let app;
  beforeEach(() => {
    app = createApp();
  });

  it("registers an account with 201 without starting a session, then permits login", async () => {
    const agent = request.agent(app);
    const response = await agent.post("/api/register").send(credentials);
    const registered = data(response, 201);
    expect(registered).toEqual({
      message: "Registration successful!", userid: expect.any(Number), netid: credentials.netid,
    });
    expect(registered.userid).toBeGreaterThan(0);
    expect(response.headers["set-cookie"]).toBeUndefined();
    error(await agent.get("/api/me"), 401, "Not authenticated");

    const loggedIn = await loginAs(app, credentials);
    expect(data(await loggedIn.get("/api/me"))).toEqual({
      user: { userid: registered.userid, netid: credentials.netid },
    });
  });

  it.each([
    ["missing NetID", { netid: undefined }, requiredMessage],
    ["missing password", { password: undefined }, requiredMessage],
    ["empty NetID", { netid: "" }, requiredMessage],
    ["empty password", { password: "" }, requiredMessage],
    ["malformed email", { netid: "not-an-email" }, emailMessage],
    ["non-string email", { netid: 123 }, emailMessage],
    ["short password", { password: "Aa1!" }, passwordMessage],
    ["no uppercase", { password: "testpass1!" }, passwordMessage],
    ["no lowercase", { password: "TESTPASS1!" }, passwordMessage],
    ["no number", { password: "TestPass!" }, passwordMessage],
    ["no special character", { password: "TestPass12" }, passwordMessage],
    ["underage", { age: 17 }, "Age must be an integer >= 18."],
    ["fractional age", { age: 18.5 }, "Age must be an integer >= 18."],
    ["nonnumeric age", { age: "invalid" }, "Age must be an integer >= 18."],
  ])("rejects registration with %s and leaves no account data", async (_label, overrides, message) => {
    const agent = request.agent(app);
    error(await agent.post("/api/register").send({ ...credentials, ...overrides }), 400, message);
    error(await agent.get("/api/me"), 401, "Not authenticated");
    for (const table of ["useraccounts", "userpreferences", "userhabits"]) {
      const [rows] = await getPool().query(`SELECT userid FROM ${table}`);
      expect(rows).toEqual([]);
    }
  });

  it("rejects duplicate registration with 409 and preserves the original account", async () => {
    await createTestUser(app, { ...credentials, realname: "Original", age: 20 });
    const agent = request.agent(app);
    error(await agent.post("/api/register").send({
      ...credentials, password: "ChangedPass2!", realname: "Replacement", age: 21,
    }), 409, "NetID already registered.");
    error(await agent.get("/api/me"), 401, "Not authenticated");
    const original = await loginAs(app, credentials);
    const account = data(await original.get("/api/user-data"));
    expect(account).toMatchObject({ netid: credentials.netid, realname: "Original", age: 20 });
    for (const table of ["useraccounts", "userpreferences", "userhabits"]) {
      const [rows] = await getPool().query(`SELECT userid FROM ${table}`);
      expect(rows).toEqual([{ userid: account.userid }]);
    }
    error(await agent.post("/api/login").send({ ...credentials, password: "ChangedPass2!" }), 401, "Invalid credentials.");
  });

  it.each([
    ["nullable profile", {}, { realname: null, age: null }],
    ["populated profile", { realname: "Auth User", age: 18 }, { realname: "Auth User", age: 18 }],
  ])("logs in with a %s and keeps authentication confined to that session", async (_label, profile, expected) => {
    await createTestUser(app, { ...credentials, ...profile });
    const agent = request.agent(app);
    const response = await agent.post("/api/login").send(credentials);
    const loggedIn = data(response);
    expect(loggedIn).toEqual({
      message: "Login successful",
      user: { userid: expect.any(Number), netid: credentials.netid, ...expected },
    });
    expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringMatching(/^connect\.sid=/)]));
    expect(data(await agent.get("/api/me"))).toEqual({
      user: { userid: loggedIn.user.userid, netid: credentials.netid },
    });
    error(await request(app).get("/api/me"), 401, "Not authenticated");
  });

  it.each([
    ["missing both credentials", {}, 400, requiredMessage],
    ["missing NetID", { password: credentials.password }, 400, requiredMessage],
    ["missing password", { netid: credentials.netid }, 400, requiredMessage],
    ["empty NetID", { ...credentials, netid: "" }, 400, requiredMessage],
    ["empty password", { ...credentials, password: "" }, 400, requiredMessage],
    ["unknown account", { ...credentials, netid: "absent@rutgers.edu" }, 401, "Invalid credentials."],
    ["wrong password", { ...credentials, password: "WrongPass2!" }, 401, "Invalid credentials."],
  ])("rejects login with %s without authenticating the client", async (_label, payload, status, message) => {
    await createTestUser(app, credentials);
    const agent = request.agent(app);
    const response = await agent.post("/api/login").send(payload);
    error(response, status, message);
    expect(response.headers["set-cookie"]).toBeUndefined();
    error(await agent.get("/api/me"), 401, "Not authenticated");
  });

  // All ten protected API endpoints are also covered by PR-012's shared contract suite.
  it.each(["/dashboard", "/create-listing", "/preferences"])("redirects %s without a session", async (url) => {
    const response = await request(app).get(url);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/login");
  });
});
