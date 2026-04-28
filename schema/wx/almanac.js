function getNextMoonPhasesTWC(currentMoonPhaseDay) {
  const lunarMonth = 29.53; // average lunar month in days
  const phaseInterval = lunarMonth / 4; // ~7.38 days between main phases
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;

  // Define TWC-style phases
  const phases = [
    { code: "N", description: "New Moon", day: 0 },
    { code: "FQ", description: "First Quarter", day: 7 },
    { code: "F", description: "Full Moon", day: 14 },
    { code: "LQ", description: "Last Quarter", day: 21 }
  ];

  // Helper function: find closest phase index
  function getCurrentPhaseIndex(day) {
    // find phase with closest day <= current
    let closest = 0;
    for (let i = 0; i < phases.length; i++) {
      if (day >= phases[i].day) closest = i;
    }
    return closest;
  }

  let currentPhaseIndex = getCurrentPhaseIndex(currentMoonPhaseDay);
  let totalDays = currentMoonPhaseDay;
  const nextPhases = [];

  while (totalDays < currentMoonPhaseDay + 3 * lunarMonth) {
    // Move to next phase
    currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
    totalDays += phaseInterval;

    // Calculate approximate date
    const phaseDate = new Date(now.getTime() + (totalDays - currentMoonPhaseDay) * msPerDay);
    const formattedDate = phaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Calculate lunar day modulo 29.53
    const lunarDayModulo = parseFloat((totalDays % lunarMonth).toFixed(2));

    nextPhases.push({
      phaseCode: phases[currentPhaseIndex].code,
      description: phases[currentPhaseIndex].description,
      lunarDay: lunarDayModulo,
      approxDaysFromNow: parseFloat((totalDays - currentMoonPhaseDay).toFixed(2)),
      timestamp: phaseDate.getTime(),
      formattedDate: formattedDate
    });
  }

  return nextPhases;
}

// Example usage:
console.log(getNextMoonPhasesTWC(14)); // today is full moon


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
  "moonPhases": getNextMoonPhasesTWC(fcst.lunar_phase_day),
  "sunset": [input.forecasts[fcst.num - 1]?.sunset, input.forecasts[fcst.num]?.sunset, input.forecasts[fcst.num + 1]?.sunset],
  "sunrise": [input.forecasts[fcst.num - 1]?.sunrise, input.forecasts[fcst.num]?.sunrise, input.forecasts[fcst.num + 1]?.sunrise],
  "sunset": [input.forecasts[fcst.num - 1]?.moonset, input.forecasts[fcst.num]?.moonset, input.forecasts[fcst.num + 1]?.moonset],
  "moonrise": [input.forecasts[fcst.num - 1]?.moonrise, input.forecasts[fcst.num]?.moonrise, input.forecasts[fcst.num + 1]?.moonrise]
}
object.push(day)
})
return object
};