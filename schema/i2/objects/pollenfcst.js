/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 PollenForecast
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function pollenFcst(input) {
    return `<PollenForecast id="000000000" locationKey="${input.coopId}" isWxscan="0">
                ${input.data}
                <clientKey>${input.coopId}</clientKey>
            </PollenForecast>
    `
};