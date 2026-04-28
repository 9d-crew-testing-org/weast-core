
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 AirportDelays
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function currentConditions(input) {
    return `
  <AirportDelays id="000" locationKey="${input.iata}" isWxscan="0">
    <airport_result>
      <class>airport_delays</class>
      <source>flightaware.com</source>
      <icao_code>K${input.iata}</icao_code>
      <iata_code>${input.iata}</iata_code>
      <faa_code>${input.iata}</faa_code>
      <airport_name>${input.airportName}</airport_name>
      <local_airport_name />
      <delays>
        <category>${input.category}</category>
        <color>${input.color}</color>
        <delay_sec>${input.delaySecs}</delay_sec>
        <reasons_all>
          ${input.reasons.map(reason => `
          <delay>
            <category>${reason.category}</category>
            <color>${reason.color}</color>
            <delay_sec>${reason.delay_secs}</delay_sec>
            <reason>${reason.reason}</reason>
          </delay>`).join('')}
        </reasons_all>
      </delays>
      <arrival>
        <cancellations>0</cancellations>
        <delays>0</delays>
        <percentage_cancelled>0</percentage_cancelled>
        <total>0</total>
      </arrival>
      <departure>
        <cancellations>0</cancellations>
        <delays>0</delays>
        <percentage_cancelled>0</percentage_cancelled>
        <total>0</total>
      </departure>
      <process_time_gmt>${input.now}</process_time_gmt>
      <expire_time_gmt>${input.expire}</expire_time_gmt>
    </airport_result>
    <metadata>
      <language>en-US</language>
      <transaction_id>${Date.now()}:${Math.floor(Math.random() * 1e9)}</transaction_id>
      <version>1</version>
      <airport_code>${input.iata}</airport_code>
      <expire_time_gmt>${input.expire}</expire_time_gmt>
      <status_code>200</status_code>
    </metadata>
    <clientKey>${input.iata}</clientKey>
  </AirportDelays>
    `
};