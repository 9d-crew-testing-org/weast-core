//const fetch = require('node-fetch');
const config = require("../../config.json");
const locations = require("../../locations");

async function getMosquito(cities) {
    const mosquitoPromises = cities.map(fetchMosquitoForCity);
    const mosquitoResults = await Promise.all(mosquitoPromises);
    
    const validMosquitoResults = mosquitoResults.filter(Boolean);
    const xmlOutput = generateXML(validMosquitoResults);    
    require("../../debug").debug("i2DG | Generated a 'mosquito' i2Message.") 
    return xmlOutput;
}

async function fetchMosquitoForCity(city) {
    const locId = String(city).split("_")[2];
    const locationFetch = await fetch(`https://api.weather.com/v3/location/point?locid=${String(city).split("_")[2]}:${String(city).split("_")[0]}:${String(city).split("_")[1]}&language=en-US&format=json&apiKey=${config.apiKey}`, {timeout:50000});
    if (!locationFetch.ok) {
        return null;
    }

    const locationInfo = await locationFetch.json();
    const { latitude, longitude, postalCode } = locationInfo.location;
    const tecci = await locations.getTecci(String(city).split("_")[2]);

    if (!tecci) {
        return null;
    }

    const mosquitoFetch = await fetch(`https://api.weather.com/v2/indices/mosquito/daily/3day?geocode=${latitude},${longitude}&language=en-US&format=xml&apiKey=${config.apiKey}`, {timeout:50000});
    if (!mosquitoFetch.ok) {
        return null;
    }

    const mosquitoData = await mosquitoFetch.text();
    return parseObservationData(mosquitoData, tecci);
}

async function parseObservationData(xmlData, tecci) {
    try {
        const final = String(xmlData).split('<daypartForecastResponse>')[1].split("</daypartForecastResponse>")[0];
        return `<MosquitoActivity id="000000000" locationKey="${tecci}" isWxScan="0">\n${final}<clientKey>${tecci}</clientKey></MosquitoActivity>`;
    } catch (error) {
        return null;
    }
}

function generateXML(observations) {
    const header = '<Data type="MosquitoActivity">';
    const footer = '</Data>';
    return header + observations.join('') + footer;
}

module.exports = getMosquito;
