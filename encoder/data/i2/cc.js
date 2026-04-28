const fetch = require('node-fetch');
const xml2js = require('xml2js');
const config = require('../../config.json');
const locations = require('../../locations');
const debug = require('../../debug').debug;

const parser = new xml2js.Parser({ explicitArray: false });

async function getCurrentConditions(nearbyCities) {
    const observations = await Promise.all(
        nearbyCities.map(fetchCityWeatherData)
    );
    const validObservations = observations.filter(Boolean);
    debug("i2DG | Generated a 'current_conditions' i2Message.");
    return generateXML(validObservations);
}

function parseCityId(cityString) {
    // Format: 1_US_USMN0503
    const [locType, country, locId] = String(cityString).split('_');
    return { locType, country, locId };
}

async function fetchCityWeatherData(cityString) {
    const { locType, country, locId } = parseCityId(cityString);

    try {
        // Step 1: Get location metadata
        const locationUrl = `https://api.weather.com/v3/location/point?locid=${locId}:${locType}:${country}&language=en-US&format=json&apiKey=${config.apiKey}`;
        const locationRes = await fetch(locationUrl, {timeout:50000});
        const locationInfo = await locationRes.json();

        const postalCode = locationInfo?.location?.postalCode;
        if (!postalCode) throw new Error(`Missing postal code for ${cityString}`);

        // Step 2: Get TECCI
        const coop = await locations.getTecci(locId);
        const tecci = `T${coop}`;

        // Step 3: Get current conditions
        const ccUrl = `https://api.weather.com/v1/location/${postalCode}:4:${country}/observations/current.xml?language=en-US&units=e&apiKey=${config.apiKey}`;
        const ccRes = await fetch(ccUrl, {timeout:50000});
        const ccText = await ccRes.text();

        return await parseObservationData(ccText, tecci);
    } catch (error) {
        //console.error(`Error fetching data for ${cityString}:`, error);
        return null;
    }
}

async function parseObservationData(xmlData, tecci) {
    try {
        const result = await parser.parseStringPromise(xmlData);
        const obs = result.currentObservationsResponse?.observation;
        const metadata = result.currentObservationsResponse?.metadata || {
            language: "en-US",
            transaction_id: 1,
            version: 1,
            location_id: 1,
            units: 'e',
            expire_time_gmt: 999999999999,
            status_code: 200,
        };

        if (!obs || !obs.imperial) {
            return;
            throw new Error("Missing observation or imperial data");
        }

        const xml = `
            <CurrentObservations id="000000000" locationKey="${tecci}" isWxscan="0">
                <metadata>
                    <language>${metadata.language}</language>
                    <transaction_id>${metadata.transaction_id}</transaction_id>
                    <version>${metadata.version}</version>
                    <location_id>${metadata.location_id}</location_id>
                    <units>${metadata.units}</units>
                    <expire_time_gmt>${metadata.expire_time_gmt}</expire_time_gmt>
                    <status_code>${metadata.status_code}</status_code>
                </metadata>
                <observation>
                    ${Object.entries(obs).filter(([k]) => k !== 'imperial').map(([k, v]) => `<${k}>${v}</${k}>`).join('')}
                    <imperial>
                        ${Object.entries(obs.imperial).map(([k, v]) => `<${k}>${v}</${k}>`).join('')}
                    </imperial>
                </observation>
                <clientKey>${tecci}</clientKey>
            </CurrentObservations>
        `.replaceAll("Mist", "Damp Fog");

        return xml;
    } catch (error) {
        //console.error("Error parsing observation XML:", error);
        return null;
    }
}

function generateXML(observations) {
    return `<Data type="CurrentObservations">${observations.join('')}</Data>`;
}

module.exports = getCurrentConditions;
