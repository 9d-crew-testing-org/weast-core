
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 WateringNeeds
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function watering(objects) {
    return `
<Data type="WateringNeeds">
${objects.join("\n")}
</Data>
    `
};