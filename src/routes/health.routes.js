const express = require("express");
const { success } = require("../http/respond");
const { getPool } = require("../config/db");

const router = express.Router();

router.get("/db", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SHOW TABLES");
    success(res, { tables: rows });
  } catch (e) {
    console.error("Database health check failed:", e);
    res.status(500).json({ error: "Database health check failed" });
  }
});

module.exports = router;
