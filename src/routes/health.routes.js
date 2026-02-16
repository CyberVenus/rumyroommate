const express = require("express");
const { getPool } = require("../config/db");

const router = express.Router();

router.get("/db", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SHOW TABLES");
    res.json({ ok: true, tables: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
