
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 AirportDelays
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function airportDelays(objects) {
    return `
<Data type="AirportDelays">
${objects[0].join("\n")}
</Data>
    `
};