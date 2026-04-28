/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 DrySkinIndex
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function drySkin(input) {
    return `<DrySkin id="000000000" locationKey="${input.coopId}" isWxscan="0">
                ${input.data}
                <clientKey>${input.coopId}</clientKey>
            </DrySkin>
    `
};