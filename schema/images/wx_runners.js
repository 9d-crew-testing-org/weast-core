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
            name: "SatLF Maps Travel And Tstm",
            extension: "png",
            apiName: "satlf-us",
            file: "satlf-maps.py",
            runEvery: 60 * 60
        },
/*         {
            name: "CONUS Radar GIF Composite",
            extension: "gif",
            apiName: "radar-us",
            file: "radar-gif.py",
            runEvery: 10 * 60
        },
        {
            name: "CONUS Temperature GIF Composite",
            extension: "gif",
            apiName: "nowtemps-us",
            file: "temperature-gif.py",
            runEvery: 10 * 60
        },
        {
            name: "CONUS Radar GIF Composite No Basemap",
            extension: "gif",
            apiName: "radar-us-n",
            file: "radar-nobasemap-gif.py",
            runEvery: 10 * 60
        } */
    ]
    const out = {}
    maps.forEach(map => {
        out[map.apiName] = map
    })
    return out
};