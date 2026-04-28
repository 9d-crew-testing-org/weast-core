//const fetch = require('node-fetch');
const config = require("../../config.json");
const locations = require("../../locations");

async function getWatering(cities) {
    const wateringPromises = cities.map(fetchWateringForCity);
    const wateringResults = await Promise.all(wateringPromises);
    
    const validWateringResults = wateringResults.filter(Boolean);
    const xmlOutput = generateXML(validWateringResults);
    require("../../debug").debug("i2DG | Generated a 'watering' i2Message.") 
    return xmlOutput;
}

async function fetchWateringForCity(city) {
    const locId = String(city).split("_")[2];
    const locationFetch = await fetch(`https://api.weather.com/v3/location/point?locid=${String(city).split("_")[2]}:${String(city).split("_")[0]}:${String(city).split("_")[1]}&language=en-US&format=json&apiKey=${config.apiKey}`, {timeout:50000});
    
    if (!locationFetch.ok) {
        return null;
    }

    const locationInfo = await locationFetch.json();
    const { latitude, longitude, postalCode } = locationInfo.location;
    const tecci = await locations.getTecci(String(locationInfo.location.locId).split(":")[0]);

    if (!tecci) {
        return null;
    }

    const wateringFetch = await fetch(`https://api.weather.com/v2/indices/wateringNeeds/daypart/3day?geocode=${latitude},${longitude}&language=en-US&format=xml&apiKey=${config.apiKey}`, {timeout:50000});
    
    if (!wateringFetch.ok) {
        return null;
    }

    const wateringData = await wateringFetch.text();
    return parseObservationData(wateringData, tecci);
}

async function parseObservationData(xmlData, tecci) {
    try {
        const final = String(xmlData).split('<daypartForecastResponse>')[1].split("</daypartForecastResponse>")[0];
        return `<WateringNeeds id="000000000" locationKey="${tecci}" isWxScan="0">\n${final}<clientKey>${tecci}</clientKey></WateringNeeds>`;
    } catch (error) {
        return null;
    }
}

function generateXML(observations) {
    const header = '<Data type="WateringForecast">';
    const footer = '</Data>';
    return header + observations.join('') + footer;
}

module.exports = getWatering;
