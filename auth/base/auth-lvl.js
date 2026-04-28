const jwt = require("jsonwebtoken");
const path = require("path");
const sqlite3 = require("sqlite3");
const fs = require("fs");
const config = require("../../config.json");

const JWT_SECRET = config.sessionSecret || "This should break";
const DB_PATH = path.join(__dirname, "auth.db");

// === INIT DATABASE ===
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "");
const db = new sqlite3.Database(DB_PATH);

// Wrap db.get in a Promise so we can await it
function dbGet(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

module.exports = async function isAuthorized(req) {
  const authHeader = req?.headers?.["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : (req.session?.token ? req.session?.token : (req.cookie?.token ? req.cookies?.token : null)); // optional cookie fallback

  const apiKeyHeader = authHeader?.startsWith("Bearer RNWTR-")
    ? authHeader.split("Bearer RNWTR-")[1]
    : null;
  const apiKeyQuery = req.query.apiKey;

  // === API KEY AUTH ===
  if (!token) {
    console.log("there is no token")
    const apiKey = apiKeyHeader || apiKeyQuery;
    if (!apiKey) return false;

    try {
      const row = await dbGet("SELECT apiKey, allowed FROM users WHERE apiKey = ?", [apiKey]);
      if (!row) return false;

      const endpoint = req.baseUrl.slice(1);
      const allowedEndpoints = row.allowed.split(",");
      if (!allowedEndpoints.includes(endpoint)) return false;

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  } else {
    const user = jwt.verify(token, JWT_SECRET); // synchronous return
      req.user = user;
      console.log(user)
      return true;
  }
  return false;
};
