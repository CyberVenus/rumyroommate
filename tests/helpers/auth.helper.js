const request = require("supertest");

function uniqueNetId() {
  return `testuser_${Date.now()}_${Math.floor(Math.random() * 100000)}@rutgers.edu`;
}

async function createTestUser(app, overrides = {}) {
  const netid = overrides.netid || uniqueNetId();
  const password = overrides.password || "TestPass1!";

  await request(app).post("/api/register").send({
    netid,
    password,
    ...overrides,
  });

  return { netid, password };
}

async function loginAs(app, credentials) {
  const agent = request.agent(app);
  await agent.post("/api/login").send(credentials).expect(200);
  return agent;
}

async function createAndLogin(app, overrides = {}) {
  const user = await createTestUser(app, overrides);
  const agent = await loginAs(app, user);
  return { ...user, agent };
}

module.exports = { createTestUser, loginAs, createAndLogin };
