const fs = require("fs")
const path = require("path")
/**
 * Get info on Rainwater Map Data
 * @returns {}
 */
module.exports = function mapInfo() {
    const map_directory = path.join(__dirname, "../../images/maps/")
    const dirData = fs.readdirSync(map_directory)
    const res = {}
    dirData.forEach(dir => {
        const data = fs.readdirSync(path.join(map_directory, dir))
        res[dir] = []
        data.forEach(file => {
            if(!(file == "temp" || file == "tiles")) {
                res[dir].push(path.join(map_directory, dir, file))
            }
        }) 
    })
    return res;
};