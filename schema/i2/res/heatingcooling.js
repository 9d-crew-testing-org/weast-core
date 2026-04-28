
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 HeatingAndCooling
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function heatingAndCooling(objects) {
    return `
<Data type="HeatingAndCooling">
${objects.join("\n")}
</Data>
    `
};