/**
 * Convert V1 TWC Daily Fcst + V3 Location Info to Rainwater Format CC
 * @param {Object} input - V1 API Daily Fcst Data as Json
 * @param {number} input.locationInfo - V3 API Location Data as Json
 * @returns {}
 */
module.exports = function daily(input) {
    const object = []
    input.forecasts.forEach(fcst => {
        const day = {
  "currentDaypart": input.forecasts[fcst.num - 1].day ? "Day" : "Night",
  "vocalLocalKey": input.forecasts[fcst.num - 1].day ? input.forecasts[fcst.num - 1].day.vocal_key : input.forecasts[fcst.num - 1].night.vocal_key,
  "vocalKey": {night: input.forecasts[fcst.num - 1].night.vocal_key},
  "iconCodeExtend": {"night": fcst.night.icon_code * 100},
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
    },"day": fcst.num - 1,
  "weekday": fcst.dow,
  "dIconUrl": `https://weast.9dcrew.org/api/i/${fcst.day ? fcst.day.icon_code : fcst.night.icon_code}.png`,
  "temperatureHigh": fcst.max_temp,
  "temperatureLow": fcst.min_temp,
  "forecastText": {
    "night": fcst.night.narrative
  },
  "wxPhrase": {
    "night": {
      "short": fcst.night.phrase_12char,
      "long": fcst.night.phrase_32char
    }
  },
  "wind": {
    "night": {
      "speed": fcst.night.wspd,
      "direction": fcst.night.wdir_cardinal
    }
  }
}
if(day.currentDaypart == "Day") {
    day.vocalKey.day = fcst.day.vocal_key
    day.forecastText.day = fcst.day.narrative
    day.wxPhrase.day = {short: fcst.day.phrase_12char, long: fcst.day.phrase_32char}
    day.wind.day = {speed: fcst.day.wspd, direction: fcst.day.wdir_cardinal}
    day.iconCodeExtend.day = fcst.day.icon_code * 100
}
object.push(day)
})
return object
};
