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
    return `
import twccommon

#areaList = wxdata.getUGCInterestList('${input.location}', 'obsStation')

twccommon.Log.info("RWE - Current Conditions is being sent")

#if (not areaList):
    #abortMsg()

#for area in areaList:
b = twc.Data()
b.skyCondition = ${input.iconCodeExtend}
b.temp = ${input.temperature}
b.humidity = ${input.relativeHumidity}
b.dewpoint = ${input.temperatureDewPoint}
b.altimeter = ${input.pressureAltimeter}
b.visibility = ${Number(input.visibility).toFixed(3)};
b.windDirection = ${wind_dir[input.windDirectionCardinal]}
b.windSpeed = ${input.windSpeed}
b.gusts = ${input.windGust ? input.windGust : "None"}
b.windChill = ${input.temperatureFeelsLike}
b.ceiling = ${input.cloudCeiling || "None"}
b.heatIndex = ${input.temperatureFeelsLike}
b.pressureTendency = ${input.pressureTendencyCode}

wxdata.setData('${input.location}', 'obs', b, ${Math.round(new Date() / 1000) + (60 * 60)})

    `
};