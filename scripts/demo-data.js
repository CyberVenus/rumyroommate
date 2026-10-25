const bcrypt = require("bcrypt");

const password = "DemoPass1!";
const users = [
  { netid: "demo1@rutgers.edu", realname: "Demo Alex", major: "Computer Science" },
  { netid: "demo2@rutgers.edu", realname: "Demo Jordan", major: "Engineering" },
  { netid: "demo3@rutgers.edu", realname: "Demo Taylor", major: "Biology" },
];

// These reserved identities and their related rows are the entire reset boundary.
async function seedDemo(pool, { reset = false, environment = process.env.NODE_ENV } = {}) {
  if (environment === "production") throw new Error("Demo data is disabled in production.");
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [constraints] = await conn.query(
      `SELECT DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'savedroommatelistings'
       AND CONSTRAINT_NAME = 'fk_postid_saved' AND DELETE_RULE = 'CASCADE'`,
    );
    if (!constraints.length) throw new Error("Apply migration 004 before seeding demo data.");
    const [existing] = await conn.query("SELECT userid FROM useraccounts WHERE netid IN (?) FOR UPDATE", [users.map((u) => u.netid)]);
    if (existing.length && !reset) throw new Error("Demo identities already exist. Use npm run demo:reset to replace their data.");
    if (existing.length) {
      const ids = existing.map((u) => u.userid);
      // Notifications also reference listings, but do not have cascade semantics.
      await conn.query(`DELETE FROM matchnotifications WHERE userid IN (?) OR postid IN
        (SELECT postid FROM createdroommatelistings WHERE userid IN (?))`, [ids, ids]);
      await conn.query("DELETE FROM savedroommatelistings WHERE userid IN (?)", [ids]);
      await conn.query("DELETE FROM createdroommatelistings WHERE userid IN (?)", [ids]);
      await conn.query("DELETE FROM userhabits WHERE userid IN (?)", [ids]);
      await conn.query("DELETE FROM userpreferences WHERE userid IN (?)", [ids]);
      await conn.query("DELETE FROM useraccounts WHERE userid IN (?)", [ids]);
    }
    const hash = await bcrypt.hash(password, 10);
    const ids = [];
    for (const user of users) {
      const [result] = await conn.query(
        "INSERT INTO useraccounts (netid, password, realname, age, major) VALUES (?, ?, ?, 21, ?)",
        [user.netid, hash, user.realname, user.major],
      );
      ids.push(result.insertId);
      await conn.query("INSERT INTO userhabits (userid, cleanliness, noisetolerance, smoking, drinking) VALUES (?, 7, 5, 'N', 'N')", [result.insertId]);
      await conn.query("INSERT INTO userpreferences (userid, roombudget) VALUES (?, 900)", [result.insertId]);
    }
    const posts = [];
    for (const [index, campus] of ["College Avenue", "Busch"].entries()) {
      const [result] = await conn.query(`INSERT INTO createdroommatelistings
        (userid, createtime, address, campus, roomtype, numrooms, numroommates)
        VALUES (?, '2026-01-01', ?, ?, 'Double', 2, 1)`,
      [ids[index], `${index + 1} Demo Lane (fictional)`, campus]);
      posts.push(result.insertId);
    }
    for (const [user, post] of [[1, 0], [2, 0], [2, 1]]) {
      await conn.query("INSERT INTO savedroommatelistings (userid, postid) VALUES (?, ?)", [ids[user], posts[post]]);
    }
    await conn.commit();
    return { users: ids, listings: posts };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function main() {
  require("dotenv").config();
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--reset")) throw new Error("Usage: node scripts/demo-data.js [--reset]");
  if (process.env.NODE_ENV === "production") throw new Error("Demo data is disabled in production.");
  if (!process.env.DB_NAME) throw new Error("Set DB_NAME in .env before seeding.");
  const mysql = require("mysql2/promise");
  const pool = mysql.createPool({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  try {
    await seedDemo(pool, { reset: args.includes("--reset") });
    console.log("Demo ready: 3 users, 2 listings, 3 saves.");
    console.log(`Login: ${users.map((u) => u.netid).join(", ")} | Password: ${password}`);
  } finally {
    await pool.end();
  }
}

if (require.main === module) main().catch((err) => {
  console.error(`Demo setup failed: ${err.message}`);
  process.exitCode = 1;
});

module.exports = { seedDemo, users, password };
