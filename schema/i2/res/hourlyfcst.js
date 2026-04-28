
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 HourlyForecast
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function hourlyForecast(objects) {
    return `
<Data type="HourlyForecast">
${objects.join("\n")}
</Data>
    `
};