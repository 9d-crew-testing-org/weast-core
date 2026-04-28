const TWC_API_KEY = "e1f10a1e78da46f5b10a1e78da96f525"
const schemas = require("../../schemas")
module.exports = async function getHourly(req) {
    const location = req.query.location
    if(!location) return {error: "No location provided (ex. ?apiKey=x&location=Duluth"}
    const locationFetch = await fetch(`https://api.weather.com/v3/location/search?query=${location}&language=en-US&format=json&apiKey=${TWC_API_KEY}`, {timeout: 50 * 1000})
    if(!(locationFetch.ok)) return {error: "Getting location was NOT OK"}
    const locationData = await locationFetch.json();
    const hourlyFetch = await fetch(`https://api.weather.com/v3/wx/forecast/hourly/3day?geocode=${locationData.location.latitude[0] || locationData.location.latitude[1] || locationData.location.latitude[2]},${locationData.location.longitude[0] || locationData.location.longitude[1] || locationData.location.longitude[2]}&format=json&units=e&language=en-US&apiKey=${TWC_API_KEY}`, {timeout: 50 * 1000})
    if(!(hourlyFetch.ok)) return {error: "Getting hourly fcst was NOT OK"}
    const hourlyData = await hourlyFetch.json()
    hourlyData.locationInfo = locationData
    return schemas.wx_hourly(hourlyData)
}
