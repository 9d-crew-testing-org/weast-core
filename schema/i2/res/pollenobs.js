
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 PollenObs
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function pollen(objects) {
    return `
<Data type="PollenObs">
${objects.join("\n")}
</Data>
    `
};