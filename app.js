const express = require("express");
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

function getDbConfigFromEnv() {
  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
  };
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const networkInterface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (networkInterface.internal || networkInterface.family !== "IPv4") {
        continue;
      }
      return networkInterface.address;
    }
  }
  return "localhost";
}

function validateNetId(email) {
  if (typeof email !== "string") return false;

  const trimmed = email.trim();

  // basic safety limits (RFC allows 254 total; 320 gives you breathing room)
  if (trimmed.length < 3 || trimmed.length > 254) return false;

  // reasonably permissive email pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  return emailRegex.test(trimmed);
}

function createApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";

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

      // 2) Insert roommate preferences (only if at least one preference field present)
      const prefProvided =
        prefgender !== undefined ||
        prefrace !== undefined ||
        prefreligion !== undefined ||
        prefmajor !== undefined ||
        prefsmoking !== undefined ||
        prefdrinking !== undefined ||
        roombudget !== undefined ||
        preflowtemp !== undefined ||
        prefhightemp !== undefined ||
        prefguestfreq !== undefined;

      if (prefProvided) {
        await conn.query(
          `
        INSERT INTO userpreferences (
          userid, prefgender, prefrace, prefreligion, prefmajor,
          prefsmoking, prefdrinking, roombudget, preflowtemp, prefhightemp, prefguestfreq
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      }

      // 3) Insert habits (only if at least one habit field present)
      const habitsProvided =
        cleanliness !== undefined ||
        noisetolerance !== undefined ||
        sleephabits !== undefined ||
        sleepstarttime !== undefined ||
        sleependtime !== undefined ||
        studystarttime !== undefined ||
        studyendtime !== undefined ||
        sharedstarttime !== undefined ||
        sharedendtime !== undefined ||
        smoking !== undefined ||
        drinking !== undefined;

      if (habitsProvided) {
        await conn.query(
          `
        INSERT INTO userhabits (
          userid, cleanliness, noisetolerance, sleephabits,
          sleepstarttime, sleependtime,
          studystarttime, studyendtime,
          sharedstarttime, sharedendtime,
          smoking, drinking
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      }

      await conn.commit();
      return res.status(201).json({ message: "User registered successfully", userid });
    } catch (err) {
      if (conn) await conn.rollback();

      if (err && err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "NetID is already registered." });
      }

      console.error("Registration error:", err);
      return res.status(500).json({ error: "Registration failed." });
    } finally {
      if (conn) conn.release();
    }
  });

  app.post("/api/login", async (req, res) => {
    const { netid, password } = req.body;

    if (!netid || !password) {
      return res.status(400).json({ error: "NetID and password are required." });
    }

    try {
      const [rows] = await getPool().query(
        "SELECT userid, netid, password, realname, age FROM useraccounts WHERE netid = ? LIMIT 1",
        [netid],
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      req.session.user = {
        userid: user.userid,
        netid: user.netid,
      };

      return res.json({
        message: "Login successful",
        user: {
          userid: user.userid,
          netid: user.netid,
          realname: user.realname,
          age: user.age,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Login failed." });
    }
  });

  app.get("/api/me", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    return res.json({ user: req.session.user });
  });

  app.get("/api/user-data", requireAuth, async (req, res) => {
    const userid = req.session.user.userid;

    try {
      // Pull account core + profile fields
      const [accountRows] = await getPool().query(
        `
      SELECT userid, netid, realname, age, gender, ethnicity, religion, major
      FROM useraccounts
      WHERE userid = ?
      `,
        [userid],
      );

      if (!accountRows.length) {
        return res.status(404).json({ error: "User not found." });
      }

      // Pull roommate prefs
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

  return app;
}

async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT || 3000);
  const dbConfig = getDbConfigFromEnv();

  await initDb(dbConfig);

  const localIP = getLocalIP();
  return app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running at:");
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Network: http://${localIP}:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

module.exports = { createApp, startServer, getDbConfigFromEnv };
