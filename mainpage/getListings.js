const { getPool } = require("../src/config/db");
const { createdroommatelistings } = require("../database/sqlDatabaseSpecs");

/*
const getListings = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`SELECT * FROM ${createdroommatelistings}`);
    return res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    return res.status(503).json({ error: "Service unavailable" });
  }
};

module.exports = { getListings };

*/

async function getListings() {
  const pool = getPool();
  const [rows] = await pool.query(`SELECT * FROM ${createdroommatelistings}`);
  return rows; // ✅ returns array (empty is fine)
}

module.exports = { getListings };
