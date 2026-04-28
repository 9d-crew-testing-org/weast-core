
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 AchesAndPains
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function achesAndPains(objects) {
    return `
<Data type="AchesAndPains">
${objects.join("\n")}
</Data>
    `
};