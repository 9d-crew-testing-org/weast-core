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

module.exports = async function isBaseAuthenticated(req) {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : (req.session?.token ? req.session?.token : (req.cookie?.token ? req.cookies?.token : null)); // optional cookie fallback

  if (!token) {
    if(req.query.apiKey || (authHeader?.startsWith("Bearer RNWTR-"))) {
      const apiKey = req.query.apiKey || (authHeader.split("Bearer RNWTR-")[1]);
      if (!apiKey) return false;
      const row = await dbGet("SELECT apiKey, allowed FROM users WHERE apiKey = ?", [apiKey]);
      if (!row) return false;
      console.log(req.baseUrl.slice(1, req.baseUrl.length))
      return true;
    }
    return false
  }
  const user = jwt.verify(token, JWT_SECRET); // synchronous return
  req.user = user;
  return true;
};
