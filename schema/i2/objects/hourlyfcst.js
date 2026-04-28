
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 HourlyForecast
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function hourlyFcst(input) {
    const forecastEntries = String(input.data).split("<forecasts>")[1].split("</forecasts>")[0]
    return `<HourlyForecast id="000000000" locationKey="${input.coopId}" isWxscan="0">
                <metadata>
                    <language>${String(input.data).split("<language>")[1].split("</language>")[0]}</language>
                    <transaction_id>${String(input.data).split("<transaction_id>")[1].split("</transaction_id>")[0]}:RWE</transaction_id>
                    <version>${String(input.data).split("<version>")[1].split("</version>")[0]}</version>
                    <units>${String(input.data).split("<units>")[1].split("</units>")[0]}</units>
                    <expire_time_gmt>${String(input.data).split("<expire_time_gmt>")[1].split("</expire_time_gmt>")[0]}</expire_time_gmt>
                    <status_code>${String(input.data).split("<status_code>")[1].split("</status_code>")[0]}</status_code>
                </metadata>
                <forecasts>${forecastEntries}</forecasts>
                <clientKey>${input.coopId}</clientKey>
            </HourlyForecast>
    `
};