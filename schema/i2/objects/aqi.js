
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 AirQualityIndex
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function aqi(input) {
    return `
    <AirQuality id="000000000" locationKey="${input.epa}" isWxScan="0">
        ${input.content}
        <clientKey>${input.epa}</clientKey>
    </AirQuality>
    `
};