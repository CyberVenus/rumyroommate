const request = require("supertest");
const { createApp } = require("../../app");

describe("API smoke tests", () => {
  it("GET /api/health/db returns ok", async () => {
    const app = createApp();
    const response = await request(app).get("/api/health/db").expect(200);

    expect(Object.keys(response.body)).toEqual(["data"]);
    expect(Array.isArray(response.body.data.tables)).toBe(true);
  });
});
