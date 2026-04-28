const TWC_API_KEY = "e1f10a1e78da46f5b10a1e78da96f525"
const path = require("path")
const fs = require("fs")
const schemas = require("../../schemas")
async function fetchDynamicRadar(coordinates, product, color, timestamp) {
    try {
        const response = await fetch(`https://api.weather.com/v3/TileServer/series/productSet/PPAcore?apiKey=e1f10a1e78da46f5b10a1e78da96f525`);
        const res = await response.json();
        let ts = res.seriesInfo[product].series[0].ts
        let url = `https://api.weather.com/v2/maps/dynamic?geocode=${Math.round(coordinates.lat)}.0,${Math.round(coordinates.lon)}.0&h=320&w=568&lod=7&product=${product}&map=${color || "dark"}&format=jpg&language=en-US&apiKey=e1f10a1e78da46f5b10a1e78da96f525&ts=${res.seriesInfo[product].series[0].ts}&a=0`;
        if(JSON.stringify(res.seriesInfo[product].series).includes(timestamp)) {
            url = `https://api.weather.com/v2/maps/dynamic?geocode=${Math.round(coordinates.lat)}.0,${Math.round(coordinates.lon)}.0&h=320&w=568&lod=7&product=${product}&map=${color || "dark"}&format=jpg&language=en-US&apiKey=e1f10a1e78da46f5b10a1e78da96f525&ts=${timestamp}&a=0`;
            ts = timestamp
        }
        return [url, ts, coordinates];
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function getTS() {
    try {
        const response = await fetch(`https://api.weather.com/v3/TileServer/series/productSet/PPAcore?apiKey=e1f10a1e78da46f5b10a1e78da96f525`);
        const res = await response.json();
        let ts = res.seriesInfo["satrad"].series[0].ts
        ts = res.seriesInfo["satrad"].series[0]
        return [ts];
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

module.exports = async function getCC(req, res) {
    if(req.params.ts < Math.round(new Date() / 1000) - (30 * 24 * 60 * 60)) {
        return res.sendFile(path.join(__dirname, "../../images/satrad/30days.jpg"))
    } else {
        const coordinates = String(req.params.coordinates).split(",")
        if(coordinates[1] > -180 && coordinates[1] < 180 && coordinates[0] > -90 && coordinates[0] < 90) {
            const radarUrl = await fetchDynamicRadar({lat:coordinates[0],lon:coordinates[1]}, "satrad", "dark", req.params.ts)
            const location = path.join(__dirname, "../../images", "satrad", `${req.params.ts}_${coordinates.join("_")}.jpg`)
            if(fs.existsSync(location)) {
                res.sendFile(location);
            } else {
                const nfetch = require("node-fetch")
                    const response = await nfetch(radarUrl[0], {timeout:50000});
                    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
                    const fileStream = fs.createWriteStream(location);
                    await new Promise((resolve, reject) => {
                        response.body.pipe(fileStream);
                        response.body.on('error', reject);
                        fileStream.on('finish', resolve);
                    });
                    if(fs.existsSync(location)) {
                        return res.sendFile(location)
                    }
                }
        }
        fs.readdirSync(path.join(__dirname, "../../images/satrad/")).forEach(t => {
            if(Number(t.split("_")[0]) < Math.round(new Date() / 1000) - (30 * 24 * 60 * 60)) {
                fs.rmSync(path.join(__dirname, "../../images/satrad/", t))
            }
        })
    }

}
