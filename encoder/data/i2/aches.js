//const fetch = require('node-fetch');
const xml2js = require('xml2js');
const config = require('../../config.json');
const locations = require('../../locations');
const debug = require('../../debug').debug;

async function fetchAches(cities) {
    const observations = await Promise.all(cities.map(processCity));
    const validObservations = observations.filter(Boolean);
    debug("i2DG | Generated a 'aches' i2Message.");
    return wrapInDataTag(validObservations);
}

async function processCity(cityString) {
    try {
        const locId = String(cityString).split('_')[2];
        const locationInfo = await fetchLocationInfo(cityString);
        const coordinates = [
            locationInfo?.location?.latitude,
            locationInfo?.location?.longitude
        ];

        if (!coordinates[0] || !coordinates[1]) throw new Error("Missing coordinates");

        const tecci = `T${await locations.getTecci(locId)}`;
        const achesXml = await fetchAchesData(coordinates);
        return await parseAchesXml(achesXml, tecci, coordinates);
    } catch (error) {
       //console.error(`Failed to process city ${cityString}:`, error);
        return null;
    }
}

async function fetchLocationInfo(locId) {
    const url = `https://api.weather.com/v3/location/point?locid=${locId.split("_")[2]}:${locId.split("_")[0]}:${locId.split("_")[1]}&language=en-US&format=json&apiKey=${config.apiKey}`;
    const res = await fetch(url, {timeout:50000});
    if (!res.ok) throw new Error(`Location fetch failed: ${res.status}`);
    return await res.json();
}

async function fetchAchesData([lat, lon]) {
    const url = `https://api.weather.com/v2/indices/achePain/daypart/3day?geocode=${lat},${lon}&language=en-US&format=xml&apiKey=${config.apiKey}`;
    const res = await fetch(url, {timeout:50000});
    if (!res.ok) throw new Error(`Aches data fetch failed: ${res.status}`);
    return await res.text();
}

async function parseAchesXml(xmlData, tecci, coordinates) {
    try {
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        const { metadata, achesPainsIndex12hour } = result.daypartForecastResponse || {};

        if (!achesPainsIndex12hour || !metadata) {
            throw new Error("Missing aches data or metadata");
        }

        return buildAchesXml(achesPainsIndex12hour, metadata, tecci, coordinates);
    } catch (error) {
       //console.error("Failed to parse aches XML:", error);
        return null;
    }
}

function buildAchesXml(obs, metadata, tecci, [lat, lon]) {
    return `
<AchesAndPains id="000000000" locationKey="${tecci.split("T")[1]}" isWxScan="0">
    <metadata>
        <language>${metadata.language}</language>
        <transactionId>${metadata.transactionId}</transactionId>
        <version>${metadata.version}</version>
        <latitude>${lat}</latitude>
        <longitude>${lon}</longitude>
        <expireTimeGmt>${metadata.expireTimeGmt}</expireTimeGmt>
        <statusCode>${metadata.statusCode}</statusCode>
    </metadata>
    <achesPainsIndex12hour>
        ${generateObservationTags(obs)}
    </achesPainsIndex12hour>
    <clientKey>${tecci.split("T")[1]}</clientKey>
</AchesAndPains>`;
}

function generateObservationTags(obs) {
    const tags = [
        'fcstValid', 'fcstValidLocal', 'dayInd',
        'num', 'daypartName', 'achesPainsIndex', 'achesPainsCategory'
    ];

    return tags.map(tag => {
        const values = obs[tag]?.[tag]; // Keep original structure
        if (!values) return '';

        const valueArray = Array.isArray(values) ? values : [values];

        const children = valueArray.map(v => `<${tag}>${v}</${tag}>`).join('');
        return `<${tag}>${children}</${tag}>`;
    }).join('');
}


function wrapInDataTag(contentArray) {
    return `<Data type="AchesAndPains">${contentArray.join('')}</Data>`;
}

module.exports = fetchAches;
