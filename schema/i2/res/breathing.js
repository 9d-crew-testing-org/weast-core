
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 Breathing
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function breathing(objects) {
    return `
<Data type="Breathing">
${objects.join("\n")}
</Data>
    `
};