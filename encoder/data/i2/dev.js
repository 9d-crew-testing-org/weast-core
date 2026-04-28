const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const lib = require("../../mqttlib");

const CACHE_FILE = path.join(__dirname, "dataCache.json");

// Load all location types from file
async function getLocations(includeAlerts = false, key = null) {
  const res = JSON.parse(await fs.readFile(path.join(__dirname, "../locations.json"), "utf-8"));
  const locations = [...res.national, ...res.general];
  if (includeAlerts && res.alerts) {
    locations.push(...res.alerts);
  }
  if(!(key == null)) {
    return res[key]
  }
  return locations;
}

// Get a hash of the locations.json file to detect changes
async function getLocationsHash() {
  const contents = await fs.readFile(path.join(__dirname, "../locations.json"), "utf-8");
  return crypto.createHash("sha256").update(contents).digest("hex");
}

const dataTypes = [
/*   {
    name: "CurrentObservations",
    locations: "general",
    store: 5,
    module: require("./cc"),
  },
  {
    name: "BERecord",
    locations: "alerts",
    store: 1,
    module: require("./alerts"),
  },*/
  {
    name: "AirQualityIndex",
    locations: "general",
    store: 5,
    module: require("./aqi"),
  },/*
  {
    name: "AchesAndPains",
    locations: "general",
    store: 5,
    module: require("./aches"),
  },
  {
    name: "Breathing",
    locations: "general",
    store: 5,
    module: require("./breathing"),
  },
  {
    name: "DailyForecast",
    locations: "general",
    store: 5,
    module: require("./daily"),
  },
  {
    name: "DrySkin",
    locations: "general",
    store: 5,
    module: require("./drySkin"),
  },
  {
    name: "HeatingAndCooling",
    locations: "general",
    store: 5,
    module: require("./heating"),
  },
  {
    name: "HourlyForecast",
    locations: "general",
    store: 5,
    module: require("./hourly"),
  },
  {
    name: "MosquitoIndex",
    locations: "general",
    store: 5,
    module: require("./mosquito"),
  },
  {
    name: "DEV-Holidays",
    locations: "general",
    store: 5,
    module: require("./holidays"),
  }, /*
  {
    name: "PollenObservations",
    locations: "general",
    store: 5,
    module: require("./pollenobs"),
  },
  {
    name: "WateringNeeds",
    locations: "general",
    store: 5,
    module: require("./watering"),
  },
  {
    name: "AirportDelays",
    locations: "general",
    store: 15,
    module: require("./airport").fetchAirportDelaysXML
  }, 
  {
    name: "DEV-TidesForecast",
    locations: "tides",
    store: 5,
    module: require("./tides")
  },*/
/*   {
    name: "TropicalAdvisory",
    locations: "general",
    store: 15,
    module: require("./tropical")
  },
  {
    name: "HurricaneTrackerRecord",
    locations: "general",
    store: 15,
    module: require("./hurricanetracker")
  }  */
];

// Cache locations globally
let locationCache = {
  general: [],
  alerts: [],
  tides: [],
};

// Load cache from disk or initialize empty
async function loadCache() {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { locationsHash: null };
  }
}

// Save cache object to disk
async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Refresh locations, invalidate cache if locations.json changed
let lastChangedTime = new Date() / 1
async function refreshLocations(cache) {
  const currentHash = await getLocationsHash();

  if (cache.locationsHash !== currentHash) {
    lastChangedTime == new Date() / 1
   //console.log("[*] Detected change in locations.json — invalidating cached data.");
    for (const type of dataTypes) {
      delete cache[type.name];
    }
    cache.locationsHash = currentHash;
    await saveCache(cache);
  }

  if (lastChangedTime < ((new Date() / 1) - (5 * 60 * 1000))) {
    lastChangedTime == new Date() / 1
   //console.log("[*] Detected change in locations.json — invalidating cached data.");
    for (const type of dataTypes) {
      delete cache[type.name];
    }
    cache.locationsHash = currentHash;
    await saveCache(cache);
  }

  locationCache.general = await getLocations();
  locationCache.alerts = await getLocations(true);
  locationCache.tides = await getLocations(false, "tides")
}

// Fetch data for one type if needed, update cache object on disk
async function fetchDataForType(type, cache) {
  //const now = Date.now();
  //const cached = cache[type.name];
  //const cacheAgeMinutes = cached ? (now - cached.lastFetched) / 60000 : Infinity;

  //if (cached && cached.data && cacheAgeMinutes < type.store) {
   // return cached.data;
  //}

  try {
   //console.log(type.locations)
    const locations = locationCache[type.locations];
    const data = await type.module(locations);
    //cache[type.name] = {
     // data,
     // lastFetched: now,
    //};
    //await saveCache(cache);
    return data;
  } catch (err) {
   //console.log(err)
   //console.log(`[-] Failed to fetch data for ${type.name}:`, err.message);
    //return cached ? cached.data : null;
  }
}

async function sendData(data, name) {
  try {
    await lib.connect();
   //console.log(data)
    fs
     await lib.sendI2Data(name, data);
        
  } catch (err) {
   //console.log("[-] Failed to connect or send data:", err.message);
  }
}

async function start() {
  const cache = await loadCache();

  await refreshLocations(cache);

  for (const type of dataTypes) {
    const data = await fetchDataForType(type);
    await sendData(data, type.name);
  }

  setInterval(async () => {
    try {
      await refreshLocations(cache);
      for (const type of dataTypes) {
        const data = await fetchDataForType(type);
        await sendData(data, type.name);
      }
      //await lib.heartbeat();
    } catch (err) {
     //console.log("[-] Error during scheduled update:", err);
    }
  }, 60 * 1000);
}

start()