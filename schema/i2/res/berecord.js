
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 BERecord
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function currentConditions(objects) {
    return `
<Data type="BERecord">
${objects[0].join("\n")}
</Data>
    `
};