//const fetch = require('node-fetch');
const config = require("../../config.json");
const locations = require("../../locations");

async function getPollen(cities) {
    const pollenPromises = cities.map(fetchPollenForCity);
    const pollenResults = await Promise.all(pollenPromises);
    
    const validPollenResults = pollenResults.filter(Boolean);
    const xmlOutput = generateXML(validPollenResults);    
    require("../../debug").debug("i2DG | Generated a 'pollen_observations' i2Message.") 
    return xmlOutput;
}

async function fetchPollenForCity(city) {
    const locId = String(city).split("_")[2];
    const locationFetch = await fetch(`https://api.weather.com/v3/location/point?locid=${String(city).split("_")[2]}:${String(city).split("_")[0]}:${String(city).split("_")[1]}&language=en-US&format=json&apiKey=${config.apiKey}`, {timeout:50000});
    
    if (!locationFetch.ok) {
        return null;
    }

    const locationInfo = await locationFetch.json();
    const { latitude, longitude, postalCode } = locationInfo.location;
    const tecci = await locations.getPlln(String(locationInfo.location.locId).split(":")[0]);

    if (!tecci) {
        return null;
    }

    const pollenFetch = await fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/observations/pollen.xml?apiKey=${config.apiKey}`, {timeout:50000});
    
    if (!pollenFetch.ok) {
        return null;
    }

    const pollenData = await pollenFetch.text();
    return parseObservationData(pollenData, tecci);
}

async function parseObservationData(xmlData, tecci) {
    try {
        const final = String(xmlData).split('<response>')[1].split("</response>")[0];
        return `<PollenObs id="000000000" locationKey="${tecci}" isWxScan="0">\n${final}<clientKey>${tecci}</clientKey></PollenObs>`;
    } catch (error) {
        return null;
    }
}

function generateXML(observations) {
    const header = '<Data type="PollenObs">';
    const footer = '</Data>';
    return header + observations.join('') + footer;
}

module.exports = getPollen;
