/**
 * Convert V3 TWC Hourly + V3 Location Info to Rainwater Format CC
 * @param {Object} input - V3 API Hourly Data as Json
 * @param {number} input.locationInfo - V3 API Location Data as Json
 * @returns {}
 */
module.exports = function hourly(input) {
    const object = []
    for (const num in input.dayOfWeek) {
        const hour = {
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
    },"iconExtended": input.iconCodeExtend[num],
    "timestamp": input.validTimeLocal[num],
    "hoursAhead": num,
    "weekday": input.dayOfWeek[num],
    "dIconUrl": `https://weast.9dcrew.org/api/i/${input.iconCode[num]}.png`,
    "temperature": input.temperature[num],
    "wxPhrase": {
      "long": input.wxPhraseShort[num],
      "short": input.wxPhraseLong[num]
    },
    "dewPoint": input.temperatureDewPoint[num],
    "feelsLike": input.temperatureFeelsLike[num],
    "humidity": input.relativeHumidity[num],
    "pop": input.precipChance[num],
    "uv": {
      "text": input.uvDescription[num],
      "level": input.uvIndex[num]
    },
    "visibility": input.visibility[num],
    "wind": {
      "speed": input.windSpeed[num],
      "direction": input.windDirectionCardinal[num]
    }
}
object.push(hour)
}
return object
};
