const fs = require("fs")
const path = require("path")
/**
 * Get info on Rainwater Map Data
 * @returns {}
 */
module.exports = function mapData() {
    const map_directory = path.join(__dirname, "../../images/maps/")
    const maps = [
        {
            name: "CONUS Radar for IStar",
            extension: "tiff",
            starName: "radar.US",
            apiName: "radar-us",
            file: "radar-us.py",
            clearAfter: 3 * 60 * 60,
            runEvery: 2 * 60
        },
        {
            name: "Puerto Rico Radar for IStar",
            extension: "tiff",
            starName: "radar.PR",
            apiName: "radar-pr",
            file: "radar-pr.py",
            clearAfter: 3 * 60 * 60,
            runEvery: 5 * 60
        },
        {
            name: "Alaska Radar for IStar",
            extension: "tiff",
            starName: "radar.AK",
            apiName: "radar-ak",
            file: "radar-ak.py",
            clearAfter: 3 * 60 * 60,
            runEvery: 5 * 60
        },
        {
            name: "Hawaii Radar for IStar",
            extension: "tiff",
            starName: "radar.HI",
            apiName: "radar-hi",
            file: "radar-hi.py",
            clearAfter: 3 * 60 * 60,
            runEvery: 5 * 60
        },
        {
            name: "CONUS SatRad for IStar",
            extension: "tiff",
            starName: "satrad.US",
            apiName: "satrad-us",
            file: "satrad-us.py",
            clearAfter: 3 * 60 * 60,
            runEvery: 5 * 60
        },
        {
            name: "CONUS Sat",
            extension: "png",
            starName: "sat.US",
            apiName: "sat-us",
            file: "sat-us.py",
            clearAfter: 3 * 60 * 60,
            runEvery: 5 * 60
        },
        {
            name: "CONUS Thunder Forecast",
            extension: "png",
            starName: "thunderfcst.US",
            apiName: "thunderfcst-us",
            file: "thunder-us.py",
            clearAfter: 18 * 60 * 60,
            runEvery: 60 * 60
        },
        {
            name: "CONUS Travel Weather",
            extension: "png",
            starName: "travel.US",
            apiName: "travel-us",
            file: "travel-us.py",
            clearAfter: 18 * 60 * 60,
            runEvery: 60 * 60
        },
        {
            name: "CONUS Current Temperature",
            extension: "png",
            starName: "nowtemps.US",
            apiName: "nowtemps-us",
            file: "nowTemps-us.py",
            clearAfter: 24 * 60 * 60,
            runEvery: 60 * 60
        },
        {
            name: "CONUS Water Temperature",
            extension: "png",
            starName: "watertemps.US",
            apiName: "watertemps-us",
            file: "watertemps-us.py",
            clearAfter: 24 * 60 * 60,
            runEvery: 60 * 60
        },
        {
            name: "CONUS Snowfall QPF Forecast Map for IStar 1",
            extension: "tiff",
            starName: "snowfallQpfForecast.US",
            apiName: "snowfallQpfForecast-us",
            file: "snowfallQpfFcst-us.py",
            clearAfter: 24 * 60 * 60,
            runEvery: 30 * 60
        }
    ]
    const out = {}
    maps.forEach(map => {
        out[map.apiName] = map
        out[map.apiName].directory = path.join(map_directory, map.apiName)
        out[map.apiName].dirsNeeded = [path.join(map_directory, map.apiName, "temp"), path.join(map_directory, map.apiName, "tiles")]
        out[map.apiName].location = map.starName.split(".")[1]
        out[map.apiName].mapType = map.starName.split(".")[0]
    })
    return out
};