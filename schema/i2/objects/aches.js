
function generateObservationTags(obs) {
    const tags = [
        'fcstValid', 'fcstValidLocal', 'dayInd',
        'num', 'daypartName', 'achesPainsIndex', 'achesPainsCategory'
    ];

    return tags.map(tag => {
        return `<${obs.split(`<${tag}><`)[1].split(`></${tag}>`)[0]}>`
    }).join('');
}

/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 AchesAndPains
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function achesAndPains(input) {
    return `<AchesAndPains id="000000000" locationKey="${input.coopId}" isWxscan="0">
                <metadata>
                    ${input.metadata}
                </metadata>
                <achesPainsIndex12hour>
                    ${input.xml}
                </achesPainsIndex12hour>
                <clientKey>${input.coopId}</clientKey>
            </AchesAndPains>
    `
};