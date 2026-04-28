
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 AirQualityIndex
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function aqi(objects) {
    return `
<Data type="AirQuality">
${objects.join("\n")}
</Data>
    `
};