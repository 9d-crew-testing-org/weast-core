const fs = require('fs');
const path = require('path');

/**
 * Recursively finds all .js files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} fileList - Accumulated file list
 * @returns {string[]} Array of file paths
 */
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (path.extname(file) === '.js') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Loads all schema functions from ./schema directory
 * @returns {Object.<string, Function>} Object with schema names as keys and functions as values
 */
function loadSchemas() {
  const schemaDir = path.join(__dirname, 'schema');
  const schemas = {};
  
  if (!fs.existsSync(schemaDir)) {
    console.warn('Schema directory not found:', schemaDir);
    return schemas;
  }
  
  const jsFiles = findJsFiles(schemaDir);
  
  jsFiles.forEach(filePath => {
    try {
      const schemaFn = require(filePath);
      
      const relativePath = path.relative(schemaDir, filePath);
      const schemaName = relativePath
        .replace(/\\/g, '/')
        .replace(/\.js$/, '')
        .replace(/\//g, '_');
      
      if (typeof schemaFn === 'function') {
        schemas[schemaName] = schemaFn;
      } else {
        console.warn(`Skipping ${filePath}: exported value is not a function`);
      }
    } catch (err) {
      console.error(`Error loading schema from ${filePath}:`, err.message);
    }
  });
  
  return schemas;
}

// Load and export all schemas
const schemas = loadSchemas();

module.exports = schemas;

module.exports.schemas = schemas;
module.exports.getSchema = (name) => schemas[name];
module.exports.listSchemas = () => Object.keys(schemas);

/**
 * @typedef {Object} SchemaCollection
 * All available schema transformation functions.
 * Each schema takes input data and returns transformed output.
 * 
 * @example
 * const schemas = require('./schemas');
 * const result = schemas.wx_cc({"cloudCeiling":null,"cloudCover":48,"cloudCoverPhrase":"Partly Cloudy","dayOfWeek":"Saturday","dayOrNight":"N","expirationTimeUtc":1760210013,"iconCode":29,"iconCodeExtend":2900,"obsQualifierCode":null,"obsQualifierSeverity":null,"precip1Hour":0,"precip6Hour":0,"precip24Hour":0.1,"pressureAltimeter":29.85,"pressureChange":0.05,"pressureMeanSeaLevel":1010.8,"pressureTendencyCode":1,"pressureTendencyTrend":"Rising","relativeHumidity":81,"snow1Hour":0,"snow6Hour":0,"snow24Hour":0,"sunriseTimeLocal":"2025-10-11T05:26:07+0000","sunriseTimeUtc":1760160367,"sunsetTimeLocal":"2025-10-11T17:27:40+0000","sunsetTimeUtc":1760203660,"temperature":80,"temperatureChange24Hour":1,"temperatureDewPoint":73,"temperatureFeelsLike":86,"temperatureHeatIndex":86,"temperatureMax24Hour":80,"temperatureMaxSince7Am":80,"temperatureMin24Hour":76,"temperatureWetBulbGlobe":77,"temperatureWindChill":80,"uvDescription":"Low","uvIndex":0,"validTimeLocal":"2025-10-11T19:03:33+0000","validTimeUtc":1760209413,"visibility":10,"windDirection":230,"windDirectionCardinal":"SW","windGust":null,"windSpeed":11,"wxPhraseLong":"Partly Cloudy","wxPhraseMedium":"Partly Cloudy","wxPhraseShort":"P Cloudy"});
 */