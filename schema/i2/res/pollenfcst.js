
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 PollenForecast
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function pollenFcst(objects) {
    return `
<Data type="PollenForecast">
${objects.join("\n")}
</Data>
    `
};