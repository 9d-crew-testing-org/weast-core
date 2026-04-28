const lfrecord = require("../../istar/lfrecord")

async function handleDataReq(url, json = false, timeoutMs = 5000, retryDelay = 1000, maxRetries = 25) {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      return json ? await res.json() : await res.text();

    } catch (err) {
      attempts++;

      if (attempts >= maxRetries) {
        throw new Error(`Request failed after ${attempts} attempts: ${err.message}`);
      }

      console.warn(`Fetch failed (attempt ${attempts}): ${err.message}. Retrying in ${retryDelay}ms...`);
      await new Promise(r => setTimeout(r, retryDelay));
    }
  }
}

async function getData(initType, location) {
    // AQI doesn't take lat/long nevermind it does im dumb LOL
    let type = initType
    if (type.includes("_US_")) type = "locId";
    if (type.startsWith("US") && (!type.includes(":"))) type = "locId_raw";
    if (type.startsWith("T")) type = "tecci";
    const i2LFR = await lfrecord(type, location)
    if(!i2LFR?.lat) return "";
    // Now, if the I2's LFRecord lookup went well, we should have a Lat/Long value.
    const data = await handleDataReq(`https://api.weather.com/v1/geocode/${i2LFR.lat}/${i2LFR.long}/airquality.xml?language=en-US&units=e&apiKey=e1f10a1e78da46f5b10a1e78da96f525`, false)
    const i2OBJ = require("../objects/aqi")({ content: `<airquality>${data.split("<airquality>")[1].split("</response>")[0]}`, epa: i2LFR.epaId })
    return i2OBJ
}

//getData("1_US_USMN0503", "1_US_USMN0503")

module.exports = getData