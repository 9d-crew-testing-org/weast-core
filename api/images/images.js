const schemas = require('../../schemas');
const path = require('path');
const fs = require('fs');
const express = require("express");
const child_process = require("child_process");
const config = require("../../config.json");

const app = new express();

const isAuthenticated = require("../../auth/exp-verify");
const isAuthorized = require("../../auth/exp-auth-lvl");

const wxRunners = schemas.images_wx_runners();
const OUTPUT_DIR = path.join(__dirname, "../../images/weather");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function cleanOutputDirectory() {
  ensureDir(OUTPUT_DIR);
  const now = Math.round(Date.now() / 1000);

  const clearAfter = 60 * 60 * 6; // 6 hours default
  const files = fs.readdirSync(OUTPUT_DIR);

  files.forEach((file) => {
    if (!file.includes(".")) return;
    const baseName = parseInt(file.split(".")[0]);
    if (!isNaN(baseName) && baseName < now - clearAfter) {
      fs.rmSync(path.join(OUTPUT_DIR, file), { force: true });
    }
  });
}

async function runWxImages() {
  ensureDir(OUTPUT_DIR);

  for (const key in wxRunners) {
    const runner = wxRunners[key];
    const scriptPath = path.join(__dirname, "image-scripts", runner.file);
    const interval = runner.runEvery * 1000;

    console.log(`Running ${runner.file} using ${config.python}`);
    //child_process.exec(`cd ${path.join(__dirname, "image-scripts")} && ${config.python} ${runner.file}`);

    setInterval(() => {
      console.log(`Scheduled run: ${runner.file}`);
      //child_process.exec(`cd ${path.join(__dirname, "image-scripts")} && ${config.python} ${runner.file}`);
    }, interval);
  }
}

async function sendRawImage(req, res) {
  const filename = req.params.filename;
  const filePath = path.join(OUTPUT_DIR, filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Image not found");
  }
}

// /api/weather/listings → list all image files
async function sendImageListings(req, res) {
  ensureDir(OUTPUT_DIR);

  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.includes(".png") || f.includes(".jpg") || f.includes(".gif") || f.includes(".tif") || f.includes(".webp"))
    .map(f => {
      const stats = fs.statSync(path.join(OUTPUT_DIR, f));
      return {
        name: f,
        mtime: stats.mtime, // last modified time
      };
    })
    // Optional: sort newest first
    .sort((a, b) => b.mtime - a.mtime);

  // Create formatter that includes timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short", // adds timezone abbreviation (e.g., CDT, PST, UTC)
  });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Rainwater V2 - /images/</title>
    <style>
      @font-face { font-family: Exo; src: url("https://wist.minnwx.com/assets/exo.ttf"); }
      body { font-family: Exo, sans-serif; background-color: rgb(15,15,15); color: white; }
      a { text-decoration: none; color: white; }
      a:hover { text-decoration: underline; color: wheat; }
      .file-list { list-style: none; padding: 0; }
      .file-item { margin-bottom: 6px; }
      .date { color: gray; font-size: 0.9em; margin-left: 10px; }
    </style>
  </head>
  <body>
    <h1>Index of /images/</h1>
    <ul class="file-list">
      ${files.map(f => `
        <li class="file-item">
          <a href="/api/images/raw/${f.name}?apiKey=${req.query.apiKey}">${f.name}</a>
          <span class="date">(${formatter.format(f.mtime)})</span>
        </li>`).join('')}
    </ul>
  </body>
  </html>`;

  res.send(html);
}



app.get("/raw/:filename", isAuthenticated, isAuthorized, sendRawImage);
app.get("/listings", isAuthenticated, isAuthorized, sendImageListings);

async function start() {
  console.log("Starting weather image server!");
  ensureDir(OUTPUT_DIR);
  //await cleanOutputDirectory();
  runWxImages();
  //setInterval(cleanOutputDirectory, 60 * 60 * 1000); // hourly cleanup
}

module.exports = { app, start };
