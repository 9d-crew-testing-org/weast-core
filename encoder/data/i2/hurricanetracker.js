// tropicalAdvisory.js
// CommonJS module that fetches TWC tropical cone JSON and outputs XML in DerivedHTRecord format, sorted by severity

const API_KEY = '71f92ea9dd2f4790b92ea9dd2f779061';
const API_URL = `https://api.weather.com/v3/tropical/cone?source=default&basin=all&language=en-US&format=json&units=e&nautical=true&apiKey=${API_KEY}`;

// Get UTC time string for now + hours
function futureUTC(hours) {
    const d = new Date(Date.now() + hours * 60 * 60 * 1000);
    return d.toISOString().replace(/[-:T]/g, '').slice(0, 12);
  }

  function formatStormName(typeCode, name) {
    const map = {
      HU: 'Hurricane',
      TS: 'Tropical Storm',
      TD: 'Tropical Depression',
      PT: 'Post-Tropical Cyclone',
      ST: 'Subtropical Storm',
      SD: 'Subtropical Depression',
      EX: 'Extratropical Cyclone',
      TY: 'Typhoon',
      STY: 'Super Typhoon'
    };
    const prefix = map[typeCode] || 'Storm';
    return `${prefix} ${name}`;
  }

  
async function getTropicalAdvisoryXML() {
  const res = await fetch(API_URL);
  const data = await res.json();

  // Sort storms by severity (category → wind speed)
  const storms = data.features
    .map(f => ({
      ...f,
      severity: getCategory(f.properties.currentPosition?.maximumSustainedWind || 0)
    }))
    .sort((a, b) => {
      if (b.severity !== a.severity) {
        return b.severity - a.severity; // Higher category first
      }
      const wa = a.properties.currentPosition?.maximumSustainedWind || 0;
      const wb = b.properties.currentPosition?.maximumSustainedWind || 0;
      return wb - wa; // Higher wind speed first if category equal
    });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Data type="DerivedHTRecord">\n';

  storms.forEach((feature, idx) => {
    const p = feature.properties;
    const c = p.currentPosition || {};
    const near = c.nearbyLocation || [];

    // Advisory local time pieces
    let advDyLcl = '';
    let advMnthLcl = '';
    let advTmLcl = '';
    let advTzAbbrv = p.advisoryDateTimeZoneAbbreviation || '';

    try {
      const dt = new Date(p.advisoryDateTime);
      advDyLcl = dt.toLocaleDateString('en-US', { weekday: 'long' });
      advMnthLcl = dt.toLocaleDateString('en-US', { month: 'long' });
      advTmLcl = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {}

    xml += `  <DerivedHTRecord locationKey="${p.stormId}" id="0">\n`;
    xml += `    <index>${idx}</index>\n`;
    xml += '    <HTHdr>\n';
    xml += `      <HTStrmId HTStrmNm="${/*formatStormName(p.stormTypeCode, p.stormName*/ p.stormType} ${p.stormName}">${p.stormId}</HTStrmId>\n`;
    xml += `      <HTAdvsTmUTC>${futureUTC(12)}</HTAdvsTmUTC>\n`;
    xml += '    </HTHdr>\n';
    xml += '    <HTData>\n';
    xml += `      <HTBasin>${p.basin}</HTBasin>\n`;
    xml += `      <HTCat>${feature.severity}</HTCat>\n`;
    xml += `      <HTAdvsTmLcl HTDyLcl="${advDyLcl}" HTMnthLcl="${advMnthLcl}" HTTmLcl="${advTmLcl}" HTTzAbbrv="${advTzAbbrv}">${formatDate(p.advisoryDateTime)}</HTAdvsTmLcl>\n`;

    xml += `      <HTLat>${c.latitude}</HTLat>\n`;
    xml += `      <HTLatHmsphr>${c.latitudeHemisphere}</HTLatHmsphr>\n`;
    xml += `      <HTLong>${c.longitude}</HTLong>\n`;
    xml += `      <HTLongHmsphr>${c.longitudeHemisphere}</HTLongHmsphr>\n`;

    // Nearby locations (up to 2)
    for (let i = 0; i < 2; i++) {
      const loc = near[i] || {};
      xml += `      <HTDstnc${i + 1}>${loc.distance || ''}</HTDstnc${i + 1}>\n`;
      xml += `      <HTDir${i + 1}>${loc.directionCardinal || ''}</HTDir${i + 1}>\n`;
      xml += `      <HTLoc${i + 1}>${loc.locationName || ''}</HTLoc${i + 1}>\n`;
      xml += `      <HTCtyNm${i + 1}>${loc.cityName || ''}</HTCtyNm${i + 1}>\n`;
      xml += `      <HTStCd${i + 1}>${loc.stateCode || ''}</HTStCd${i + 1}>\n`;
    }

    xml += `      <HTMxWndSpdMPH>${c.maximumSustainedWind || ''}</HTMxWndSpdMPH>\n`;
    xml += `      <HTPrssrMB>${c.minimumPressure || ''}</HTPrssrMB>\n`;
    xml += `      <HTHdngDirCrdnl>${c.heading?.stormDirectionCardinal || ''}</HTHdngDirCrdnl>\n`;
    xml += `      <HTHdngSpdMPH>${c.heading?.stormSpeed || ''}</HTHdngSpdMPH>\n`;

    xml += '    </HTData>\n';
    xml += `    <clientKey>${p.stormId}</clientKey>\n`;
    xml += '  </DerivedHTRecord>\n';
  });

  xml += '</Data>\n';
  return xml;
}

// Convert wind speed (mph) → numeric category
function getCategory(wind) {
  if (wind >= 157) return 5;
  if (wind >= 130) return 4;
  if (wind >= 111) return 3;
  if (wind >= 96)  return 2;
  if (wind >= 74)  return 1;
  return 0; // Tropical Storm/Depression
}

function formatDate(dateString, utc = false) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (utc) {
    return d.toISOString().replace(/[-:T]/g, '').slice(0, 12); // yyyymmddHHMM
  } else {
    return d.getFullYear().toString().padStart(4, '0') +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') +
      String(d.getHours()).padStart(2, '0') +
      String(d.getMinutes()).padStart(2, '0');
  }
}

module.exports = getTropicalAdvisoryXML;
