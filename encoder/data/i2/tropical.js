// tropicalAdvisory.js
// CommonJS module that fetches TWC tropical cone JSON and outputs XML

const API_KEY = '71f92ea9dd2f4790b92ea9dd2f779061';
const API_URL = `https://api.weather.com/v3/tropical/cone?source=default&basin=all&language=en-US&format=json&units=e&nautical=true&apiKey=${API_KEY}`;

async function getTropicalAdvisoryXML() {
  const res = await fetch(API_URL);
  const data = await res.json();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Data type="TropicalAdvisory">\n';

  for (const feature of data.features) {
    const p = feature.properties;
    const c = p.currentPosition;

    xml += `  <TropicalAdvisory id="0" locationKey="${p.stormId || ''}" isWxscan="0">\n`;

    // Metadata
    xml += '    <metadata>\n';
    xml += '      <language>en-US</language>\n';
    xml += `      <transaction_id>${Date.now()}:${Math.floor(Math.random() * 1000000000)}</transaction_id>\n`;
    xml += '      <version>2</version>\n';
    xml += '      <nautical>true</nautical>\n';
    xml += '      <format>xml</format>\n';
    xml += '      <units>e</units>\n';
    xml += `      <stormId>${p.stormId}</stormId>\n`;
    xml += `      <expire_time_gmt>${Math.round((Date.now() + (6 * 60 * 60 * 1000)) / 1000)}</expire_time_gmt>\n`;
    xml += '      <status_code>200</status_code>\n';
    xml += '    </metadata>\n';

    // Advisory info
    xml += '    <advisoryinfo>\n';
    xml += '      <advisoryinfo>\n';
    xml += `        <storm_key>${p.stormKey}</storm_key>\n`;
    xml += `        <storm_id>${p.stormId}</storm_id>\n`;
    xml += `        <storm_number>${p.stormNumber}</storm_number>\n`;
    xml += `        <storm_name>${p.stormName}</storm_name>\n`;
    xml += `        <alternate_storm_name>${p.alternateStormName || ''}</alternate_storm_name>\n`;
    xml += `        <source>${p.source}</source>\n`;
    xml += `        <dsgnt_source>${p.designatedSource}</dsgnt_source>\n`;
    xml += `        <basin>${p.basin}</basin>\n`;
    xml += `        <issue_office>${p.issueOffice}</issue_office>\n`;
    xml += `        <wmo_id>${p.wmoId}</wmo_id>\n`;
    xml += `        <bulletin_id>${p.bulletinId}</bulletin_id>\n`;
    xml += `        <issue_dt_tm>${p.issueDateTime}</issue_dt_tm>\n`;
    xml += `        <issue_dt_tm_tz_cd>${p.issueDateTimeZoneCode}</issue_dt_tm_tz_cd>\n`;
    xml += `        <issue_dt_tm_tz_abbrv>${p.issueDateTimeZoneAbbreviation}</issue_dt_tm_tz_abbrv>\n`;
    xml += `        <adv_num>${p.advisoryNumber}</adv_num>\n`;
    xml += `        <adv_dt_tm>${p.advisoryDateTime}</adv_dt_tm>\n`;
    xml += `        <adv_dt_tm_tz_cd>${p.advisoryDateTimeZoneCode}</adv_dt_tm_tz_cd>\n`;
    xml += `        <adv_dt_tm_tz_abbrv>${p.advisoryDateTimeZoneAbbreviation}</adv_dt_tm_tz_abbrv>\n`;

    // Current position
    xml += '        <currentposition>\n';
    xml += `          <lat>${c.latitude}</lat>\n`;
    xml += `          <lat_hemisphere>${c.latitudeHemisphere}</lat_hemisphere>\n`;
    xml += `          <lon>${c.longitude}</lon>\n`;
    xml += `          <lon_hemisphere>${c.longitudeHemisphere}</lon_hemisphere>\n`;
    xml += `          <storm_type_cd>${c.stormTypeCode}</storm_type_cd>\n`;
    xml += `          <storm_type>${c.stormType}</storm_type>\n`;

    // Headline
    if (c.headline && c.headline.length) {
      xml += '          <headline>\n';
      for (const h of c.headline) {
        xml += `            <item>${h}</item>\n`;
      }
      xml += '          </headline>\n';
    }

    xml += `          <min_pressure>${c.minimumPressure}</min_pressure>\n`;
    xml += `          <max_sustained_wind>${c.maximumSustainedWind}</max_sustained_wind>\n`;
    xml += `          <wind_gust>${c.windGust}</wind_gust>\n`;

    // Heading
    xml += '          <heading>\n';
    xml += `            <storm_dir>${c.heading.stormDirection}</storm_dir>\n`;
    xml += `            <storm_dir_cardinal>${c.heading.stormDirectionCardinal}</storm_dir_cardinal>\n`;
    xml += `            <storm_spd>${c.heading.stormSpeed}</storm_spd>\n`;
    xml += '          </heading>\n';

    // Nearby locations
    if (c.nearbyLocation && c.nearbyLocation.length) {
      xml += '          <nearby_loc>\n';
      for (const loc of c.nearbyLocation) {
        xml += '            <nearby_loc>\n';
        xml += `              <loc_nm>${loc.locationName}</loc_nm>\n`;
        xml += `              <dist>${loc.distance}</dist>\n`;
        xml += `              <dir_cardinal>${loc.directionCardinal}</dir_cardinal>\n`;
        xml += `              <city_nm>${loc.cityName || ''}</city_nm>\n`;
        xml += `              <st_cd>${loc.stateCode || ''}</st_cd>\n`;
        xml += '            </nearby_loc>\n';
      }
      xml += '          </nearby_loc>\n';
    }

    xml += '        </currentposition>\n';
    xml += '      </advisoryinfo>\n';
    xml += '    </advisoryinfo>\n';

    xml += `    <clientKey>${p.stormId}</clientKey>\n`;
    xml += '  </TropicalAdvisory>\n';
  }

  xml += '</Data>\n';
  return xml;
}

module.exports = getTropicalAdvisoryXML;
