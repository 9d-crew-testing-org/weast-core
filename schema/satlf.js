const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const dir = path.join(__dirname, "../temp");
const istar_lfrecord = require("./istar/lfrecord");
const TWC_API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";

async function getDaily(location) {
  if (!location)
    return { error: "No location provided (ex. ?apiKey=x&location=Duluth)" };

  const locationFetch = await fetch(
    `https://api.weather.com/v3/location/search?query=${location}&language=en-US&format=json&apiKey=${TWC_API_KEY}`,
    { timeout: 50 * 1000 }
  );
  if (!locationFetch.ok) return { error: "Getting location was NOT OK" };

  const locationData = await locationFetch.json();
  const lat =
    locationData.location.latitude[0] ||
    locationData.location.latitude[1] ||
    locationData.location.latitude[2];
  const lon =
    locationData.location.longitude[0] ||
    locationData.location.longitude[1] ||
    locationData.location.longitude[2];

  const dailyFetch = await fetch(
    `https://api.weather.com/v1/geocode/${lat}/${lon}/forecast/daily/7day.json?units=e&language=en-US&apiKey=${TWC_API_KEY}`,
    { timeout: 50 * 1000 }
  );
  if (!dailyFetch.ok) return { error: "Getting daily fcst was NOT OK" };

  const dailyData = await dailyFetch.json();
  const forecasts = dailyData.forecasts;
  const day = forecasts[0].dow ? 0 : 1;

  return {
    city_label: location,
    data: [0, 1, 2].map((i) => {
      const f = forecasts[day + i] || forecasts[day + i + 1];
      return {
        header_label: f.dow,
        icon_extd: f.icon_extd,
        high_temp: f.max_temp,
        low_temp: f.min_temp,
      };
    }),
  };
}

function formatHour(input) {
  if (input === 12) return "Noon";
  if (input === 0) return "Midnight";
  const a = input >= 12 ? "PM" : "AM";
  const out = input > 12 ? input - 12 : input;
  return `${out} ${a}`;
}

async function getHourly(location) {
  if (!location)
    return { error: "No location provided (ex. ?apiKey=x&location=Duluth)" };

  const locationFetch = await fetch(
    `https://api.weather.com/v3/location/search?query=${location}&language=en-US&format=json&apiKey=${TWC_API_KEY}`,
    { timeout: 50 * 1000 }
  );
  if (!locationFetch.ok) return { error: "Getting location was NOT OK" };
  const locationData = await locationFetch.json();

  const lat =
    locationData.location.latitude[0] ||
    locationData.location.latitude[1] ||
    locationData.location.latitude[2];
  const lon =
    locationData.location.longitude[0] ||
    locationData.location.longitude[1] ||
    locationData.location.longitude[2];

  const hourlyFetch = await fetch(
    `https://api.weather.com/v3/wx/forecast/hourly/3day?geocode=${lat},${lon}&format=json&units=e&language=en-US&apiKey=${TWC_API_KEY}`,
    { timeout: 50 * 1000 }
  );
  if (!hourlyFetch.ok) return { error: "Getting hourly fcst was NOT OK" };

  const hourlyData = await hourlyFetch.json();
  let firstHour = 0;
  for (let i = 0; i < hourlyData.validTimeLocal.length; i++) {
    const hour = Number(hourlyData.validTimeLocal[i].split("T")[1].split(":")[0]);
    if (hour === 6) {
      firstHour = i;
      break;
    }
  }

  return {
    city_label: location,
    data: [0, 6, 9].map((offset) => {
      const idx = firstHour + offset;
      const time = Number(
        hourlyData.validTimeLocal[idx].split("T")[1].split(":")[0]
      );
      return {
        hour_header_label: `${hourlyData.dayOfWeek[idx].toUpperCase()} FORECAST`,
        header_label: formatHour(time),
        icon_extd: hourlyData.iconCodeExtend[idx],
        temp: hourlyData.temperature[idx],
      };
    }),
  };
}

async function getData() {
  const mainPath = path.join(dir, "satlf_main.json");
  const travelPath = path.join(dir, "satlf_travel.json");

  const travelData = JSON.parse(fs.readFileSync(travelPath, "utf-8"));
  const mainData = JSON.parse(fs.readFileSync(mainPath, "utf-8"));

  // --- Travel ---
  for (const key in travelData) {
    const data = await istar_lfrecord("coop", key);
    const dailyFetch = await fetch(
      `https://api.weather.com/v1/geocode/${data.lat}/${data.long}/forecast/daily/7day.json?units=e&language=en-US&apiKey=${TWC_API_KEY}`,
      { timeout: 50 * 1000 }
    );
    if (!dailyFetch.ok) continue;
    const dailyData = await dailyFetch.json();
    const f = (dailyData.forecasts[0].max_temp ? dailyData.forecasts[0] : dailyData.forecasts[1]) || dailyData.forecasts[1];
    travelData[key] = {
      header_label: f.dow,
      icon_extd: f.day?.icon_extd || f.night?.icon_extd,
      high_temp: f.max_temp,
      low_temp: f.min_temp,
    };
  }

  // --- Main hourly/daily ---
  const hourly = [];
  for (const row of mainData.hourly) {
    const results = [];
    for (const city of row) {
      const res = await getHourly(city.city_label);
      results.push(res);
    }
    hourly.push(results);
  }

  const daily = [];
  for (const row of mainData.daily) {
    const results = [];
    for (const city of row) {
      const res = await getDaily(city.city_label);
      results.push(res);
    }
    daily.push(results);
  }

  // Update & write back
  const updatedMain = { ...mainData, hourly, daily };
  fs.writeFileSync(travelPath, JSON.stringify(travelData, null, 2), "utf-8");
  fs.writeFileSync(mainPath, JSON.stringify(updatedMain, null, 2), "utf-8");
}

module.exports = function dataRes(data_type) {
  const dataType = String(data_type).toLowerCase();
  const tsPath = path.join(dir, "satlf_ts");

  const shouldUpdate =
    !fs.existsSync(tsPath) ||
    (Number(fs.readFileSync(tsPath, "utf-8")) + 1200 <
      Math.floor(Date.now() / 1000));

  if (shouldUpdate) {
    getData().catch(console.error);
    fs.writeFileSync(tsPath, String(Math.floor(Date.now() / 1000)), "utf-8")
  }

  if (dataType === "travel") {
    return fs.readFileSync(path.join(dir, "satlf_travel.json"), "utf-8");
  } else {
    return fs.readFileSync(path.join(dir, "satlf_main.json"), "utf-8");
  }
};

//dataRes("travel")