/**
 * Convert V3 TWC CC + V3 Location Info to Rainwater Format CC
 * @param {Object} input - V3 API CC Data as Json
 * @param {number} input.locationInfo - V3 API Location Data as Json
 * @returns {}
 */
module.exports = function currentConditions(input) {
  return {
    "location": {
        "city": input.locationInfo.location.city[0] || input.locationInfo.location.city[1] || input.locationInfo.location.city[2] || "Unknown",
        "latitude": input.locationInfo.location.latitude[0] || input.locationInfo.location.latitude[1] || input.locationInfo.location.latitude[2] || 0,
        "longitude": input.locationInfo.location.longitude[0] || input.locationInfo.location.longitude[1] || input.locationInfo.location.longitude[2] || 0,
        "timeZone": input.locationInfo.location.ianaTimeZone[0] || input.locationInfo.location.ianaTimeZone[1] || input.locationInfo.location.ianaTimeZone[2] || "UTC",
        "state": {
        "abbreviated": input.locationInfo.location.adminDistrictCode[0] || input.locationInfo.location.adminDistrictCode[1] || input.locationInfo.location.adminDistrictCode[2] || "NA",
        "name": input.locationInfo.location.adminDistrict[0] || input.locationInfo.location.adminDistrict[1] || input.locationInfo.location.adminDistrict[2] || "Unknown"
        },
        "display": input.locationInfo.location.displayContext[0] || input.locationInfo.location.displayContext[1] || input.locationInfo.location.displayContext[2] || "Unknown, NA",
        "locId": input.locationInfo.location.locId[0] || input.locationInfo.location.locId[1] || input.locationInfo.location.locId[2] || "000000",
        "zipCode": input.locationInfo.location.postalKey[0] || input.locationInfo.location.postalKey[1] || input.locationInfo.location.postalKey[2] || "00000"
    },
    "iconExtended": input.iconCodeExtend,
    "vocalLocalKey": `OT${input.temperature}:OX${input.iconCodeExtend}`,
    "satradUrl": input.satrad,
    "dIconUrl": `https://weast.9dcrew.org/api/i/${input.iconCode}.png`, // this didn't actually return the icon code before i fixed it, chariots
    "pressure": input.pressureAltimeter,
    "pressureCode": input.pressureTendencyCode,
    "ceiling": input.cloudCeiling,
    "wxPhrase": {
        "long": input.wxPhraseLong,
        "med": input.wxPhraseMed,
        "short": input.wxPhraseShort
    },
    "temperature": input.temperature,
    "dewPoint": input.temperatureDewPoint,
    "feelsLike": input.temperatureFeelsLike,
    "humidity": input.relativeHumidity,
    "uv": {
        "text": input.uvDescription,
        "level": input.uvIndex
    },
    "visibility": input.visibility,
    "wind": {
        "speed": input.windSpeed,
        "direction": input.windDirectionCardinal,
        "gust": input.windGust 
    }
};
};
