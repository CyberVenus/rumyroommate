const mysql = require("mysql2/promise");

let pool;

async function initDb(dbConfig) {
  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Add error handler for the pool
  pool.on("error", (err) => {
    console.error("Unexpected database error:", err);
  });

  // Test the connection
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }

  console.log("Database initialized successfully");
}

function getPool() {
  if (!pool) throw new Error("DB not initialized yet");
  return pool;
}

module.exports = { initDb, getPool };
