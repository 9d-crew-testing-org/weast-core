const TWC_API_KEY = "e1f10a1e78da46f5b10a1e78da96f525"
const schemas = require("../../schemas")
module.exports = async function getCC(req) {
    const location = req.query.location
    if(!location) return {error: "No location provided (ex. ?apiKey=x&location=Duluth"}
    const locationFetch = await fetch(`https://api.weather.com/v3/location/search?query=${location}&language=en-US&format=json&apiKey=${TWC_API_KEY}`, {timeout: 50 * 1000})
    if(!(locationFetch.ok)) return {error: "Getting location was NOT OK"}
    const locationData = await locationFetch.json();
    const ccFetch = await fetch(`https://api.weather.com/v3/wx/observations/current?geocode=${locationData.location.latitude[0] || locationData.location.latitude[1] || locationData.location.latitude[2]},${locationData.location.longitude[0] || locationData.location.longitude[1] || locationData.location.longitude[2]}&units=e&language=en-US&format=json&apiKey=${TWC_API_KEY}`, {timeout: 50 * 1000})
    if(!(ccFetch.ok)) return {error: "Getting current conditions was NOT OK"}
    const ccData = await ccFetch.json()
    const radarFetch = await fetch(`https://api.weather.com/v3/TileServer/series/productSet/PPAcore?apiKey=e1f10a1e78da46f5b10a1e78da96f525`)
    if(!(radarFetch.ok)) return {error: "Getting radar was NOT OK"}
    const radarData = await radarFetch.json();
    ccData.satrad = `https://weast.9dcrew.org/api/wx/satrad/${Math.round(locationData.location.latitude[0] || locationData.location.latitude[1] || locationData.location.latitude[2])}.0,${Math.round(locationData.location.longitude[0] || locationData.location.longitude[1] || locationData.location.longitude[2])}.0/${radarData.seriesInfo.satrad.series[0].ts}`
    ccData.locationInfo = locationData
    return schemas.wx_cc(ccData)
}
