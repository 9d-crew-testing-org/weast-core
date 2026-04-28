const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");
const crypto = require("crypto");

const db = new sqlite3.Database(path.join(__dirname, "auth.db"));
const [,, command, ...args] = process.argv;

if (!command) {
  console.log(`
Usage:
  node auth-cli.js add <username> <password>         Add a new user
  node auth-cli.js del <username>                    Delete a user
  node auth-cli.js list                              List all users
  node auth-cli.js passwd <username> <password>      Change password
  node auth-cli.js setallowed <username> <allowed>   Set allowed endpoints (comma-separated)
  node auth-cli.js resetkey <username>               Regenerate API key
`);
  process.exit(0);
}

switch (command) {
  case "add":
    if (args.length < 2) return console.log("Usage: add <username> <password>");
    addUser(args[0], args[1]);
    break;

  case "del":
    if (args.length < 1) return console.log("Usage: del <username>");
    deleteUser(args[0]);
    break;

  case "list":
    listUsers();
    break;

  case "passwd":
    if (args.length < 2) return console.log("Usage: passwd <username> <password>");
    changePassword(args[0], args[1]);
    break;

  case "setallowed":
    if (args.length < 2) return console.log("Usage: setallowed <username> <allowed>");
    setAllowed(args[0], args.slice(1).join(" "));
    break;

  case "resetkey":
    if (args.length < 1) return console.log("Usage: resetkey <username>");
    resetAPIKey(args[0]);
    break;

  default:
    console.log("Unknown command:", command);
    break;
}

function generateAPIKey(input) {
  return crypto.createHash('md5')
    .update(`Rainwater-API-Key-${Date.now()}-${input}-${Math.random()}`)
    .digest('hex');
}

function addUser(username, password) {
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return console.error("Hash error:", err);
    db.run(
      "INSERT INTO users (username, password, apiKey, allowed) VALUES (?, ?, ?, ?)",
      [username, hash, generateAPIKey(username), "api/wx,api/weather"],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) console.log("User already exists");
          else console.error("DB error:", err.message);
        } else {
          console.log(`User "${username}" added (ID: ${this.lastID})`);
        }
      }
    );
  });
}

function deleteUser(username) {
  db.run("DELETE FROM users WHERE username = ?", [username], function (err) {
    if (err) return console.error("DB error:", err.message);
    if (this.changes === 0) console.log("User not found");
    else console.log(`Deleted user "${username}"`);
  });
}

function listUsers() {
  db.all("SELECT id, username, apiKey, allowed FROM users", [], (err, rows) => {
    if (err) return console.error("DB error:", err.message);
    if (rows.length === 0) console.log("No users found.");
    else rows.forEach(u => {
      console.log(`${u.id}: ${u.username}\n  apiKey: ${u.apiKey}\n  allowed: ${u.allowed}\n`);
    });
  });
}

function changePassword(username, password) {
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return console.error("Hash error:", err);
    db.run("UPDATE users SET password = ? WHERE username = ?", [hash, username], function (err) {
      if (err) return console.error("DB error:", err.message);
      if (this.changes === 0) console.log("User not found");
      else console.log(`Password updated for "${username}"`);
    });
  });
}

function setAllowed(username, allowed) {
  db.run("UPDATE users SET allowed = ? WHERE username = ?", [allowed, username], function (err) {
    if (err) return console.error("DB error:", err.message);
    if (this.changes === 0) console.log("User not found");
    else console.log(`Allowed endpoints updated for "${username}" → ${allowed}`);
  });
}

function resetAPIKey(username) {
  const newKey = generateAPIKey(username);
  db.run("UPDATE users SET apiKey = ? WHERE username = ?", [newKey, username], function (err) {
    if (err) return console.error("DB error:", err.message);
    if (this.changes === 0) console.log("User not found");
    else console.log(`API key reset for "${username}" → ${newKey}`);
  });
}
