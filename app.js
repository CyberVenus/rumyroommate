const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const os = require("os");
require("dotenv").config();

const { initDb, getPool } = require("./src/config/db");
const requireAuth = require("./src/middleware/requireAuth");

//Routers
const healthRouter = require("./src/routes/health.routes");
const listingsRouter = require("./src/routes/listings.routes");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
};

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.internal || interface.family !== "IPv4") {
        continue;
      }
      return interface.address;
    }
  }
  return "localhost";
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

app.use("/api/health", healthRouter);
app.use("/api", listingsRouter);
// function validateNetId(netId) {
//   const netIdRegex = /^[a-zA-Z0-9._%+-]+@(?:scarletmail\.)?rutgers\.edu$/;
//   return netIdRegex.test(netId);
// }

function validateNetId(email) {
  if (typeof email !== "string") return false;

  const trimmed = email.trim();

  // basic safety limits (RFC allows 254 total; 320 gives you breathing room)
  if (trimmed.length < 3 || trimmed.length > 254) return false;

  // reasonably permissive email pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  return emailRegex.test(trimmed);
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "frontpage.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "profile.html"));
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/create-listing", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.sendFile(path.join(__dirname, "views", "createlisting.html"));
});

// Serve preferences page
app.get("/preferences", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.sendFile(path.join(__dirname, "views", "preferences.html"));
});
// API endpoints
app.post("/api/register", async (req, res) => {
  const {
    netid,
    password,
    realname = null,
    age = null,

    // optional account/profile fields
    gender,
    ethnicity,
    religion,
    major,

    // optional roommate preference fields
    prefgender,
    prefrace,
    prefreligion,
    prefmajor,
    prefsmoking,
    prefdrinking,

    // optional habit fields
    cleanliness,
    noisetolerance,
    sleephabits,
    sleepstarttime,
    sleependtime,
    studystarttime,
    studyendtime,
    sharedstarttime,
    sharedendtime,
    smoking,
    drinking,

    // optional roommate preference numeric fields
    roombudget,
    preflowtemp,
    prefhightemp,
    prefguestfreq,
  } = req.body;

  // Basic required checks
  if (!netid || !password) {
    return res.status(400).json({ error: "NetID and password are required." });
  }

  // NetID must match Rutgers email format
  if (!validateNetId(netid)) {
    return res.status(400).json({
      error:
        "Invalid NetID format. Use @rutgers.edu or @scarletmail.rutgers.edu",
    });
  }

  // Password strength
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be 8+ chars and include uppercase, lowercase, number, and special (@$!%*?&).",
    });
  }

  // Age check (your table has CHECK age >= 18)
  const ageNum = age === "" || age === undefined ? null : Number(age);
  if (ageNum !== null && (!Number.isInteger(ageNum) || ageNum < 18)) {
    return res.status(400).json({ error: "Age must be an integer >= 18." });
  }

  let conn;
  try {
    conn = await getPool().getConnection();
    await conn.beginTransaction();

    // 1) Insert into useraccounts
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await conn.query(
      `
      INSERT INTO useraccounts (
        netid, password, realname, age, gender, ethnicity, religion, major
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        netid,
        hashedPassword,
        realname,
        ageNum,
        gender ?? null,
        ethnicity ?? null,
        religion ?? null,
        major ?? null,
      ],
    );

    const userid = result.insertId;

    // 2) Insert into userpreferences (roommate preference fields)
    await conn.query(
      `
      INSERT INTO userpreferences (
        userid, prefgender, prefrace, prefreligion, prefmajor, prefsmoking,
        prefdrinking, roombudget, preflowtemp, prefhightemp, prefguestfreq
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userid,
        prefgender ?? null,
        prefrace ?? null,
        prefreligion ?? null,
        prefmajor ?? null,
        prefsmoking ?? null,
        prefdrinking ?? null,
        roombudget ?? null,
        preflowtemp ?? null,
        prefhightemp ?? null,
        prefguestfreq ?? null,
      ],
    );

    // 3) Insert into userhabits (lifestyle fields)
    await conn.query(
      `
      INSERT INTO userhabits (
        userid, cleanliness, noisetolerance, sleephabits, sleepstarttime,
        sleependtime, studystarttime, studyendtime, sharedstarttime, sharedendtime,
        smoking, drinking
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userid,
        cleanliness ?? null,
        noisetolerance ?? null,
        sleephabits ?? null,
        sleepstarttime ?? null,
        sleependtime ?? null,
        studystarttime ?? null,
        studyendtime ?? null,
        sharedstarttime ?? null,
        sharedendtime ?? null,
        smoking ?? null,
        drinking ?? null,
      ],
    );

    await conn.commit();

    return res.status(201).json({
      message: "Registration successful!",
      userid,
      netid,
    });
  } catch (error) {
    if (conn) await conn.rollback();

    // Duplicate NetID
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "NetID already registered." });
    }

    console.error("Registration error:", error);
    return res.status(500).json({ error: "Error during registration." });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/api/login", async (req, res) => {
  // 1️⃣ Extract credentials sent from frontend
  const { netid, password } = req.body;

  // 2️⃣ Basic validation (avoid unnecessary DB query)
  if (!netid || !password) {
    return res.status(400).json({
      error: "NetID and password are required.",
    });
  }

  let connection; // declare outside so we can release in finally

  try {
    // 3️⃣ Get a connection from the MySQL pool
    connection = await getPool().getConnection();

    // 4️⃣ Query the user by NetID (never query by password)
    const [users] = await connection.query(
      "SELECT userid, netid, password, realname, age FROM useraccounts WHERE netid = ?",
      [netid],
    );

    // 5️⃣ If no user found → authentication fails
    if (users.length === 0) {
      return res.status(401).json({
        error: "Invalid NetID or password.",
      });
    }

    // 6️⃣ Extract the single user object
    const user = users[0];

    // 7️⃣ Compare plaintext password with hashed password in DB
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid NetID or password.",
      });
    }

    // 8️⃣ Store minimal safe user info in session (NEVER store password)
    req.session.user = {
      userid: user.userid,
      netid: user.netid,
      realname: user.realname,
      age: user.age,
    };

    // 9️⃣ Send success response back to frontend
    return res.json({
      message: "Login successful!",
      netid: user.netid,
      userid: user.userid,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Error during login.",
    });
  } finally {
    // 🔟 Always release the DB connection back to pool
    if (connection) connection.release();
  }
});

app.post("/api/update-preferences", requireAuth, async (req, res) => {
  const userid = req.session.user.userid;

  // 2️⃣ Extract grouped fields from request body
  const { personal = {}, habits = {}, roommatePreferences = {} } = req.body;

  // 3️⃣ Personal/account fields
  const gender = personal.gender ?? null;
  const ethnicity = personal.ethnicity ?? null;
  const religion = personal.religion ?? null;
  const major = personal.major ?? null;

  // 4️⃣ Roommate preference fields
  const prefgender = roommatePreferences.prefgender ?? null;
  const prefrace = roommatePreferences.prefrace ?? null;
  const prefreligion = roommatePreferences.prefreligion ?? null;
  const prefmajor = roommatePreferences.prefmajor ?? null;
  const prefsmoking = roommatePreferences.prefsmoking ?? null;
  const prefdrinking = roommatePreferences.prefdrinking ?? null;
  const roombudget = roommatePreferences.roombudget ?? null;
  const preflowtemp = roommatePreferences.preflowtemp ?? null;
  const prefhightemp = roommatePreferences.prefhightemp ?? null;
  const prefguestfreq = roommatePreferences.prefguestfreq ?? null;

  // 5️⃣ Habit fields
  const cleanliness = habits.cleanliness ?? null;
  const noisetolerance = habits.noisetolerance ?? null;
  const sleephabits = habits.sleephabits ?? null;
  const sleepstarttime = habits.sleepstarttime ?? null;
  const sleependtime = habits.sleependtime ?? null;
  const studystarttime = habits.studystarttime ?? null;
  const studyendtime = habits.studyendtime ?? null;
  const sharedstarttime = habits.sharedstarttime ?? null;
  const sharedendtime = habits.sharedendtime ?? null;
  const smoking = habits.smoking ?? null;
  const drinking = habits.drinking ?? null;

  let connection;

  try {
    connection = await getPool().getConnection();
    await connection.beginTransaction();

    // 6️⃣ Update user's own profile/account info
    await connection.query(
      `
      UPDATE useraccounts SET
        gender = ?,
        ethnicity = ?,
        religion = ?,
        major = ?
      WHERE userid = ?
      `,
      [gender, ethnicity, religion, major, userid],
    );

    // 7️⃣ Update roommate preferences
    await connection.query(
      `
      UPDATE userpreferences SET
        prefgender = ?,
        prefrace = ?,
        prefreligion = ?,
        prefmajor = ?,
        prefsmoking = ?,
        prefdrinking = ?,
        roombudget = ?,
        preflowtemp = ?,
        prefhightemp = ?,
        prefguestfreq = ?
      WHERE userid = ?
      `,
      [
        prefgender,
        prefrace,
        prefreligion,
        prefmajor,
        prefsmoking,
        prefdrinking,
        roombudget,
        preflowtemp,
        prefhightemp,
        prefguestfreq,
        userid,
      ],
    );

    // 8️⃣ Update user habits
    await connection.query(
      `
      UPDATE userhabits SET
        cleanliness = ?,
        noisetolerance = ?,
        sleephabits = ?,
        sleepstarttime = ?,
        sleependtime = ?,
        studystarttime = ?,
        studyendtime = ?,
        sharedstarttime = ?,
        sharedendtime = ?,
        smoking = ?,
        drinking = ?
      WHERE userid = ?
      `,
      [
        cleanliness,
        noisetolerance,
        sleephabits,
        sleepstarttime,
        sleependtime,
        studystarttime,
        studyendtime,
        sharedstarttime,
        sharedendtime,
        smoking,
        drinking,
        userid,
      ],
    );

    await connection.commit();
    return res.json({ message: "Preferences updated successfully." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Update preferences error:", error);
    return res.status(500).json({ error: "Failed to update preferences." });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/user-data", requireAuth, async (req, res) => {
  try {
    const { userid } = req.session.user;

    // Pull account/personal info
    const [accountRows] = await getPool().query(
      `
      SELECT userid, netid, realname, age, gender, ethnicity, religion, major
      FROM useraccounts
      WHERE userid = ?
      `,
      [userid],
    );

    // Pull roommate preferences
    const [prefRows] = await getPool().query(
      `
      SELECT
        prefgender,
        prefrace,
        prefreligion,
        prefmajor,
        prefsmoking,
        prefdrinking,
        roombudget,
        preflowtemp,
        prefhightemp,
        prefguestfreq
      FROM userpreferences
      WHERE userid = ?
      `,
      [userid],
    );

    // Pull habits
    const [habitRows] = await getPool().query(
      `
      SELECT
        cleanliness,
        noisetolerance,
        sleephabits,
        sleepstarttime,
        sleependtime,
        studystarttime,
        studyendtime,
        sharedstarttime,
        sharedendtime,
        smoking,
        drinking
      FROM userhabits
      WHERE userid = ?
      `,
      [userid],
    );

    const a = accountRows[0] || {};
    const p = prefRows[0] || {};
    const h = habitRows[0] || {};

    return res.json({
      userid: a.userid ?? userid,
      netid: a.netid ?? null,
      realname: a.realname ?? null,
      age: a.age ?? null,

      personal: {
        gender: a.gender ?? null,
        ethnicity: a.ethnicity ?? null,
        religion: a.religion ?? null,
        major: a.major ?? null,
      },

      habits: {
        cleanliness: h.cleanliness ?? null,
        noisetolerance: h.noisetolerance ?? null,
        sleephabits: h.sleephabits ?? null,
        sleepstarttime: h.sleepstarttime ?? null,
        sleependtime: h.sleependtime ?? null,
        studystarttime: h.studystarttime ?? null,
        studyendtime: h.studyendtime ?? null,
        sharedstarttime: h.sharedstarttime ?? null,
        sharedendtime: h.sharedendtime ?? null,
        smoking: h.smoking ?? null,
        drinking: h.drinking ?? null,
      },

      roommatePreferences: {
        prefgender: p.prefgender ?? null,
        prefrace: p.prefrace ?? null,
        prefreligion: p.prefreligion ?? null,
        prefmajor: p.prefmajor ?? null,
        prefsmoking: p.prefsmoking ?? null,
        prefdrinking: p.prefdrinking ?? null,
        roombudget: p.roombudget ?? null,
        preflowtemp: p.preflowtemp ?? null,
        prefhightemp: p.prefhightemp ?? null,
        prefguestfreq: p.prefguestfreq ?? null,
      },
    });
  } catch (err) {
    console.error("User data fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch user data." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed." });
    }

    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    });

    return res.json({ message: "Logged out successfully." });
  });
});

// ✅ Start the server (initialize db, then listen)
initDb(dbConfig)
  .then(() => {
    const localIP = getLocalIP();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at:`);
      console.log(`- Local: http://localhost:${PORT}`);
      console.log(`- Network: http://${localIP}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
