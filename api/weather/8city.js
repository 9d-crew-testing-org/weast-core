const TWC_API_KEY = "e1f10a1e78da46f5b10a1e78da96f525"
const schemas = require("../../schemas")
module.exports = async function getCC(req) {
    const location = req.query.location
    if(!location) return {error: "No location provided (ex. ?apiKey=x&location=Duluth"}
    const locationFetch = await fetch(`https://api.weather.com/v3/location/search?query=${location}&language=en-US&format=json&apiKey=${TWC_API_KEY}`, {timeout: 50 * 1000})
    if(!(locationFetch.ok)) return {error: "Getting location was NOT OK"}
    const locationData = await locationFetch.json();
    const newFetch = await fetch(`https://api.weather.com/v3/location/near?geocode=${locationData.location.latitude[0] || locationData.location.latitude[1] || locationData.location.latitude[2]},${locationData.location.longitude[0] || locationData.location.longitude[1] || locationData.location.longitude[2]}&product=observation&format=json&apiKey=${TWC_API_KEY}`, {timeout: 50 * 1000})
    const newData = await newFetch.json();
    const res = []
    for (const latitude in newData.location.latitude) {
        const ccFetch = await fetch(`https://api.weather.com/v3/wx/observations/current?geocode=${newData.location.latitude[latitude]},${newData.location.longitude[latitude]}&units=e&language=en-US&format=json&apiKey=${TWC_API_KEY}`, {timeout: 50 * 1000})
        if(!(ccFetch.ok)) return {error: "Getting current conditions was NOT OK"}
        const ccData = await ccFetch.json()
        const radarFetch = await fetch(`https://api.weather.com/v3/TileServer/series/productSet/PPAcore?apiKey=e1f10a1e78da46f5b10a1e78da96f525`)
        if(!(radarFetch.ok)) return {error: "Getting radar was NOT OK"}
        const radarData = await radarFetch.json();
        const locationData_2 = {
            city: [newData.location.stationName[latitude]],
            latitude: [newData.location.latitude[latitude]],
            longitude: [newData.location.longitude[latitude]],
            displayContext: [`${newData.location.stationName[latitude]}, ${newData.location.adminDistrictCode[latitude]}`],
            locId: [`${newData.location.stationId[latitude]}:2:${newData.location.countryCode[latitude]}`],
            adminDistrictCode: [newData.location.adminDistrictCode[latitude]],
            adminDistrict: [newData.location.adminDistrictCode[latitude]],
            ianaTimeZone: [newData.location.ianaTimeZone[latitude]],
            postalKey: [`${newData.location.stationId[latitude]}:2:${newData.location.countryCode[latitude]}`],
        }
        ccData.satrad = `https://weast.9dcrew.org/api/wx/satrad/${Math.round(newData.location.latitude[latitude])}.0,${Math.round(newData.location.longitude[latitude])}.0/${radarData.seriesInfo.satrad.series[0].ts}`
        ccData.locationInfo = {}
        ccData.locationInfo.location = locationData_2
        res.push(schemas.wx_cc(ccData))
    }
    
    return res
}
