module.exports = function daily(input) {
    const fcstValidLocal = input.forecasts[0].fcst_valid_local;
const fcstDate = new Date(fcstValidLocal);
const hour = fcstDate.getHours();
let midnightLocal = new Date(fcstDate.getTime() - hour * 60 * 60 * 1000);
if (hour > 5 && hour < 15) {
 midnightLocal = new Date(fcstDate.getTime() - 7 * 60 * 60 * 1000);
} else {
 midnightLocal = new Date(fcstDate.getTime() - 19 * 60 * 60 * 1000);
}
let keyTime = Math.floor(midnightLocal.getTime() / 1000);

console.log(new Date(keyTime * 1000).toLocaleString(), fcstDate.toLocaleString(), hour)
    // Logically determine 'rem' based on current time in the forecast timezone
    let rem = 1;
    const now = new Date();

    // Python code header
    let data = `
import twccommon
import time
import twc.dsmarshal as dsm

#areaList = wxdata.getUGCInterestList('${input.location}', 'coopId')

twccommon.Log.info("RWE - Daily Forecast is being sent")

keyTime = ${keyTime}
print(keyTime)
`;

    input.forecasts.forEach(fcst => {
        const day = `
#for area in areaList:
forecastTime_${fcst.num} = keyTime + (${fcst.num - rem} * 86400)
b_${fcst.num} = twc.Data()
${fcst.max_temp ? `b_${fcst.num}.highTemp = ${fcst.max_temp}` : ""}
b_${fcst.num}.lowTemp = ${fcst.min_temp || "None"}
${fcst.day?.icon_extd ? `b_${fcst.num}.daySkyCondition = ${fcst.day.icon_extd}` : ""}
b_${fcst.num}.eveningSkyCondition = ${fcst.night?.icon_extd || "None"}        
wxdata.setData(('${input.location}.' + str(int(forecastTime_${fcst.num}))), 'dailyFcst', b_${fcst.num}, int(forecastTime_${fcst.num} + 86400))
twccommon.Log.info("RWE - Daily forecast data has been set")
print("RWE - Daily forecast data has been set")
`;
        data += day;
    });

    return data;
};
