const fetch = require('node-fetch');
const xml2js = require('xml2js');
const config = require("../../config.json");
const locations = require("../../locations");

const parser = new xml2js.Parser({ explicitArray: false });

async function getDailyForecast(cities) {
    const forecasts = await Promise.all(cities.map(city => fetchCityForecast(city)));
    const xmlOutput = generateDailyForecastXML(forecasts);
    require("../../debug").debug("i2DG | Generated a 'daily_forecast' i2Message.") 
    return xmlOutput;
}

async function fetchCityForecast(city) {
    try {
        let country = "US"
    if((!city.startsWith("US"))) {
        country = city.split("_")[2].slice(0, 2)
    }
        const cityFetch = await fetch(`https://api.weather.com/v3/location/point?locid=${String(city).split("_")[2]}:${String(city).split("_")[0]}:${String(city).split("_")[1]}&language=en-US&format=json&apiKey=${config.apiKey}`);
        const locationInfo = await cityFetch.json();
        const postalCode = locationInfo.location.postalCode;
        const {latitude,longitude} = locationInfo.location
        const locId = String(city).split("_")[2];
        const tecci = `T${await locations.getTecci(locId)}`;
        let url = `https://api.weather.com/v1/location/${String(city).split("_")[2]}:${String(city).split("_")[0]}:${String(city).split("_")[1]}/forecast/daily/7day.xml?language=en-US&units=e&apiKey=${config.apiKey}`
        const forecastFetch = await fetch(url);
        const forecastData = await forecastFetch.text();
        return await parseDailyForecastData(forecastData, tecci);
    } catch (error) {
       //console.log(error)
        return null; 
    }
}

async function parseDailyForecastData(xmlData, tecci) {
    try {
        const result = await parser.parseStringPromise(xmlData);
        const metadata = result.dailyForecastResponse.metadata || {};
        const forecasts = result.dailyForecastResponse.forecasts.forecast || [];
        const forecastEntries = forecasts.map(forecast => formatForecast(forecast)).join('');

        return String(`
            <DailyForecast id="000000000" locationKey="${String(tecci).split("T")[1]}" isWxscan="0">
                <metadata>
                    <language>${getValue(metadata, 'language')}</language>
                    <transaction_id>${getValue(metadata, 'transaction_id')}</transaction_id>
                    <version>${getValue(metadata, 'version')}</version>
                    <location_id>${getValue(metadata, 'location_id')}</location_id>
                    <units>${getValue(metadata, 'units')}</units>
                    <expire_time_gmt>${getValue(metadata, 'expire_time_gmt')}</expire_time_gmt>
                    <status_code>${getValue(metadata, 'status_code')}</status_code>
                </metadata>
                <forecasts>${forecastEntries}</forecasts>
                <clientKey>${String(tecci).split("T")[1]}</clientKey>
            </DailyForecast>`).replaceAll("Mist", "Damp Fog");
    } catch (e) {
       //console.log(e)
        //debug(`Error parsing daily forecast for location ${tecci}: ${e.message}`);
    }
}

function formatForecast(forecast) {
    const day = forecast.day || {};
    const night = forecast.night || {};

    const isDayLong = String(forecast.day).length > 10;
    return `
        <forecast>
            <class>${getValue(forecast, 'class')}</class>
            <expire_time_gmt>${getValue(forecast, 'expire_time_gmt')}</expire_time_gmt>
            <fcst_valid>${getValue(forecast, 'fcst_valid', 0)}</fcst_valid>
            <fcst_valid_local>${getValue(forecast, 'fcst_valid_local')}</fcst_valid_local>
            <num>${getValue(forecast, 'num')}</num>
            <max_temp>${getValue(forecast, 'max_temp')}</max_temp>
            <min_temp>${getValue(forecast, 'min_temp')}</min_temp>
            <torcon>${getValue(forecast, 'torcon', '')}</torcon>
            <stormcon>${getValue(forecast, 'stormcon', '')}</stormcon>
            <blurb>${getValue(forecast, 'blurb', '')}</blurb>
            <blurb_author>${getValue(forecast, 'blurb_author', '')}</blurb_author>
            <lunar_phase_day>${getValue(forecast, 'lunar_phase_day')}</lunar_phase_day>
            <dow>${getValue(forecast, 'dow')}</dow>
            <lunar_phase>${getValue(forecast, 'lunar_phase')}</lunar_phase>
            <lunar_phase_code>${getValue(forecast, 'lunar_phase_code')}</lunar_phase_code>
            <sunrise>${getValue(forecast, 'sunrise')}</sunrise>
            <sunset>${getValue(forecast, 'sunset')}</sunset>
            <moonrise>${getValue(forecast, 'moonrise')}</moonrise>
            <moonset>${getValue(forecast, 'moonset')}</moonset>
            <qualifier_code>${getValue(forecast, 'qualifier_code', '')}</qualifier_code>
            <qualifier>${getValue(forecast, 'qualifier', '')}</qualifier>
            <narrative>${getValue(forecast, 'narrative')}</narrative>
            <qpf>${getValue(forecast, 'qpf')}</qpf>
            <snow_qpf>${getValue(forecast, 'snow_qpf')}</snow_qpf>
            <snow_range>${String(getValue(forecast, 'snow_range', '')).replace("<", "~")}</snow_range>
            <snow_phrase>${getValue(forecast, 'snow_phrase', '')}</snow_phrase>
            <snow_code>${getValue(forecast, 'snow_code', '')}</snow_code>
            <vocal_key>${getValue(forecast, 'vocal_key', '')}</vocal_key>
            ${formatDayOrNight('night', night)}
            ${formatDayOrNight('day', day)}
        </forecast>`;
}

function formatDayOrNight(period, data) {
    if(!(getValue(data, 'temp') == null)) {
        return `
        <${period}>
            <fcst_valid>${getValue(data, 'fcst_valid')}</fcst_valid>
            <fcst_valid_local>${getValue(data, 'fcst_valid_local')}</fcst_valid_local>
            <day_ind>${getValue(data, 'day_ind')}</day_ind>
            <thunder_enum>${getValue(data, 'thunder_enum')}</thunder_enum>
            <daypart_name>${getValue(data, 'daypart_name')}</daypart_name>
            <long_daypart_name>${getValue(data, 'long_daypart_name')}</long_daypart_name>
            <alt_daypart_name>${getValue(data, 'alt_daypart_name')}</alt_daypart_name>
            <thunder_enum_phrase>${getValue(data, 'thunder_enum_phrase')}</thunder_enum_phrase>
            <num>${getValue(data, 'num')}</num>
            <temp>${getValue(data, 'temp')}</temp>
            <hi>${getValue(data, 'hi')}</hi>
            <wc>${getValue(data, 'wc')}</wc>
            <pop>${getValue(data, 'pop')}</pop>
            <icon_extd>${getValue(data, 'icon_extd')}</icon_extd>
            <icon_code>${getValue(data, 'icon_code')}</icon_code>
            <wxman>${getValue(data, 'wxman')}</wxman>
            <phrase_12char>${getValue(data, 'phrase_12char')}</phrase_12char>
            <phrase_22char>${getValue(data, 'phrase_22char')}</phrase_22char>
            <phrase_32char>${getValue(data, 'phrase_32char')}</phrase_32char>
            <subphrase_pt1>${getValue(data, 'subphrase_pt1')}</subphrase_pt1>
            <subphrase_pt2>${getValue(data, 'subphrase_pt2', '')}</subphrase_pt2>
            <subphrase_pt3>${getValue(data, 'subphrase_pt3', '')}</subphrase_pt3>
            <precip_type>${getValue(data, 'precip_type')}</precip_type>
            <rh>${getValue(data, 'rh')}</rh>
            <wspd>${getValue(data, 'wspd')}</wspd>
            <wdir>${getValue(data, 'wdir')}</wdir>
            <wdir_cardinal>${getValue(data, 'wdir_cardinal')}</wdir_cardinal>
            <clds>${getValue(data, 'clds')}</clds>
            <pop_phrase>${getValue(data, 'pop_phrase', '')}</pop_phrase>
            <temp_phrase>${getValue(data, 'temp_phrase')}</temp_phrase>
            <accumulation_phrase>${getValue(data, 'accumulation_phrase', '')}</accumulation_phrase>
            <wind_phrase>${getValue(data, 'wind_phrase')}</wind_phrase>
            <shortcast>${getValue(data, 'shortcast')}</shortcast>
            <narrative>${getValue(data, 'narrative')}</narrative>
            <vocal_key>${getValue(data, 'vocal_key', '')}</vocal_key>
        </${period}>`;
    } else { return `` }
}

function getValue(obj, key, defaultValue) {
    return (obj && obj[key] !== undefined) ? obj[key] : defaultValue;
}

function generateDailyForecastXML(forecasts) {
    const header = '<Data type="DailyForecast">';
    const footer = '</Data>';
    return header + forecasts.join('') + footer;
}

module.exports = getDailyForecast