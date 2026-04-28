
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 DailyForecast
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function dailyForecast(objects) {
    return `
<Data type="DailyForecast">
${objects.join("\n")}
</Data>
    `
};