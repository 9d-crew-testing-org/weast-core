const express = require("express");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// === CONFIG ===
const config = require("../../config.json")
const DB_PATH = path.join(__dirname, "auth.db");

// === INIT DATABASE ===
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, "");
}
const db = new sqlite3.Database(DB_PATH);

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    apiKey TEXT,
    allowed TEXT
  )
`);

app.post("/verify", async (req, res) => {
  try {
    if(!req.body) { return res.status(400).send({ error: "Missing body"}) }
    if(req.body.apiKey) {
      if(!req.body.level) { return res.status(400).send({ error: "Please include a level of auth (ex. ?/i2/encoder, or api/wx)"}) }
      const auth = await require("./auth-lvl.js")({query: {apiKey: req.body.apiKey}, baseUrl: `/${req.body.level}`})
      res.json({ token: auth })
    } else {
      if(!req.body.username) { return res.status(400).send({ error: "Missing body username"}) }
      if(!req.body.password) { return res.status(400).send({ error: "Missing body password"}) }
      const { username, password } = req.body;
      const token = await require("./auth-signin").login(username, password);
      res.json({ token });
    }
  } catch (err) {
    console.log(err)
    res.status(401).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Auth server running on port ${PORT}`));
