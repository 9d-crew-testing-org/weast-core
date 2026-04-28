const lfrecord = require("../../istar/lfrecord")

async function handleDataReq(url, json = false, timeoutMs = 5000, retryDelay = 1000, maxRetries = 25) {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, { signal: controller.signal, headers: { "x-apikey": "mTRBDG1YwVoonJLizwdx3TlArbIyzatA" } });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      return json ? await res.json() : await res.text();

    } catch (err) {
      attempts++;

      if (attempts >= maxRetries) {
        throw new Error(`Request failed after ${attempts} attempts: ${err.message}`);
      }

      console.warn(`Fetch failed (attempt ${attempts}): ${err.message}. Retrying in ${retryDelay}ms...`);
      await new Promise(r => setTimeout(r, retryDelay));
    }
  }
}

const allowedAirports = new Set([
  "ATL", "LAX", "ORD", "DFW", "JFK", "DEN", "SFO", "CLT", "LAS", "PHX", "IAH", "MIA", "SEA", "EWR", "MCO", "MSP", "DTW", "BOS", "PHL", "LGA", "FLL", "BWI", "IAD", "MDW", "SLC", "DCA", "HNL", "SAN", "TPA", "PDX", "STL", "HOU", "BNA", "AUS", "OAK", "MCI", "MSY", "RDU", "SJC", "SNA", "DAL", "SMF", "SAT", "RSW", "PIT", "CLE", "IND", "MKE", "CMH", "OGG", "PBI", "BDL", "CVG", "JAX", "ANC", "BUF", "ABQ", "ONT", "OMA", "BUR", "OKC", "MEM", "PVD", "RIC", "SDF", "RNO", "TUS", "CHS", "ORF", "PWM", "GRR", "BHM", "LIT", "DSM", "FAR", "FSD", "ICT", "LBB", "BIL", "BOI", "GEG", //"ROC"
]);

const airportNames = {
  "ATL": "Hartsfield-Jackson Atlanta International Airport",
  "LAX": "Los Angeles International Airport",
  "ORD": "Chicago O'Hare International Airport",
  "DFW": "Dallas/Fort Worth International Airport",
  "JFK": "John F. Kennedy International Airport",
  "DEN": "Denver International Airport",
  "SFO": "San Francisco International Airport",
  "CLT": "Charlotte/Douglas International Airport",
  "LAS": "McCarran International Airport",
  "PHX": "Phoenix Sky Harbor International Airport",
  "IAH": "George Bush Intercontinental Airport",
  "MIA": "Miami International Airport",
  "SEA": "Seattle-Tacoma International Airport",
  "EWR": "Newark Liberty International Airport",
  "MCO": "Orlando International Airport",
  "MSP": "Minneapolis-St. Paul International Airport",
  "DTW": "Detroit Metropolitan Wayne County Airport",
  "BOS": "Logan International Airport",
  "PHL": "Philadelphia International Airport",
  "LGA": "LaGuardia Airport",
  "FLL": "Fort Lauderdale-Hollywood International Airport",
  "BWI": "Baltimore/Washington International Thurgood Marshall Airport",
  "IAD": "Washington Dulles International Airport",
  "MDW": "Chicago Midway International Airport",
  "SLC": "Salt Lake City International Airport",
  "DCA": "Ronald Reagan Washington National Airport",
  "HNL": "Honolulu International Airport",
  "SAN": "San Diego International Airport",
  "TPA": "Tampa International Airport",
  "PDX": "Portland International Airport",
  "STL": "Lambert-St. Louis International Airport",
  "HOU": "William P. Hobby Airport",
  "BNA": "Nashville International Airport",
  "AUS": "Austin-Bergstrom International Airport",
  "OAK": "Oakland International Airport",
  "MCI": "Kansas City International Airport",
  "MSY": "Louis Armstrong New Orleans International Airport",
  "RDU": "Raleigh-Durham International Airport",
  "SJC": "Norman Y. Mineta San Jose International Airport",
  "SNA": "John Wayne Airport",
  "DAL": "Dallas Love Field Airport",
  "SMF": "Sacramento International Airport",
  "SAT": "San Antonio International Airport",
  "RSW": "Southwest Florida International Airport",
  "PIT": "Pittsburgh International Airport",
  "CLE": "Cleveland-Hopkins International Airport",
  "IND": "Indianapolis International Airport",
  "MKE": "General Mitchell International Airport",
  "CMH": "Port Columbus International Airport",
  "OGG": "Kahului Airport",
  "PBI": "Palm Beach International Airport",
  "BDL": "Bradley International Airport",
  "CVG": "Cincinnati/Northern Kentucky International Airport",
  "JAX": "Jacksonville International Airport",
  "ANC": "Ted Stevens Anchorage International Airport",
  "BUF": "Buffalo Niagara International Airport",
  "ABQ": "Albuquerque International Sunport Airport",
  "ONT": "Ontario International Airport",
  "OMA": "Eppley Airfield",
  "BUR": "Bob Hope Airport",
  "OKC": "Will Rogers World Airport",
  "MEM": "Memphis International Airport",
  "PVD": "T. F. Green Airport",
  "RIC": "Richmond International Airport",
  "SDF": "Louisville International Airport",
  "RNO": "Reno/Tahoe International Airport",
  "TUS": "Tucson International Airport",
  "CHS": "Charleston International Airport",
  "ORF": "Norfolk International Airport",
  "PWM": "Portland International Jetport",
  "GRR": "Gerald R. Ford International Airport",
  "BHM": "Birmingham-Shuttlesworth International Airport",
  "LIT": "Bill and Hillary Clinton National Airport",
  "DSM": "Des Moines International Airport",
  "FAR": "Hector International Airport",
  "FSD": "Joe Foss Field",
  "ICT": "Wichita Dwight D. Eisenhower National Airport",
  "LBB": "Lubbock Preston Smith International Airport",
  "BIL": "Billings Logan International Airport",
  "BOI": "Boise Airport",
  "GEG": "Spokane International Airport",
  "ROC": "Frederick Douglass Greater Rochester International Airport"
};

function iataFromIcao(icao) {
  if (icao.length === 4 && icao.startsWith("K")) return icao.substring(1);
  return icao;
}


async function getData() {
    // Airport delays, just like alerts, is special.
    const data = await handleDataReq(`https://aeroapi.flightaware.com/aeroapi/airports/delays`, true)
    const delayMap = new Map();
    const res = []
    const airport = (data.delays || [])
    airport.forEach(delay => {
        const iata = iataFromIcao(delay.airport);
        if (allowedAirports.has(iata)) {
        delayMap.set(iata, delay);
        }
    });

    const now = Math.floor(Date.now() / 1000);
    const expire = now + 3600;
    for (const iata of allowedAirports) {
        const delay = delayMap.get(iata);
        if(delay) {
            const obj = delay
            obj.category = delay ? delay.category : "none";
            obj.color = delay ? delay.color : "green";
            const delaySecs = delay ? delay.delay_secs : 0;
            obj.delaySecs = delaySecs
            obj.reasons = delay ? delay.reasons : [];

            obj.arrivalDelaySecs = delaySecs;
            obj.iata = iata
            obj.expire = expire
            obj.now = now
            obj.departureDelaySecs = delaySecs;

            obj.airportName = airportNames[iata] || "";
            const i2OBJ = require("../objects/airport")(obj)
            res.push(i2OBJ)
        }
    }
    return res
}

module.exports = getData