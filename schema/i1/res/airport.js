const wind_dir = {
    'Calm': 0,
    'N': 1,
    'NNE': 2,
    'NE': 3,
    'ENE': 4,
    'E': 5,
    'ESE': 6,
    'SE': 7,
    'SSE': 8,
    'S': 9,
    'SSW': 10,
    'SW': 11,
    'WSW': 12,
    'W': 13,
    'WNW': 14,
    'NW': 15,
    'NNW': 16,
    'Var': 17
}
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar CC
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function currentConditions(input) {
    const reasons = input ? input.reasons : []
    const airport = input.airport
let delayForAirport = `
import twccommon

#areaList = wxdata.getUGCInterestList('${input.airport}', 'airportId')

#if (not areaList):
#    abortMsg()

#for area in areaList:
`
    reasons.forEach(r => {
        let delayType = "none"
        let trend = 0
        console.log(r.reason)
        if(r.reason.includes("departure")) {
            delayType = "departure"
        }
        if(r.reason.includes("arrival")) {
            delayType = "arrival"
        }
        if(r.reason.includes("inbound")) {
            delayType = "arrival"
        }
        if(r.reason.includes("decreasing")) {
            trend = 2
        }
        if(r.reason.includes("increasing")) {
            trend = 1
        }
        const res = `
b.${delayType}Delay = ${Math.round(r.delay_secs / 60)}
b.${delayType}DelayReason = '${r.category.charAt(0).toUpperCase() + r.category.slice(1)}'
b.${delayType}DelayTrend = ${trend}
wxdata.setData('${input.airport}', 'airportDelays', b, ${Math.round(new Date() / 1000) + (60 * 60)})
        `
        delayForAirport += res
    })
    return delayForAirport;
};