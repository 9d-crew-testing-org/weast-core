//const fetch = require('node-fetch');
const xml2js = require('xml2js');
const config = require("../../config.json");
const locations = require("../../locations");

async function getHourlyForecast(cities) {
    try {
        const forecasts = await Promise.all(cities.map(city => processCity(city)));
        const xmlOutput = generateHourlyForecastXML(forecasts);
        require("../../debug").debug("i2DG | Generated a 'hourly_forecast' i2Message.") 
        return xmlOutput
    } catch (error) {

    }
}

async function processCity(city) {
    try {
        let country = "US"
    if((!city.startsWith("US"))) {
        country = city.split("_")[2].slice(0, 2)
    }
        const cityFetch = await fetch(`https://api.weather.com/v3/location/point?locid=${city.split("_")[2]}:${city.split("_")[0]}:${city.split("_")[1]}&language=en-US&format=json&apiKey=${config.apiKey}`, {timeout:50000});
        const locationInfo = await cityFetch.json();
        const postalCode = locationInfo.location.postalCode;
        const {latitude,longitude} = locationInfo.location

        const locId = String(city).split("_")[2];
        const tecci = await locations.getTecci(locId);
        let url = `https://api.weather.com/v1/location/${city.split("_")[2]}:${city.split("_")[0]}:${city.split("_")[1]}/forecast/hourly/48hour.xml?language=en-US&units=e&apiKey=${config.apiKey}`
        const forecastFetch = await fetch(url, {timeout:50000});
        const forecastData = await forecastFetch.text();

        return parseHourlyForecastData(forecastData, tecci);
    } catch (error) {
       //console.log(error)
        return null; // Return null or handle error as needed
    }
}

async function parseHourlyForecastData(xmlData, tecci) {
    const parser = new xml2js.Parser({ explicitArray: false });
    try {
        const result = await parser.parseStringPromise(xmlData);
        const { metadata, forecasts } = result.document;
        
        const forecastEntries = forecasts.forecast.map(forecast => `
            <forecast>
                ${Object.entries(forecast).map(([key, value]) => `<${key}>${value}</${key}>`).join('')}
            </forecast>
        `).join('');

        return String(`
            <HourlyForecast id="000000000" locationKey="${tecci}" isWxscan="0">
                <metadata>
                    <language>${metadata.language}</language>
                    <transaction_id>${metadata.transaction_id}</transaction_id>
                    <version>${metadata.version}</version>
                    <location_id>${metadata.location_id}</location_id>
                    <units>${metadata.units}</units>
                    <expire_time_gmt>${metadata.expire_time_gmt}</expire_time_gmt>
                    <status_code>${metadata.status_code}</status_code>
                </metadata>
                <forecasts>${forecastEntries}</forecasts>
                <clientKey>${tecci}</clientKey>
            </HourlyForecast>`).replaceAll("Mist", "Damp Fog");
    } catch (error) {
       //console.log(`Error parsing hourly forecast data for location ${tecci}: ${error.message}`);
        return null; // Return null or handle error as needed
    }
}

function generateHourlyForecastXML(forecasts) {
    const header = '<Data type="HourlyForecast">';
    const footer = '</Data>';
    const validForecasts = forecasts.filter(Boolean).join(''); // Filter out any null forecasts
    return header + validForecasts + footer;
}

module.exports = getHourlyForecast;
