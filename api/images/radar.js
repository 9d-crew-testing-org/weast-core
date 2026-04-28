const schemas = require('../../schemas');
const path = require('path');
const fs = require('fs');
const express = require("express");
const app = new express();

const dirs = schemas.images_maps_data()

const isAuthenticated = require("../../auth/exp-verify")
const isAuthorized = require("../../auth/exp-auth-lvl")

async function cleanDirectories() {
  const maps = schemas.images_maps_data();
  const now = Math.round(Date.now() / 1000);

  for (const key in maps) {
    const map = maps[key];
    try {
        if(!(fs.existsSync(map.directory))) {
            fs.mkdirSync(map.directory)
        }
      const mapDirData = fs.readdirSync(map.directory);
      mapDirData.forEach((mapFileName) => {
        const baseName = parseInt(mapFileName.split('.')[0]);
        //console.log(mapFileName.split('.')[0], mapFileName, baseName, now, map.clearAfter, baseName < now - map.clearAfter)
        if (!isNaN(baseName) && baseName < now - map.clearAfter) {
          fs.rmSync(path.join(map.directory, mapFileName), { force: true });
        }
      });
    } catch (err) {
      console.warn(`Skipping ${map.directory}:`, err.message);
    }

    if (Array.isArray(map.dirsNeeded)) {
      map.dirsNeeded.forEach((neededDir) => {
        try {
            if(!(fs.existsSync(neededDir))) {
            fs.mkdirSync(neededDir)
        }
          const neededDirData = fs.readdirSync(neededDir);
          neededDirData.forEach((mapFileName) => {
            if (!mapFileName.includes('.')) return;
            const baseName = parseInt(mapFileName.split('.')[0]);
            if (!isNaN(baseName) && baseName < now - (map.clearAfter / 6)) {
              fs.rmSync(path.join(neededDir, mapFileName), { force: true });
            }
          });
        } catch (err) {
          console.warn(`Skipping ${neededDir}:`, err.message);
        }
      });
    }
  }
}

const child_process = require("child_process")
const config = require("../../config.json")

// Add this helper function above your runMapImages function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runMapImages() {
    // Set a delay (in milliseconds) between starting each script. 
    // 10 seconds (10000ms) is usually a safe buffer, but you can adjust based on your server's RAM.
    const STAGGER_DELAY = 10000; 

    for (const map in dirs) {
        console.log(`Running ${dirs[map].file} with ${config.python}`);
        
        // Execute the initial script
        child_process.exec(`cd ${path.join(__dirname, "map-scripts")} && ${config.python} ${dirs[map].file}`);

        // Set up the recurring schedule
        setInterval(() => {
            console.log(`Running ${dirs[map].file} with ${config.python} on schedule`);
            child_process.exec(`cd ${path.join(__dirname, "map-scripts")} && ${config.python} ${dirs[map].file}`);
        }, dirs[map].runEvery * 1000);

        // Wait before moving to the next map in the loop to prevent RAM spikes
        await wait(STAGGER_DELAY); 
    }
}

async function sendRawImage(req, res, next) {
    const location = req._parsedUrl.pathname.split("/")[req._parsedUrl.pathname.split("/").length - 2]
    const image = req._parsedUrl.pathname.split("/")[req._parsedUrl.pathname.split("/").length - 1]
    if(dirs[location]) {
        const info = schemas.images_maps_data()[location]
        if(fs.existsSync(path.join(info.directory, image))) {
            res.sendFile(path.join(info.directory, image))
        } else {
            res.status(400).send("This map image doesn't exist!")
        }
    } else if(location == "") {
        res.status(400).send("This map data doesn't exist!")
    } else {
        res.status(400).send("This map data doesn't exist!")
    }
}

async function sendTimestamps(req, res, next) {
    const location = req._parsedUrl.pathname.split("/")[req._parsedUrl.pathname.split("/").length - 1]
    if(dirs[location]) {
        const send = []
        schemas.images_maps_content()[location].forEach(image => {
            send.push(image.split("/")[image.split("/").length - 1].split(".")[0])
        })
        res.json(send)
    } else if(location == "") {
        const send = []
        for (const key in schemas.images_maps_data()) {
            send.push(key)
        }
        res.json(send)
    } else {
        res.status(400).send({error:"This map data doesn't exist!"})
    }
}

async function sendLatestImage(req, res, next) {
    const location = req._parsedUrl.pathname.split("/")[req._parsedUrl.pathname.split("/").length - 1]
    if(dirs[location]) {
        const send = []
        schemas.images_maps_content()[location].forEach(image => {
            send.push(image.split("/")[image.split("/").length - 1].split(".")[0])
        })
        send.reverse()
        res.sendFile(path.join(schemas.images_maps_data()[location].directory, `${send[0]}.${schemas.images_maps_data()[location].extension}`))
    } else if(location == "") {
        const send = []
        for (const key in schemas.images_maps_data()) {
            send.push(key)
        }
        res.json(send)
    } else {
        res.status(400).send({error:"This map data doesn't exist!"})
    }
}


async function sendTimestampsV2(req, res, next) {
    const location = req._parsedUrl.pathname.split("/")[req._parsedUrl.pathname.split("/").length - 1]
    if(dirs[location]) {
        const send = []
        schemas.images_maps_content()[location].forEach(image => {
            send.push(`${req.protocol}://${req.get('host')}/api/maps/raw/${location}/${image.split("/")[image.split("/").length - 1]}?apiKey=${req.query.apiKey}`)
        })
        res.json(send)
    } else if(location == "") {
        const send = []
        for (const key in schemas.images_maps_data()) {
            send.push(key)
        }
        res.json(send)
    } else {
        res.status(400).send({error:"This map data doesn't exist!"})
    }
}

async function sendDirListings(req, res, next) {
    const location = req._parsedUrl.pathname.split("/")[req._parsedUrl.pathname.split("/").length - 1]
    if(dirs[location]) {
        const send = []
        schemas.images_maps_content()[location].forEach(image => {
            send.push(image.split("/")[image.split("/").length - 1])
        })
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Weast V1 - /maps/${location}/</title>
          <style>
            @font-face {
              font-family: Exo;
              src: url("https://weast.9dcrew.org/assets/exo.ttf");
            }
            body { font-family: Exo, sans-serif; background-color: rgb(15,15,15); color: white; }
            a { text-decoration: none; color: white; }
            a:hover { text-decoration: underline; color: wheat; }
          </style>
        </head>
        <body>
          <h1>Index of /maps/${location}/</h1>
          <ul>
            ${send.map(file => `<li><a href="/api/maps/raw/${location}/${file}?apiKey=${req.query.apiKey}">${file}</a></li>`).join('')}
          </ul>
        </body>
        </html>`
        res.send(html)
    } else {
        const send = []
        for (const key in schemas.images_maps_data()) {
            send.push(key)
        }
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Weast V1 - /maps/</title>
          <style>
            @font-face {
              font-family: Exo;
              src: url("https://weast.9dcrew.org/assets/exo.ttf");
            }
            body { font-family: Exo, sans-serif; background-color: rgb(15,15,15); color: white; }
            a { text-decoration: none; color: white; }
            a:hover { text-decoration: underline; color: wheat; }
          </style>
        </head>
        <body>
          <h1>Index of /maps/</h1>
          <ul>
            ${send.map(file => `<li><a href="/api/maps/listings/${file}?apiKey=${req.query.apiKey}">${file}</a></li>`).join('')}
          </ul>
        </body>
        </html>`
        res.send(html)
    }
}

app.use("/raw/", isAuthenticated, isAuthorized, sendRawImage)
app.use("/latest/", isAuthenticated, isAuthorized, sendLatestImage)
app.use("/timestamps/", isAuthenticated, isAuthorized, sendTimestamps)
app.use("/timestamps-v2/", isAuthenticated, isAuthorized, sendTimestampsV2)
app.use("/listings/", isAuthenticated, isAuthorized, sendDirListings)

async function start() {
    console.log("Starting map image server!")
    cleanDirectories()
    runMapImages()
    setInterval(() => cleanDirectories(), 1 * 60 * 60 * 1000)
}

module.exports = {app, start}
