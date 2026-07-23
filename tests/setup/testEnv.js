const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(process.cwd(), ".env.test");

if (!fs.existsSync(envPath)) {
  throw new Error("Missing .env.test file. Copy .env.test.example and fill in test DB values.");
}

dotenv.config({ path: envPath });

if (process.env.NODE_ENV !== "test") {
  process.env.NODE_ENV = "test";
}

const dbName = process.env.DB_NAME || "";
if (!dbName || !dbName.toLowerCase().includes("test")) {
  throw new Error("Unsafe DB_NAME for tests. DB_NAME in .env.test must include 'test'.");
}
