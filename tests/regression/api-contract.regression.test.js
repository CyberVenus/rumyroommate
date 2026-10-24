const request = require("supertest");
const { createApp } = require("../../app");
const { getPool } = require("../../src/config/db");
const { createAndLogin } = require("../helpers/auth.helper");

const { data, error } = require("../helpers/contract.helper");

// Contract samples, not the comprehensive lifecycle suites planned for PR-014–016.
describe("PR-012 API response contract", () => {
  it("returns the documented success payload from every core endpoint", async () => {
    const app = createApp();
    const owner = request.agent(app);
    const credentials = { netid: "owner@rutgers.edu", password: "TestPass1!" };
    const registered = data(await owner.post("/api/register").send(credentials), 201);
    expect(registered).toEqual({
      message: "Registration successful!", userid: expect.any(Number), netid: credentials.netid,
    });
    expect(data(await owner.post("/api/login").send(credentials))).toEqual({
      message: "Login successful",
      user: { userid: registered.userid, netid: credentials.netid, realname: null, age: null },
    });
    expect(data(await owner.get("/api/me"))).toEqual({
      user: { userid: registered.userid, netid: credentials.netid },
    });
    expect(data(await owner.get("/api/user-data"))).toMatchObject({
      userid: registered.userid, netid: credentials.netid,
      personal: { gender: null }, habits: { smoking: null }, roommatePreferences: { roombudget: null },
    });
    expect(data(await owner.post("/api/update-preferences").send({}))).toEqual({
      message: "Preferences updated successfully.",
    });
    expect(data(await owner.get("/api/health/db"))).toEqual({ tables: expect.any(Array) });
    expect(data(await owner.get("/api/listings"))).toEqual([]);
    expect(data(await owner.get("/api/saved-listings"))).toEqual({
      message: "No saved listings found", listings: [],
    });
    expect(data(await owner.get("/api/saved-listing-ids"))).toEqual({ savedPostIds: [] });

    const created = data(await owner.post("/api/listings").send({ address: "1 College Ave" }), 201);
    expect(created).toEqual({ message: "Listing created successfully", postid: expect.any(Number) });
    const url = `/api/listings/${created.postid}`;
    expect(data(await owner.patch(url).send({ campus: "Busch" }))).toEqual({
      message: "Listing updated successfully", postid: created.postid,
    });
    const listings = data(await owner.get("/api/listings"));
    expect(listings).toHaveLength(1);
    expect(listings[0]).toEqual({
      postid: created.postid, userid: registered.userid, createtime: expect.any(String),
      address: "1 College Ave", campus: "Busch", roomnumber: null, roomtype: null,
      numrooms: null, numroommates: null, realname: null, netid: credentials.netid, major: null,
    });
    const { agent: reader } = await createAndLogin(app, { netid: "reader@rutgers.edu" });
    expect(data(await reader.post(`${url}/save`), 201)).toEqual({
      message: "Listing saved successfully", saveid: expect.any(Number),
    });
    expect(data(await reader.get("/api/saved-listings"))).toEqual({ message: "Success", listings });
    expect(data(await reader.get("/api/saved-listing-ids"))).toEqual({ savedPostIds: [created.postid] });
    expect(data(await reader.delete(`${url}/save`))).toEqual({ message: "Listing unsaved successfully" });
    expect(data(await reader.delete(`${url}/save`))).toEqual({ message: "Listing already unsaved" });
    expect(data(await owner.delete(url))).toEqual({ message: "Listing deleted successfully", postid: created.postid });
    expect(data(await owner.post("/api/logout"))).toEqual({ message: "Logged out successfully." });
    error(await owner.get("/api/me"), 401, "Not authenticated");
    expect(data(await owner.post("/api/logout"))).toEqual({ message: "Logged out successfully." });
  });

  it.each([
    ["get", "/api/me"], ["get", "/api/user-data"], ["post", "/api/update-preferences"],
    ["post", "/api/listings"], ["patch", "/api/listings/1"], ["delete", "/api/listings/1"],
    ["post", "/api/listings/1/save"], ["delete", "/api/listings/1/save"],
    ["get", "/api/saved-listings"], ["get", "/api/saved-listing-ids"],
  ])("uses the same unauthorized response for %s %s", async (method, url) => {
    error(await request(createApp())[method](url).send({}), 401, "Not authenticated");
  });

  it("uses the documented 400, 401, 403, 404 and 409 error semantics", async () => {
    const app = createApp();
    error(await request(app).post("/api/register").send({}), 400);
    error(await request(app).post("/api/login").send({}), 400);
    error(await request(app).post("/api/login").send({ netid: "absent@rutgers.edu", password: "wrong" }), 401);
    const owner = await createAndLogin(app, { netid: "owner@rutgers.edu" });
    const reader = await createAndLogin(app, { netid: "reader@rutgers.edu" });
    error(await request(app).post("/api/register").send({ netid: owner.netid, password: owner.password }), 409, "NetID already registered.");
    error(await owner.agent.post("/api/listings").send({}), 400, "Address is required");
    const { postid } = data(await owner.agent.post("/api/listings").send({ address: "1 College Ave" }), 201);
    const url = `/api/listings/${postid}`;
    error(await reader.agent.patch(url).send({ campus: "Busch" }), 403, "Forbidden");
    error(await reader.agent.delete(url), 403, "Forbidden");
    error(await owner.agent.post(`${url}/save`), 400, "You cannot save your own listing");
    data(await reader.agent.post(`${url}/save`), 201);
    error(await reader.agent.post(`${url}/save`), 409, "Listing already saved");
    error(await owner.agent.delete("/api/listings/invalid"), 400, "Invalid listing id");
    error(await owner.agent.delete("/api/listings/4294967295"), 404, "Listing not found");
    const { userid } = data(await reader.agent.get("/api/me")).user;
    for (const table of ["savedroommatelistings", "userhabits", "userpreferences", "useraccounts"]) {
      await getPool().query(`DELETE FROM ${table} WHERE userid = ?`, [userid]);
    }
    error(await reader.agent.get("/api/user-data"), 404, "User not found.");
  });

  it("keeps parser errors and unknown API routes in the JSON error contract", async () => {
    const app = createApp();
    error(await request(app).post("/api/login").type("json").send('{"netid":'), 400, "Invalid request body");
    error(await request(app).post("/api/login").send({ netid: "x".repeat(110000) }), 413, "Request body too large");
    error(await request(app).post("/api/login").set("Content-Type", "application/json; charset=iso-8859-1").send("{}"), 415);
    error(await request(app).get("/api/unknown"), 404, "API endpoint not found");
    error(await request(app).put("/api/listings").send({}), 404, "API endpoint not found");
    const page = await request(app).get("/dashboard");
    expect(page.status).toBe(302);
    expect(page.headers.location).toBe("/login");
  });

  it("returns JSON 500 errors without database details when database access fails", async () => {
    const app = createApp();
    const { agent } = await createAndLogin(app);
    const failure = new Error("private database details");
    const pool = getPool();
    const connectionSpy = jest.spyOn(pool, "getConnection").mockRejectedValue(failure);
    const querySpy = jest.spyOn(pool, "query").mockRejectedValue(failure);
    const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      for (const [method, url, body] of [
        ["get", "/api/health/db"], ["get", "/api/listings"],
        ["post", "/api/register", { netid: "failed@rutgers.edu", password: "TestPass1!" }],
        ["post", "/api/login", { netid: "failed@rutgers.edu", password: "TestPass1!" }],
        ["get", "/api/user-data"], ["post", "/api/update-preferences", {}],
        ["post", "/api/listings", { address: "1 College Ave" }],
        ["patch", "/api/listings/1", { campus: "Busch" }], ["delete", "/api/listings/1"],
        ["post", "/api/listings/1/save"], ["delete", "/api/listings/1/save"],
        ["get", "/api/saved-listings"], ["get", "/api/saved-listing-ids"],
      ]) {
        const response = await agent[method](url).send(body);
        error(response, 500);
        expect(response.body.error).not.toContain(failure.message);
      }
    } finally {
      connectionSpy.mockRestore();
      querySpy.mockRestore();
      logSpy.mockRestore();
    }
  });
});
