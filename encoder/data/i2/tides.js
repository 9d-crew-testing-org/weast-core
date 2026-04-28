const config = require("../../config.json");
const locations = require("../../locations");
const {parseStringPromise} = require("xml2js")

async function getTides(cities) {
   //console.log(cities)
    const heatingPromises = cities.map(fetchTidesForCity);
    const heatingResults = await Promise.all(heatingPromises);
    
    const validHeatingResults = heatingResults.filter(Boolean);
    const xmlOutput = generateXML(validHeatingResults);    
    require("../../debug").debug("i2DG | Generated a 'tides' i2Message.") 
    return xmlOutput;
}

async function fetchTidesForCity(city) {
    const locIdVer = String(city).split("_")[0];
    const locIdCC = String(city).split("_")[1];
    const locIdTemp = String(city).split("_")[2];
    const l2 = locIdTemp+":"+locIdVer+":"+locIdCC; 
    const {latitude, longitude, locId} = await locations.getGeocodeFromTides(l2);

    //const { latitude, longitude, postalCode } = locationInfo.location;
    const tecci = await locations.getTides(locId);


	
    if (!tecci) {
        require("../../debug").debug("hey my grandma has died she owe me money extract soul please")
       //console.log("No TECCI for ", locId)
        return null;
    }
    const endDateUtc = (new Date() / 1) + (14 * 24 * 60 * 60 * 1000)
    const startDate = `${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, 0)}${new Date().getDate().toString().padStart(2, 0)}`
    const endDate = `${new Date(endDateUtc).getFullYear()}${(new Date(endDateUtc).getMonth()+1).toString().padStart(2, 0)}${new Date(endDateUtc).getDate().toString().padStart(2, 0)}`
    const tidesFetch = await fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/forecast/tides.xml?apiKey=${config.apiKey}&startDate=${startDate}&endDate=${endDate}`, {timeout:50000})
    
    if (!tidesFetch.ok) {
       //console.log(tidesFetch.statusCode)
        return null;
    }

    const tidesData = await tidesFetch.text();
    return parseObservationData(tidesData, tecci);
}

function formatTideTime(tideTm) {
    // tideTm looks like "2025-10-01T22:00:00-0400"
    const dt = new Date(tideTm);

    const MM = String(dt.getMonth() + 1).padStart(2, "0");
    const DD = String(dt.getDate()).padStart(2, "0");
    const YYYY = dt.getFullYear();

    const HH = String(dt.getHours()).padStart(2, "0");
    const MI = String(dt.getMinutes()).padStart(2, "0");
    const SS = String(dt.getSeconds()).padStart(2, "0");

    return `${YYYY}/${MM}/${DD} ${HH}:${MI}:${SS}`;
}

async function parseObservationData(xmlData, tecci) {
    try {
        // Parse the XML response into JS object
        const parsed = await parseStringPromise(xmlData, { explicitArray: false });

        const resp = parsed.tidesResponse;
        if (!resp || !resp.metadata || !resp.tides) {
            return null;
        }

        const meta = resp.metadata;
        const tides = Array.isArray(resp.tides.tide) ? resp.tides.tide : [resp.tides.tide];

        // Build TIHdr
        const procTm = new Date().toISOString()
            .replace(/[-:TZ]/g, "")
            .slice(0, 14); // YYYYMMDDHHMMSS

        const stationId = tecci//tides[0]?.station_id || "UNKNOWN";

        const tihdr = `
        <TIHdr>
            <language>${meta.language}</language>
            <transaction_id>rainwater-encoder-tides-forecast</transaction_id>
            <procTm>${procTm}</procTm>
            <TIstnId>${stationId}</TIstnId>
            <version>${meta.version}</version>
            <latitude>${meta.latitude}</latitude>
            <longitude>${meta.longitude}</longitude>
            <status_code>${meta.status_code}</status_code>
        </TIHdr>`;

        // Build TIData
        const tideEntries = tides.map((tide, idx) => {
            const tideTime = tide.tide_tm.replace("T", " ").replace(/-.*$/, ""); 
            // → "2025-10-01T22:00:00-0400" → "2025-10-01 22:00:00"
            const formattedTm = formatTideTime(tide.tide_tm)
            // crude conversion to YYYYMMDD HH:MM:SS

            return `
            <TIData>
                <TItdTm>${formattedTm}</TItdTm>
                <TItdTyp>${tide.tide_type}</TItdTyp>
                <TItdHght>${tide.tide_ht}</TItdHght>
            </TIData>`;
        }).join("");

        const tidata = `${tideEntries}\n`;

        return `<TIRecord id="000000000" locationKey="${tecci}" isWxScan="0">\n${tihdr}\n${tidata}\n<clientKey>${tecci}</clientKey></TIRecord>`;
    } catch (error) {
       //console.log("parseObservationData error", error);
        return null;
    }
}

function generateXML(observations) {
    const header = '<Data type="TIRecord">';
    const footer = '</Data>';
    return header + observations.join('') + footer;
}

module.exports = getTides;
