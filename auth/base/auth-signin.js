const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

const config = require("../../config.json")
const DB_PATH = path.join(__dirname, "auth.db");
const JWT_SECRET = config.sessionSecret || "Rainwater_JWT_Secret_Please_change_this_lol"; // change this in production

const db = new sqlite3.Database(DB_PATH);

async function sendStoatWebhook(payload) {
  try {
    await fetch(config.webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Stoat webhook error:", err.message);
  }
}

function getUser(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

let time = 0

async function login(usernameD, password) {
  username = String(usernameD).toLowerCase()

  if (!username || !password) {
  	await sendStoatWebhook({
  		event: "auth_login_failed",
  		username,
		password,
  		reason: "invalid_credentials",
  		ip: null, // auth layer doesn't have req object
  		timestamp: new Date().toISOString(),
  		service: "ClosedTelecom V1"
	});
  	    time = new Date() / 1
  	    return "Invalid credentials"
  };

  const user = await getUser(username);

  if (!user) {
    await sendStoatWebhook({
  		event: "auth_login_failed",
  		username,
		password,
  		reason: "invalid_credentials",
  		ip: null, // auth layer doesn't have req object
  		timestamp: new Date().toISOString(),
  		service: "ClosedTelecom V1"
	});
    time = new Date() / 1
    return "Invalid credentials"
  };
  const bcc = await bcrypt.compare(password, user.password)
  if (!bcc) {
    //if ((time + 10) < (new Date() / 1)) {
    await sendStoatWebhook({
  		event: "auth_login_failed",
  		username,
		password,
  		reason: "invalid_credentials",
  		ip: null, // auth layer doesn't have req object
  		timestamp: new Date().toISOString(),
  		service: "ClosedTelecom V1"
	});

    time = new Date() / 1
    return "Invalid credentials"
  };

  const token = jwt.sign(
    { id: user.id, username: user.username, apiKey: user.apiKey },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  await sendStoatWebhook({
  		event: "login_complete",
  		username,
  		ip: null, // auth layer doesn't have req object
  		timestamp: new Date().toISOString(),
  		service: "ClosedTelecom V1"
	});

  return `true-${token}`;
}

module.exports = { login };
