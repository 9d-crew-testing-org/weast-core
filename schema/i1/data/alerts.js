const { writeFileSync } = require("fs");
const lfrecord = require("../../istar/lfrecord");
const path = require("path");

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

async function getData() {
    // Alerts.... Alerts are special. They don't need a location! We can fetch Headlines from the TWC APIs and send that. Hurrah!!
    const data = await handleDataReq(`https://api.weather.com/v3/alerts/headlines?countryCode=us&format=json&language=en-US&apiKey=e1f10a1e78da46f5b10a1e78da96f525`, true)
    const alerts = []
    for (const alert of data.alerts) {
        alerts.push(await handleDataReq(`https://api.weather.com/v3/alerts/detail?alertId=${alert.detailKey}&format=json&language=en-US&apiKey=e1f10a1e78da46f5b10a1e78da96f525`, true))
    }
    const i1BE = []
    for (const alert of alerts) {
        if(!(alert.significance == "W")) {
            const i1RES = require("../res/headline")(alert.alertDetail)
            i2BE.push(i1RES)
        } else {
            const i1RES = require("../res/bulletin")(alert.alertDetail)
            i2BE.push(i1RES)
        }
        i1BE.push(i1RES)
    }
    return i1BE
}

module.exports = getData