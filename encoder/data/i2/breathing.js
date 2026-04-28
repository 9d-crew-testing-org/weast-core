//const fetch = require('node-fetch');
const config = require("../../config.json");
const locations = require("../../locations");

async function getBreathing(cities) {
    const breatingPromises = cities.map(fetchBreathingForCity);
    const breatingResults = await Promise.all(breatingPromises);
    
    const validBreatingResults = breatingResults.filter(Boolean);
    const xmlOutput = generateXML(validBreatingResults);    
    require("../../debug").debug("i2DG | Generated a 'breathing' i2Message.") 
    return xmlOutput;
}

async function fetchBreathingForCity(city) {
    const locId = String(city).split("_")[2];
    require("../../debug").debug("point lookup")
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
    require("../../debug").debug("data lookup")
    const breathingFetch = await fetch(`https://api.weather.com/v2/indices/breathing/daypart/3day?geocode=${latitude},${longitude}&language=en-US&format=xml&apiKey=${config.apiKey}`, {timeout:50000});
    
    if (!breathingFetch.ok) {
        return null;
    }

    const breathingData = await breathingFetch.text();
    return parseObservationData(breathingData, tecci);
}

async function parseObservationData(xmlData, tecci) {
    try {
        const final = String(xmlData).split('<daypartForecastResponse>')[1].split("</daypartForecastResponse>")[0];
        return `<Breathing id="000000000" locationKey="${tecci}" isWxScan="0">\n${final}<clientKey>${tecci}</clientKey></Breathing>`;
    } catch (error) {
        return null;
    }
}

function generateXML(observations) {
    const header = '<Data type="Breathing">';
    const footer = '</Data>';
    return header + observations.join('') + footer;
}

module.exports = getBreathing;
