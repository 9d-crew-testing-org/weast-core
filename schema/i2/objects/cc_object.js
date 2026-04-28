
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 CC
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function currentConditions(input) {
    return `<CurrentObservations id="000000000" locationKey="${input.tecci}" isWxscan="0">
                ${input.xml}
                <clientKey>${input.tecci}</clientKey>
            </CurrentObservations>
    `
};