const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { promisify } = require("util");
const config = {apiKey: "e1f10a1e78da46f5b10a1e78da96f525"}
const debg = function(){}

const dbPath = path.resolve(__dirname, "../LFRecord.db");
const db = new sqlite3.Database(dbPath);
const dbGet = promisify(db.get.bind(db));

const locFieldCache = new Map();  // { `${field}:${locId}`: value }
const locRecordCache = new Map(); // { `${type}:${identifier}`: row }
const nearbyLocationsCache = new Map(); // { `${lat},${lon}`: nearbyLocationData }


// Utility: Title Case
function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

// Location URL Utilities
function getLocationsFromUrl(locations) {
    return locations.split(",");
}

function getAlertLocationsFromUrl(locations) {
    return locations.split(",");
}

// Generic async helper to get field by locId
async function getFieldByLocId(field, locId) {
    const cacheKey = `${field}:${locId}`;
    if (locFieldCache.has(cacheKey)) {
        return locFieldCache.get(cacheKey);
    }

    try {
        const row = await dbGet(`SELECT ${field} FROM LFRecord WHERE locId = ?`, [locId]);
        const value = row ? row[field] : null;
        locFieldCache.set(cacheKey, value);
        return value;
    } catch {
        return null;
    }
}


// Field-specific functions
const getTecci = (locId) => getFieldByLocId("coopId", locId);
const getCoop = (locId) => getFieldByLocId("coopId", locId);
const getSki = (locId) => getFieldByLocId("skiId", locId);
const getTides = (locId) => getFieldByLocId("tideId", locId);
const getPlln = (locId) => getFieldByLocId("pllnId", locId);
const getEpa = (locId) => getFieldByLocId("epaId", locId);

async function fixLocIdIfNeeded(locationData) {
    const locType = locationData.i2LocId.split("_")[0];
    if (locType !== "1") {
      const nameUrl = `https://wist.minnwx.com/api/i2/l/name/${encodeURIComponent(locationData.cityName)}/${encodeURIComponent(locationData.state)}?apiKey=4dc77e24801e8d21ea9ef72a9506ba0f`;
      debg(`i2DG | Trying WIST API for locId fix (name): ${nameUrl}`);

      let wistData;
      try {
        wistData = await fetchLocationData(nameUrl);
      } catch (e) {
        debg(`i2DG | Error during WIST /name lookup: ${e}`);
      }

      // If /name lookup failed or invalid result �^`^t try /zip lookup
      if (!wistData || !wistData.locId) {
        const zipUrl = `https://wist.minnwx.com/api/i2/l/zip/${encodeURIComponent(locationData.zip)}?apiKey=4dc77e24801e8d21ea9ef72a9506ba0f`;
        debg(`i2DG | Falling back to WIST API for locId fix (zip): ${zipUrl}`);
        try {
          wistData = await fetchLocationData(zipUrl);
        } catch (e) {
          debg(`i2DG | Error during WIST /zip lookup: ${e}`);
        }
      }

      // If either succeeded �^`^t update locId
      if (wistData && wistData.locId) {
        locationData.i2LocId = `${wistData.locType}_${wistData.cntryCd}_${wistData.locId}`;
        debg(`i2DG | Replaced i2LocId with ${locationData.i2LocId} from WIST`);
      } else {
        debg("i2DG | No valid locId found from WIST for this location");
      }
    }
  }

async function returnI2LFRecordLoc(locationType, locationIdentifier) {
    const cacheKey = `${locationType}:${JSON.stringify(locationIdentifier)}`;
    if (locRecordCache.has(cacheKey)) {
        return locRecordCache.get(cacheKey);
    }

    let query = "";
    let params = [];

    switch (locationType) {
        case "locId": {
            const parts = String(locationIdentifier).split("_");
            const locId = parts.length === 3 ? parts[2] : parts[0];
            query = `SELECT * FROM LFRecord WHERE locId = ?`;
            params = [locId];
            break;
        }
        case "locId_raw": {
            query = `SELECT * FROM LFRecord WHERE locId = ?`;
            params = [locationIdentifier];
            break;
        }
        case "name":
            query = `SELECT * FROM LFRecord WHERE prsntNm = ? AND stCd = ?`;
            params = [
                toTitleCase(locationIdentifier[0]),
                locationIdentifier[1].toUpperCase(),
            ];
            break;
        case "postal":
            query = `SELECT * FROM LFRecord WHERE zip2locId = ?`;
            params = [locationIdentifier];
            break;
        case "tecci":
            query = `SELECT * FROM LFRecord WHERE primTecci = ?`;
            params = [locationIdentifier];
            break;
        case "coop":
            query = `SELECT * FROM LFRecord WHERE coopId = ?`;
            params = [locationIdentifier];
            break;
        default:
            return {};
    }

    try {
        const row = await dbGet(query, params);
        locRecordCache.set(cacheKey, row || {});
        return row || {};
    } catch {
        return {};
    }
}


// Fetch location data from Weather API
async function fetchLocationData(url) {
    const response = await fetch(url);
    return await response.json();
}

// Convert Weather API location object to internal format
function buildLocationData(data) {
    if (data.errors) return;
    return {
        zip: data.location?.postalCode || "10001",
        state: data.location?.adminDistrictCode || "US",
        radarCities: [],
        coordinates: {
            lat: data.location.latitude,
            lon: data.location.longitude,
        },
        i2LocId: `${data.location.locId.split(":")[1]}_${data.location.locId.split(":")[2]}_${data.location.locId.split(":")[0]}`,
        cityName: data.location.city,
        county: data.location.countyId,
        zone: data.location.zoneId,
    };
}

module.exports = getSki
