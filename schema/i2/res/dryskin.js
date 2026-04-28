
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 DrySkin
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function drySkin(objects) {
    return `
<Data type="DrySkin">
${objects.join("\n")}
</Data>
    `
};