const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "auth.db"));

function generateAPIKey(input) {
  return crypto.createHash("md5")
    .update(`Rainwater-API-Key-${Date.now()}-${input}-${Math.random()}`)
    .digest("hex");
}

/**
 * Gets or creates a user by username.
 * If user exists → returns API key.
 * If not → creates user with random password and returns API key.
 *
 * @param {string} username - Username to look up or create
 * @returns {Promise<string>} - The API key of the user
 */
async function checkUser(username) {
  return new Promise((resolve, reject) => {
    if (!username) return reject(new Error("Username is required."));

    // 1️⃣ Check if user exists
    db.get("SELECT apiKey FROM users WHERE apiKey = ?", [username], async (err, row) => {
      if (err) return reject(err);

      // 2️⃣ If exists → return existing API key
      if (row) {
        return resolve(true);
      } else {
        return resolve(false);
      }
    });
  });
}

module.exports = checkUser;
