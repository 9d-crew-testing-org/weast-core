//const fetch = require('node-fetch');
const config = require("../../config.json");
const locations = require("../../locations");

async function getHeating(cities) {
    const heatingPromises = cities.map(fetchHeatingForCity);
    const heatingResults = await Promise.all(heatingPromises);
    
    const validHeatingResults = heatingResults.filter(Boolean);
    const xmlOutput = generateXML(validHeatingResults);    
    require("../../debug").debug("i2DG | Generated a 'heating' i2Message.") 
    return xmlOutput;
}

async function fetchHeatingForCity(city) {
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

    const heatingFetch = await fetch(`https://api.weather.com/v2/indices/heatCool/daypart/3day?geocode=${latitude},${longitude}&language=en-US&format=xml&apiKey=${config.apiKey}`, {timeout:50000});
    
    if (!heatingFetch.ok) {
        return null;
    }

    const heatingData = await heatingFetch.text();
    return parseObservationData(heatingData, tecci);
}

async function parseObservationData(xmlData, tecci) {
    try {
        const final = String(xmlData).split('<daypartForecastResponse>')[1].split("</daypartForecastResponse>")[0];
        return `<HeatingAndCooling id="000000000" locationKey="${tecci}" isWxScan="0">\n${final}<clientKey>${tecci}</clientKey></HeatingAndCooling>`;
    } catch (error) {
        return null;
    }
}

function generateXML(observations) {
    const header = '<Data type="HeatingAndCooling">';
    const footer = '</Data>';
    return header + observations.join('') + footer;
}

module.exports = getHeating;
