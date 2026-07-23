require("./testEnv");

const { initDb, closeDb, getPool } = require("../../src/config/db");
const { getDbConfigFromEnv } = require("../../app");

beforeAll(async () => {
  await initDb(getDbConfigFromEnv());
});

afterEach(async () => {
  const pool = getPool();
  await pool.query("SET FOREIGN_KEY_CHECKS=0");
  await pool.query("TRUNCATE TABLE savedroommatelistings");
  await pool.query("TRUNCATE TABLE matchnotifications");
  await pool.query("TRUNCATE TABLE createdroommatelistings");
  await pool.query("TRUNCATE TABLE userhabits");
  await pool.query("TRUNCATE TABLE userpreferences");
  await pool.query("TRUNCATE TABLE useraccounts");
  await pool.query("SET FOREIGN_KEY_CHECKS=1");
});

afterAll(async () => {
  await closeDb();
});
