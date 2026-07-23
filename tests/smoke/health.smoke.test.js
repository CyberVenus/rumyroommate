const request = require("supertest");
const { createApp } = require("../../app");

describe("API smoke tests", () => {
  it("GET /api/health/db returns ok", async () => {
    const app = createApp();
    const response = await request(app).get("/api/health/db").expect(200);

    expect(response.body).toHaveProperty("ok", true);
    expect(Array.isArray(response.body.tables)).toBe(true);
  });
});
