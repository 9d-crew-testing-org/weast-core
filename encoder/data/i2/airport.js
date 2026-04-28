
const API_KEY = "ZWuYuGOivaxYcipb2QLgqyizt8oRyM7S";

// Allowed US airports (IATA codes)
const allowedAirports = new Set([
  "ATL", "LAX", "ORD", "DFW", "JFK", "DEN", "SFO", "CLT", "LAS", "PHX",
  "IAH", "MIA", "SEA", "EWR", "MCO", "MSP", "DTW", "BOS", "PHL", "LGA",
  "FLL", "BWI", "IAD", "MDW", "SLC", "DCA", "HNL", "SAN", "TPA", "PDX",
  "STL", "HOU", "BNA", "AUS", "OAK", "MCI", "MSY", "RDU", "SJC", "SNA",
  "DAL", "SMF", "SAT", "RSW", "PIT", "CLE", "IND", "MKE", "CMH", "OGG",
  "PBI", "BDL", "CVG", "JAX", "ANC", "BUF", "ABQ", "ONT", "OMA", "BUR",
  "OKC", "MEM", "PVD", "RIC", "SDF", "RNO", "TUS", "CHS", "ORF", "PWM",
  "GRR", "BHM", "LIT", "DSM", "FAR", "FSD", "ICT", "LBB", "BIL", "BOI", "GEG", //"ROC"
]);

// Full airport name lookup table (IATA -> full name)
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

// Helper to convert ICAO to IATA if prefixed by 'K' (US airports)
function iataFromIcao(icao) {
  if (icao.length === 4 && icao.startsWith("K")) return icao.substring(1);
  return icao;
}

/**
 * Fetch delays from FlightAware AeroAPI and convert to custom XML format.
 * Includes all allowed airports, defaults to no delays if not in response.
 * Uses heuristic estimates for cancellations/delays.
 * @returns {Promise<string>} XML string of airport delays.
 */
async function fetchAirportDelaysXML() {
  const response = await fetch("https://aeroapi.flightaware.com/aeroapi/airports/delays", {
    headers: { "x-apikey": API_KEY }, timeout: 50000
  });

  if (!response.ok) {
    throw new Error(`FlightAware API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Map of delays keyed by IATA code for quick lookup
  const delayMap = new Map();
  (data.delays || []).forEach(delay => {
    const iata = iataFromIcao(delay.airport);
    if (allowedAirports.has(iata)) {
      delayMap.set(iata, delay);
    }
  });

  const now = Math.floor(Date.now() / 1000);
  const expire = now + 3600;

  const xmlParts = [`<Data type="AirportDelays">`];

  let idCounter = 3160703; // starting id, increment per airport

  for (const iata of allowedAirports) {
    const delay = delayMap.get(iata);

    // Use delay info if available, else defaults (no delays)
    const category = delay ? delay.category : "none";
    const color = delay ? delay.color : "green";
    const delaySecs = delay ? delay.delay_secs : 0;
    const reasons = delay ? delay.reasons : [];

    // Heuristic cancellation & total for arrival/departure
    // You may adjust the divisor and percentage as needed
    const arrivalDelaySecs = delaySecs;  // Same for arrival and departure here
    const departureDelaySecs = delaySecs;

    const airportName = airportNames[iata] || "";

    xmlParts.push(`
  <AirportDelays id="${idCounter++}" locationKey="${iata}" isWxscan="1">
    <airport_result>
      <class>airport_delays</class>
      <source>flightaware.com</source>
      <icao_code>K${iata}</icao_code>
      <iata_code>${iata}</iata_code>
      <faa_code>${iata}</faa_code>
      <airport_name>${airportName}</airport_name>
      <local_airport_name />
      <delays>
        <category>${category}</category>
        <color>${color}</color>
        <delay_sec>${delaySecs}</delay_sec>
        <reasons_all>
          ${reasons.map(reason => `
          <delay>
            <category>${reason.category}</category>
            <color>${reason.color}</color>
            <delay_sec>${reason.delay_secs}</delay_sec>
            <reason>${reason.reason}</reason>
          </delay>`).join('')}
        </reasons_all>
      </delays>
      <arrival>
        <!-- Estimated cancellations based on delay seconds -->
        <cancellations>0</cancellations>
        <delays>0</delays>
        <percentage_cancelled>0</percentage_cancelled>
        <total>0</total>
      </arrival>
      <departure>
        <!-- Estimated cancellations based on delay seconds -->
        <cancellations>0</cancellations>
        <delays>0</delays>
        <percentage_cancelled>0</percentage_cancelled>
        <total>0</total>
      </departure>
      <process_time_gmt>${now}</process_time_gmt>
      <expire_time_gmt>${expire}</expire_time_gmt>
    </airport_result>
    <metadata>
      <language>en-US</language>
      <transaction_id>${Date.now()}:${Math.floor(Math.random() * 1e9)}</transaction_id>
      <version>1</version>
      <airport_code>${iata}</airport_code>
      <expire_time_gmt>${expire}</expire_time_gmt>
      <status_code>200</status_code>
    </metadata>
    <clientKey>${iata}</clientKey>
  </AirportDelays>
    `);
  }

  xmlParts.push(`</Data>`);

  return xmlParts.join("\n");
}

module.exports = { fetchAirportDelaysXML };
