// current conditions rewrite
// stolen directly from i2ME!
const fetch = require("node-fetch");
const config = require("../../config.json");
const locations = require("../../locations");
const debug = require("../../debug").debug;

async function getCurrentConditions(nearbyCities) {
    debug("i2DG | Writing CurrentObservations record.");

    const results = [];

    for (const city of nearbyCities) {
        const xml = await getData(city);
        if (xml) results.push(xml);
    }

    return `<Data type="CurrentObservations">${results.join("")}</Data>`;
}


function parseCityId(cityString) {
    const [locType, country, locId] = String(cityString).split("_");
    return { locType, country, locId };
}


async function getData(cityString) {
    const { locType, country, locId } = parseCityId(cityString);

    try {
        const locationUrl =
            `https://api.weather.com/v3/location/point` +
            `?locid=${locId}:${locType}:${country}` +
            `&language=en-US&format=json&apiKey=${config.apiKey}`;

        const locationRes = await fetch(locationUrl, { timeout: 50000 });
        const locationInfo = await locationRes.json();

        const postalCode = locationInfo?.location?.postalCode;
        if (!postalCode) throw new Error("Missing postal code");

        const coop = await locations.getTecci(locId);
        const tecci = `T${coop}`;

        const fetchUrl =
            `https://api.weather.com/v1/location/` +
            `${postalCode}:4:${country}` +
            `/observations/current.xml?language=en-US&units=e&apiKey=${config.apiKey}`;

        const res = await fetch(fetchUrl, { timeout: 50000 });
        const data = await res.text();
        const newData = data.slice(67, -30);
        const i2Doc =
            `<CurrentObservations id="000000000" locationKey="${tecci}" isWxscan="0">` +
            newData +
            `<clientKey>${tecci}</clientKey>` +
            `</CurrentObservations>`;

        return i2Doc;

    } catch (err) {
        // Python silently continues on failure
        // console.error(err);
        return null;
    }
}

module.exports = getCurrentConditions;

