//const fetch = require('node-fetch');
const config = require('../../config.json');
const locations = require('../../locations');
const debug = require('../../debug').debug;

async function getAqi(cities) {
    const results = await Promise.all(cities.map(fetchAqiForCity));
    const validResults = results.filter(Boolean);
    debug("i2DG | Generated a 'aqi' i2Message.");
    return wrapInDataTag(validResults);
}

async function fetchAqiForCity(cityString) {
    try {
        const location = await fetchLocationInfo(cityString);
        const postalCode = location?.location?.postalCode;
        if (!postalCode) throw new Error("Missing postalCode");

        const epa = await locations.getEpa(String(cityString).split("_")[2]);
        if (!epa) return;
        if (!epa) throw new Error("Missing EPA code", epa, String(cityString).split("_")[2]);

        const xml = await fetchAqiData(cityString);
        return parseAqiXml(xml, epa);
    } catch (error) {
       //console.error(`AQI fetch failed for city: ${cityString}`, error);
        return null;
    }
}

async function fetchLocationInfo(locId) {
    const url = `https://api.weather.com/v3/location/point?locid=${locId.split("_")[2]}:${locId.split("_")[0]}:${locId.split("_")[1]}&language=en-US&format=json&apiKey=${config.apiKey}`;
    const res = await fetch(url, {timeout:50000});
    if (!res.ok) throw new Error(`Location fetch failed: ${res.status}`);
    return await res.json();
}

async function fetchAqiData(locId) {
    const url = `https://api.weather.com/v1/location/${locId.split("_")[2]}:${locId.split("_")[0]}:${locId.split("_")[1]}/airquality.xml?language=en-US&units=e&apiKey=${config.apiKey}`;
    const res = await fetch(url, {timeout:50000});
    if(res.status == 400) return;
    if (!res.ok) throw new Error(`AQI fetch failed: ${res.status}, ${url}`);
    return await res.text();
}

function parseAqiXml(xmlData, epa) {
    try {
        const content = extractAqiContent(xmlData);
        if(!content) return;
        if (!content) throw new Error("AQI content missing");

        return `<AirQuality id="000000000" locationKey="${epa}" isWxScan="0">\n${content}<clientKey>${epa}</clientKey></AirQuality>`;
    } catch (error) {
       //console.error("Error parsing AQI XML:", error);
        return null;
    }
}

function extractAqiContent(xml) {
    if(!xml) return;
    const match = xml.match(/<response[^>]*>([\s\S]*?)<\/response>/);
    return match ? match[1].trim() : '';
}

function wrapInDataTag(entries) {
    return `<Data type="AirQuality">${entries.join('')}</Data>`;
}

module.exports = getAqi;
