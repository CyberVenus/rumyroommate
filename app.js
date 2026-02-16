const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const os = require("os");
require("dotenv").config();

const { initDb, getPool } = require("./src/config/db");

//Routers
const healthRouter = require("./src/routes/health.routes");
const listingsRouter = require("./src/routes/listings.routes");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use("/api/health", healthRouter);
app.use("/api", listingsRouter);

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
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Validate Rutgers NetID format (Email form or what?)
function validateNetId(netId) {
  const netIdRegex = /^[a-zA-Z0-9._%+-]+@(?:scarletmail\.)?rutgers\.edu$/;
  return netIdRegex.test(netId);
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

// Serve preferences page
app.get("/preferences", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "preferences.html"));
});

// API endpoints
app.post("/api/register", async (req, res) => {
  const {
    netid,
    password,
    realname = null,
    age = null,

    // optional preference fields (can be undefined/null)
    gender,
    major,
    prefrace,
    prefreligion,
    prefsmoking,
    prefdrinking,
    sleephabits,
    sleepstarttime,
    sleependtime,
    studystarttime,
    studyendtime,
    sharedstarttime,
    sharedendtime,
    roombudget,
    preflowtemp,
    prefhightemp,
    prefguestfreq,
    cleanliness,
    noisetolerance,
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
      INSERT INTO useraccounts (netid, password, realname, age)
      VALUES (?, ?, ?, ?)
      `,
      [netid, hashedPassword, realname, ageNum],
    );

    const userid = result.insertId;

    // 2) Insert into userpreferences (optional)
    // You can either:
    // A) always create a row (even empty) -> easiest future updates
    // B) only create if at least one pref was provided
    //
    // I recommend A (always create row).
    await conn.query(
      `
      INSERT INTO userpreferences (
        userid, gender, major, prefrace, prefreligion, prefsmoking, prefdrinking,
        sleephabits, sleepstarttime, sleependtime, studystarttime, studyendtime,
        sharedstarttime, sharedendtime, roombudget, preflowtemp, prefhightemp,
        prefguestfreq, cleanliness, noisetolerance
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userid,
        gender ?? null,
        major ?? null,
        prefrace ?? null,
        prefreligion ?? null,
        prefsmoking ?? null,
        prefdrinking ?? null,
        sleephabits ?? null,
        sleepstarttime ?? null,
        sleependtime ?? null,
        studystarttime ?? null,
        studyendtime ?? null,
        sharedstarttime ?? null,
        sharedendtime ?? null,
        roombudget ?? null,
        preflowtemp ?? null,
        prefhightemp ?? null,
        prefguestfreq ?? null,
        cleanliness ?? null,
        noisetolerance ?? null,
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
    connection = await pool.getConnection();

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

app.post("/api/update-preferences", async (req, res) => {
  // 1️⃣ Ensure user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const userid = req.session.user.userid;

  // 2️⃣ Extract preference fields from request body
  const {
    gender,
    major,
    prefrace,
    prefreligion,
    prefsmoking,
    prefdrinking,
    sleephabits,
    sleepstarttime,
    sleependtime,
    studystarttime,
    studyendtime,
    sharedstarttime,
    sharedendtime,
    roombudget,
    preflowtemp,
    prefhightemp,
    prefguestfreq,
    cleanliness,
    noisetolerance,
  } = req.body;

  let connection;

  try {
    connection = await pool.getConnection();

    // 3️⃣ Update all fields at once
    await connection.query(
      `
      UPDATE userpreferences SET
        gender = ?,
        major = ?,
        prefrace = ?,
        prefreligion = ?,
        prefsmoking = ?,
        prefdrinking = ?,
        sleephabits = ?,
        sleepstarttime = ?,
        sleependtime = ?,
        studystarttime = ?,
        studyendtime = ?,
        sharedstarttime = ?,
        sharedendtime = ?,
        roombudget = ?,
        preflowtemp = ?,
        prefhightemp = ?,
        prefguestfreq = ?,
        cleanliness = ?,
        noisetolerance = ?
      WHERE userid = ?
      `,
      [
        gender,
        major,
        prefrace,
        prefreligion,
        prefsmoking,
        prefdrinking,
        sleephabits,
        sleepstarttime,
        sleependtime,
        studystarttime,
        studyendtime,
        sharedstarttime,
        sharedendtime,
        roombudget,
        preflowtemp,
        prefhightemp,
        prefguestfreq,
        cleanliness,
        noisetolerance,
        userid,
      ],
    );

    return res.json({ message: "Preferences updated successfully." });
  } catch (error) {
    console.error("Update preferences error:", error);
    return res.status(500).json({ error: "Failed to update preferences." });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/user-data", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  res.json(req.session.user);
});

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully." });
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
