const { writeFileSync, readFileSync, fstat } = require("fs");
const path = require("path");
const tzlookup = require('tz-lookup');



function getTWCMap1(lat, lon, locationName = "Unknown Location") {
  const mapBounds = {
    topLat: 52.736356,
    leftLon: -131.966606,
    bottomLat: 16.455981,
    rightLon: -60.465581,
    mapWidth: 39421,
    mapHeight: 20836,
  };

  // --- Compute map pixel coordinates (bottom-right origin) ---
  const mapcutX = Math.round(
    Math.round((mapBounds.rightLon - lon) / (mapBounds.rightLon - mapBounds.leftLon) * mapBounds.mapWidth) /
      1.157266811279826
  );
  const mapcutY = Math.round(
    Math.round((lat - mapBounds.bottomLat) / (mapBounds.topLat - mapBounds.bottomLat) * mapBounds.mapHeight) * 1
  );

  // --- Proportional cut sizes ---
  const mapcutSize = [
    Math.round(mapBounds.mapWidth * 0.12 * 1.048404142887339),
    Math.round(mapBounds.mapHeight * 0.11 * 1.048404142887339),
  ];
  const datacutSize = [
    Math.round(mapBounds.mapWidth * 0.014 * 1.027072758037225),
    Math.round(mapBounds.mapHeight * 0.013 * 1.052264808362369),
  ];

  // --- Datacut coordinates ---
  const datacutX = Math.round(mapcutX / 9.951206140350877);
  const datacutY = Math.round(mapcutY / 10.15918958031838);

  return `d = twc.Data(
    mapName='mercator.us.bfg',
    mapcutCoordinate=(${mapcutX},${mapcutY}),
    mapcutSize=(${mapcutSize[0]},${mapcutSize[1]}),
    mapFinalSize=(248,123),
    mapMilesSize=(450,270),
    datacutType='radar.us',
    datacutCoordinate=(${datacutX},${datacutY}),
    datacutSize=(${datacutSize[0]},${datacutSize[1]}),
    dataFinalSize=(248,123),
    dataOffset=(0,0),
    vectors=['mercator.us.ushighways.vg','mercator.us.counties.vg','mercator.us.states.vg','mercator.us.coastlines.vg','mercator.us.statehighways.vg','mercator.us.otherroutes.vg','mercator.us.interstates.vg',],
)
# Centered on ${locationName}`;
}


function getTWCMap2(lat, lon, locationName = "Unknown Location") {
  const mapBounds = {
    topLat: 52.736356,
    leftLon: -131.966606,
    bottomLat: 16.455981,
    rightLon: -60.465581,
    mapWidth: 39421,
    mapHeight: 20836,
  };

  // --- Compute map pixel coordinates (bottom-right origin) ---
  const mapcutX = Math.round(
    Math.round((mapBounds.rightLon - lon) / (mapBounds.rightLon - mapBounds.leftLon) * mapBounds.mapWidth) /
      1.157266811279826
  );
  const mapcutY = Math.round(
    Math.round((lat - mapBounds.bottomLat) / (mapBounds.topLat - mapBounds.bottomLat) * mapBounds.mapHeight) *
      1
  );

  // --- Proportional cut sizes ---
  const mapcutSize = [
    Math.round(mapBounds.mapWidth * 0.12 / 1.896952686447474),
    Math.round(mapBounds.mapHeight * 0.11 / 1.378232110643416),
  ];
  const datacutSize = [
    Math.round(mapBounds.mapWidth * 0.014),
    Math.round(mapBounds.mapHeight * 0.013),
  ];

  // --- Datacut coordinates ---
  const datacutX = Math.round(mapcutX / 9.951206140350877);
  const datacutY = Math.round(mapcutY / 10.15918958031838);

  return `d = twc.Data(
    mapName='mercator.us.bfg',
    mapcutCoordinate=(${mapcutX},${mapcutY}),
    mapcutSize=(${mapcutSize[0]},${mapcutSize[1]}),
    mapFinalSize=(720,480),
    mapMilesSize=(217,174),
    datacutType='radar.us',
    datacutCoordinate=(${datacutX},${datacutY}),
    datacutSize=(${datacutSize[0]},${datacutSize[1]}),
    dataFinalSize=(720,480),
    dataOffset=(0,0),
    vectors=['mercator.us.ushighways.vg','mercator.us.counties.vg','mercator.us.states.vg','mercator.us.coastlines.vg','mercator.us.statehighways.vg','mercator.us.otherroutes.vg','mercator.us.interstates.vg',],
    activeVocalCue=1,
)
# Centered on ${locationName}`;
}


// === Shared map bounds ===
const mapBounds = {
  topLat: 52.736356,
  leftLon: -131.966606,
  bottomLat: 16.455981,
  rightLon: -60.465581,
  mapWidth: 39406,
  mapHeight: 20672,
};

/**
 * Radar_LocalDoppler (Small product)
 * Output size: 248x123
 */
function generateRadarLocalDoppler(center, places, title = "Radar_LocalDoppler") {
  const OUTPUT = { width: 248, height: 123 };

  // --- Project lat/lon to map pixels ---
  function project(lat, lon) {
    const x = Math.round(((lon - mapBounds.leftLon) / (mapBounds.rightLon - mapBounds.leftLon) * mapBounds.mapWidth) / 1.157266811279826);
    const y = Math.round(((mapBounds.topLat - lat) / (mapBounds.topLat - mapBounds.bottomLat) * mapBounds.mapHeight) * 3.151515151515152);
    return { x, y };
  }

  // --- Get the pixel coordinates for the mapcut center ---
  const centerMap = project(center.lat, center.long);

  // --- Compute bounding box of the displayed region ---
  const mapcutSize = [mapBounds.mapWidth * 0.12, mapBounds.mapHeight * 0.11];
  const halfWidth = mapcutSize[0] / 2;
  const halfHeight = mapcutSize[1] / 2;

  // --- Convert map pixels to final image coordinates (scaled to 248x123) ---
  function toOutput(lat, lon) {
    const { x, y } = project(lat, lon);
    const relX = (x - (centerMap.x - halfWidth)) / mapcutSize[0];
    const relY = (y - (centerMap.y - halfHeight)) / mapcutSize[1];
    return {
      x: Math.round(relX * OUTPUT.width),
      y: Math.round(relY * OUTPUT.height)
    };
  }

  const coords = places.map(p => ({ ...p, ...toOutput(p.lat, p.long) }));

  const dotCoords = coords.map(c => `                 ( ( (${c.x},${c.y}),),),`).join("\n");
  const textEntries = coords.map(c => `                 ( ( (${c.x},${c.y}),'${c.prsntNm}',),),`).join("\n");

  return `#
# ${title} (PRODUCT DATA)
#
d = twc.Data(
  tiffImage = [
             (
               ('locatorDotSmallOutline',0,2,1,),
               (
${dotCoords}
               ),
             ),
             (
               ('locatorDotSmall',0,1,0,),
               (
${dotCoords}
               ),
             ),
        ],
  textString = [
             (
               ('Interstate-Bold',14,(255,255,255,192),1,0,0,(20,20,20,128),2,0,0,),
               (
${textEntries}
               ),
             ),
             (
               ('Interstate-Bold',14,(255,255,255,255),1,0,0,(20,20,20,64),1,0,0,),
               (
${textEntries}
               ),
             ),
        ],
  vector = [
             (( 6,(20,20,20,96),1,),(('statehighways',),),),
             (( 6,(20,20,20,96),1,),(('ushighways',),),),
             (( 6,(20,20,20,96),1,),(('interstates',),),),
             (( 6,(20,20,20,96),1,),(('otherroutes',),),),
             (( 1,(20,20,20,255),2,),(('counties',),),),
             (( 2,(20,20,20,255),2,),(('states',),),),
             (( 1,(20,20,20,255),2,),(('coastlines',),),),
             (( 3,(130,130,130,255),2,),(('statehighways',),),),
             (( 3,(130,130,130,255),2,),(('ushighways',),),),
             (( 3,(130,130,130,255),2,),(('interstates',),),),
             (( 3,(130,130,130,255),2,),(('otherroutes',),),),
        ],
)
# Centered on ${center.prsntNm}`;
}


/**
 * Local_LocalDoppler (Larger product)
 * Output size: 720x480
 */
function generateLocalLocalDoppler(center, places, title = "Local_LocalDoppler") {
  const OUTPUT = { width: 720, height: 480 };

  function project(lat, lon) {
    const x = (lon - mapBounds.leftLon) / (mapBounds.rightLon - mapBounds.leftLon) * mapBounds.mapWidth;
    const y = (mapBounds.topLat - lat) / (mapBounds.topLat - mapBounds.bottomLat) * mapBounds.mapHeight;
    return { x, y };
  }

  const centerMap = project(center.lat, center.long);
  const mapcutSize = [mapBounds.mapWidth * 0.12, mapBounds.mapHeight * 0.11];
  const halfWidth = mapcutSize[0] / 2;
  const halfHeight = mapcutSize[1] / 2;

  function toOutput(lat, lon) {
    const { x, y } = project(lat, lon);
    const relX = (x - (centerMap.x - halfWidth)) / mapcutSize[0];
    const relY = (y - (centerMap.y - halfHeight)) / mapcutSize[1];
    return {
      x: Math.round(relX * OUTPUT.width),
      y: Math.round(relY * OUTPUT.height)
    };
  }

  const coords = places.map(p => ({ ...p, ...toOutput(p.lat, p.long) }));
  const locatorLines = coords.map(p => `                 ( ( (${p.x},${p.y}),),),`).join("\n");
  const textLines = coords.map(p => `                 ( ( (${p.x},${p.y}),'${p.prsntNm}',),),`).join("\n");

  return `#
# ${title} (PRODUCT DATA)
#
d = twc.Data(
  tiffImage = [
             (
               ('locatorDotOutline',0,2,1,),
               (
${locatorLines}
               ),
             ),
             (
               ('locatorDot',0,1,0,),
               (
${locatorLines}
               ),
             ),
        ],
  textString = [
             (
               ('Frutiger_Black',20,(230,230,230,205),1,0,0,(20,20,20,128),2,0,0,),
               (
${textLines}
               ),
             ),
             (
               ('Frutiger_Black',20,(230,230,230,255),1,0,0,(20,20,20,128),1,0,0,),
               (
${textLines}
               ),
             ),
        ],
  vector = [
             (( 8,(20,20,20,96),1,),(('statehighways',),),),
             (( 8,(20,20,20,96),1,),(('ushighways',),),),
             (( 8,(20,20,20,96),1,),(('interstates',),),),
             (( 8,(20,20,20,96),1,),(('otherroutes',),),),
             (( 2,(20,20,20,255),2,),(('counties',),),),
             (( 3,(20,20,20,255),2,),(('states',),),),
             (( 2,(20,20,20,255),2,),(('coastlines',),),),
             (( 4,(130,130,130,255),2,),(('statehighways',),),),
             (( 4,(130,130,130,255),2,),(('ushighways',),),),
             (( 4,(130,130,130,255),2,),(('interstates',),),),
             (( 4,(130,130,130,255),2,),(('otherroutes',),),),
        ],
)
# Centered on ${center.prsntNm}`;
}


function generateAllMinneapolisConfigs(center, regionalCities, localRadarCities) {
  const { lat, long: lon, prsntNm } = center;

  // =====================================================================
  // LAMBERT.US.TIF PROJECTION CALCULATIONS (unchanged)
  // =====================================================================
  const lambertRef1 = { lat: 44.98, lon: -93.26, mapX: 3190, mapY: 1873, dataX: 746, dataY: 621 };
  const lambertRef2 = { lat: 36.23, lon: -93.11, mapX: 3073, mapY: 1467, dataX: 494, dataY: 397 };

  const lambertMapX_per_deg_lon = (lambertRef2.mapX - lambertRef1.mapX) / (lambertRef2.lon - lambertRef1.lon);
  const lambertMapY_per_deg_lat = (lambertRef2.mapY - lambertRef1.mapY) / (lambertRef2.lat - lambertRef1.lat);
  const lambertDataX_per_deg_lon = (lambertRef2.dataX - lambertRef1.dataX) / (lambertRef2.lon - lambertRef1.lon);
  const lambertDataY_per_deg_lat = (lambertRef2.dataY - lambertRef1.dataY) / (lambertRef2.lat - lambertRef1.lat);

  const lambertMapX_offset = lambertRef1.mapX - lambertMapX_per_deg_lon * lambertRef1.lon;
  const lambertMapY_offset = lambertRef1.mapY - lambertMapY_per_deg_lat * lambertRef1.lat;
  const lambertDataX_offset = lambertRef1.dataX - lambertDataX_per_deg_lon * lambertRef1.lon;
  const lambertDataY_offset = lambertRef1.dataY - lambertDataY_per_deg_lat * lambertRef1.lat;

  const lambertMapcutX = Math.round(lambertMapX_per_deg_lon * lon + lambertMapX_offset);
  const lambertMapcutY = Math.round(lambertMapY_per_deg_lat * lat + lambertMapY_offset);
  const lambertDatacutX = Math.round(lambertDataX_per_deg_lon * lon + lambertDataX_offset);
  const lambertDatacutY = Math.round(lambertDataY_per_deg_lat * lat + lambertDataY_offset);

  // =====================================================================
  // UNIVERSAL MERCATOR.US.BFG SYSTEM (with real-world bounds)
  // =====================================================================
  const mapBounds = {
    topLat: 52.736356,
    leftLon: -131.966606,
    bottomLat: 16.455981,
    rightLon: -60.465581,
    mapWidth: 39421,
    mapHeight: 20836,
  };

  const mapX_per_deg_lon = mapBounds.mapWidth / (mapBounds.rightLon - mapBounds.leftLon);
  const mapY_per_deg_lat = mapBounds.mapHeight / (mapBounds.bottomLat - mapBounds.topLat);
  const mapX_offset = -mapX_per_deg_lon * mapBounds.leftLon;
  const mapY_offset = -mapY_per_deg_lat * mapBounds.topLat;

  function projectMercator(lat, lon) {
    const mapX = Math.round(mapX_per_deg_lon * lon + mapX_offset);
    const mapY = Math.round(mapY_per_deg_lat * lat + mapY_offset);
    return { mapX, mapY };
  }

  const { mapX: mercMapX, mapY: mercMapY } = projectMercator(lat, lon);

  // =====================================================================
  // RADAR_LOCALDOPPLER (248x123) - Using Mercator mapBounds projection
  // =====================================================================
  const radarOutput = { width: 248, height: 123 };
  const radarMapcutSize = [Math.round(mapBounds.mapWidth * 0.12), Math.round(mapBounds.mapHeight * 0.11)];
  const radarHalfW = radarMapcutSize[0] / 2;
  const radarHalfH = radarMapcutSize[1] / 2;

  function toRadarCoords(cityLat, cityLon) {
    const { mapX, mapY } = projectMercator(cityLat, cityLon);
    const relX = (mapX - (mercMapX - radarHalfW)) / radarMapcutSize[0];
    const relY = (mapY - (mercMapY - radarHalfH)) / radarMapcutSize[1];
    return {
      x: Math.round(relX * radarOutput.width),
      y: Math.round(relY * radarOutput.height)
    };
  }

  const radarCityCoords = regionalCities.map(c => ({ ...c, ...toRadarCoords(c.lat, c.long) }));

  const radarMapcutX = mercMapX;
  const radarMapcutY = mercMapY;
  const radarDatacutX = Math.round(mercMapX / 10);
  const radarDatacutY = Math.round(mercMapY / 10);
  const radarDatacutSize = [Math.round(radarMapcutSize[0] / 8), Math.round(radarMapcutSize[1] / 8)];

  // =====================================================================
  // LOCAL_LOCALDOPPLER (720x480) - Using same Mercator logic
  // =====================================================================
  const localOutput = { width: 720, height: 480 };
  const localMapcutSize = [Math.round(mapBounds.mapWidth * 0.12), Math.round(mapBounds.mapHeight * 0.11)];
  const localHalfW = localMapcutSize[0] / 2;
  const localHalfH = localMapcutSize[1] / 2;

  function toLocalCoords(cityLat, cityLon) {
    const { mapX, mapY } = projectMercator(cityLat, cityLon);
    const relX = (mapX - (mercMapX - localHalfW)) / localMapcutSize[0];
    const relY = (mapY - (mercMapY - localHalfH)) / localMapcutSize[1];
    return {
      x: Math.round(relX * localOutput.width),
      y: Math.round(relY * localOutput.height)
    };
  }

  const localCityCoords = localRadarCities.map(c => ({ ...c, ...toLocalCoords(c.lat, c.long) }));

  const localMapcutX = mercMapX;
  const localMapcutY = mercMapY;
  const localDatacutX = Math.round(mercMapX / 10);
  const localDatacutY = Math.round(mercMapY / 10);
  const localDatacutSize = [Math.round(localMapcutSize[0] / 8), Math.round(localMapcutSize[1] / 8)];

  // =====================================================================
  // REGIONAL FORECAST CITY PROJECTION (unchanged)
  // =====================================================================
  const regionalPixelCenter = { x: 413, y: 272 };
  const regionalScale = 6.5;
  function projectRegional(cityLat, cityLon) {
    const dx = (cityLon - lon) * regionalScale * Math.cos(lat * Math.PI / 180);
    const dy = (lat - cityLat) * regionalScale;
    return { x: Math.round(regionalPixelCenter.x + dx), y: Math.round(regionalPixelCenter.y + dy) };
  }
  const regionalCoords = regionalCities.map(c => ({ ...c, ...projectRegional(c.lat, c.long) }));

  // =====================================================================
  // String outputs for cities
  // =====================================================================
  const radarDotCoords = radarCityCoords.map(c => `                 ( ( (${c.x},${c.y}),),),`).join("\n");
  const radarTextEntries = radarCityCoords.map(c => `                 ( ( (${c.x},${c.y}),'${c.prsntNm}',),),`).join("\n");
  const localLocatorLines = localCityCoords.map(c => `                 ( ( (${c.x},${c.y}),),),`).join("\n");
  const localTextLines = localCityCoords.map(c => `                 ( ( (${c.x},${c.y}),'${c.prsntNm}',),),`).join("\n");
  const fcstIconEntries = regionalCoords.map(c => `                 ( '${c.coopId}',(${c.x},${c.y}),),`).join('\n');
  const fcstValueEntries = regionalCoords.map(c => `                 ( '${c.coopId}',(${c.x},${c.y + 40}),),`).join('\n');
  const textStringEntries = regionalCoords.map(c => `                 ( (${c.x - 40},${c.y + 74}),'${c.prsntNm}',),`).join('\n');


  // =====================================================================
  // GENERATE FULL CONFIGURATION
  // =====================================================================

  return `# Generated for ${prsntNm}
# MAP: 67
# Local_RadarSatelliteComposite (MAP DATA)
#
d = twc.Data(mapName='lambert.us.tif',
             mapcutCoordinate=(${lambertMapcutX},${lambertMapcutY}),
             mapcutSize=(1500,1000),
             mapFinalSize=(720,480),
             mapMilesSize=(1454,982),
             datacutType='radarSatellite.us',
             datacutCoordinate=(${lambertDatacutX},${lambertDatacutY}),
             datacutSize=(771,516),
             dataFinalSize=(720,480),
             dataOffset=(0,0),
             vectors=['lambert.us.coastlines.vg','lambert.us.states.vg',],
)
wxdata.setMapData('Config.1.Core4.0.Local_RadarSatelliteComposite.0', d, 0)
wxdata.setMapData('Config.1.SevereCore1A.0.Local_RadarSatelliteComposite.0', d, 0)
#
# Local_RadarSatelliteComposite (PRODUCT DATA)
#
d = twc.Data(
  vector = [
             (( 2,(20,20,20,255),2,),(('states',),),),
             (( 2,(20,20,20,255),2,),(('coastlines',),),),
        ],
)
dsm.set('Config.1.Core4.0.Local_RadarSatelliteComposite.0', d, 0)
dsm.set('Config.1.SevereCore1A.0.Local_RadarSatelliteComposite.0', d, 0)

# MAP: -302
# Local_FrostFreezeWarnings (MAP DATA)
#
d = twc.Data(mapName='lambert.us.tif',
             mapcutCoordinate=(${lambertMapcutX},${lambertMapcutY}),
             mapcutSize=(2276,1517),
             mapFinalSize=(720,480),
             mapMilesSize=(2184,1486),
             datacutType='frostFreeze.us',
             datacutCoordinate=(${lambertDatacutX},${lambertDatacutY}),
             datacutSize=(1471,903),
             dataFinalSize=(720,440),
             dataOffset=(0,0),
             vectors=['lambert.us.coastlines.vg','lambert.us.states.vg',],
)
wxdata.setMapData('Config.1.Garden.0.Local_FrostFreezeWarnings.0', d, 0)
#
# Local_FrostFreezeWarnings (PRODUCT DATA)
#
d = twc.Data(
  vector = [
             (( 2,(20,20,20,255),2,),(('states',),),),
             (( 2,(20,20,20,255),2,),(('coastlines',),),),
        ],
)
dsm.set('Config.1.Garden.0.Local_FrostFreezeWarnings.0', d, 0)

# MAP: 116
# Local_SnowfallQpfForecast (MAP DATA)
#
d = twc.Data(mapName='lambert.us.tif',
             mapcutCoordinate=(${lambertMapcutX},${lambertMapcutY}),
             mapcutSize=(2276,1517),
             mapFinalSize=(720,480),
             mapMilesSize=(2184,1486),
             datacutType='snowfallQpfForecast.us',
             datacutCoordinate=(${lambertDatacutX},${lambertDatacutY}),
             datacutSize=(1471,903),
             dataFinalSize=(720,440),
             dataOffset=(0,0),
             vectors=['lambert.us.coastlines.vg','lambert.us.states.vg',],
)
wxdata.setMapData('Config.1.Ski.0.Local_SnowfallQpfForecast.0', d, 0)
#
# Local_SnowfallQpfForecast (PRODUCT DATA)
#
d = twc.Data(
  vector = [
             (( 2,(20,20,20,255),2,),(('states',),),),
             (( 2,(20,20,20,255),2,),(('coastlines',),),),
        ],
)
dsm.set('Config.1.Ski.0.Local_SnowfallQpfForecast.0', d, 0)

# MAP: 51
# Local_NationalTravelWeather (MAP DATA)
#
d = twc.Data(mapName='lambert.us.tif',
             mapcutCoordinate=(1451,293),
             mapcutSize=(4792,3194),
             mapFinalSize=(720,480),
             mapMilesSize=(4360,3075),
             datacutType='travelWeather.us',
             datacutCoordinate=(0,0),
             datacutSize=(2048,1300),
             dataFinalSize=(476,301),
             dataOffset=(129,84),
             vectors=['lambert.us.coastlines.vg','lambert.us.states.vg',],
)
wxdata.setMapData('Config.1.Travel.0.Local_NationalTravelWeather.0', d, 0)
#
# Local_NationalTravelWeather (PRODUCT DATA)
#
d = twc.Data(
  vector = [
             (( 2,(20,20,20,255),2,),(('states',),),),
             (( 2,(20,20,20,255),2,),(('coastlines',),),),
        ],
)
dsm.set('Config.1.Travel.0.Local_NationalTravelWeather.0', d, 0)

# MAP: 231
# Local_RegionalForecastConditions (MAP DATA)
#
d = twc.Data(mapName='mercator.us.bfg',
             mapcutCoordinate=(12019,10668),
             mapcutSize=(14304,9536),
             mapFinalSize=(720,480),
             mapMilesSize=(1283,1027),
             vectors=['mercator.us.states.vg','mercator.us.coastlines.vg',],
)
wxdata.setMapData('Config.1.Travel.0.Local_RegionalForecastConditions.0', d, 0)
#
# Local_RegionalForecastConditions (PRODUCT DATA)
#
d = twc.Data(
  fcstIcon = [
             (
               (0,2,0,),
               (
${fcstIconEntries}
               ),
             ),
        ],
  fcstValue = [
             (
               ('Frutiger_Bold',26,(212,212,0,255),1,0,'highTemp',1,(),2,0,),
               (
${fcstValueEntries}
               ),
             ),
        ],
  textString = [
             (
               ('Frutiger_Black',19,(212,212,212,255),1,0,0,(),2,0,1,),
               (
${textStringEntries}
               ),
             ),
        ],
  vector = [
             (( 2,(20,20,20,255),1,),(('states',),),),
             (( 2,(20,20,20,255),1,),(('coastlines',),),),
        ],
)
dsm.set('Config.1.Travel.0.Local_RegionalForecastConditions.0', d, 0)

# MAP: -301
# Local_EstimatedPrecipitation (MAP DATA)
#
d = twc.Data(mapName='lambert.us.tif',
             mapcutCoordinate=(${lambertMapcutX},${lambertMapcutY}),
             mapcutSize=(2276,1517),
             mapFinalSize=(720,480),
             mapMilesSize=(2184,1486),
             datacutType='estimatedPrecip.us',
             datacutCoordinate=(${lambertDatacutX},${lambertDatacutY}),
             datacutSize=(1471,903),
             dataFinalSize=(720,440),
             dataOffset=(0,0),
             vectors=['lambert.us.coastlines.vg','lambert.us.states.vg',],
)
wxdata.setMapData('Config.1.Garden.0.Local_EstimatedPrecipitation.0', d, 0)
#
# Local_EstimatedPrecipitation (PRODUCT DATA)
#
d = twc.Data(
  vector = [
             (( 2,(20,20,20,255),2,),(('states',),),),
             (( 2,(20,20,20,255),2,),(('coastlines',),),),
        ],
)
dsm.set('Config.1.Garden.0.Local_EstimatedPrecipitation.0', d, 0)

# MAP: -304
# Local_PrecipitationQpfForecast (MAP DATA)
#
d = twc.Data(mapName='lambert.us.tif',
             mapcutCoordinate=(${lambertMapcutX},${lambertMapcutY}),
             mapcutSize=(2276,1517),
             mapFinalSize=(720,480),
             mapMilesSize=(2184,1486),
             datacutType='precipQpfForecast.us',
             datacutCoordinate=(${lambertDatacutX},${lambertDatacutY}),
             datacutSize=(1471,903),
             dataFinalSize=(720,440),
             dataOffset=(0,0),
             vectors=['lambert.us.coastlines.vg','lambert.us.states.vg',],
)
wxdata.setMapData('Config.1.Garden.0.Local_PrecipitationQpfForecast.0', d, 0)
#
# Local_PrecipitationQpfForecast (PRODUCT DATA)
#
d = twc.Data(
  vector = [
             (( 2,(20,20,20,255),2,),(('states',),),),
             (( 2,(20,20,20,255),2,),(('coastlines',),),),
        ],
)
dsm.set('Config.1.Garden.0.Local_PrecipitationQpfForecast.0', d, 0)

# MAP: -303
# Local_PalmerDroughtSeverity (MAP DATA)
#
d = twc.Data(mapName='lambert.us.tif',
             mapcutCoordinate=(${lambertMapcutX},${lambertMapcutY}),
             mapcutSize=(2276,1517),
             mapFinalSize=(720,480),
             mapMilesSize=(2184,1486),
             datacutType='palmerDrought.us',
             datacutCoordinate=(${lambertDatacutX},${lambertDatacutY}),
             datacutSize=(1471,903),
             dataFinalSize=(720,440),
             dataOffset=(0,0),
             vectors=['lambert.us.coastlines.vg','lambert.us.states.vg',],
)
wxdata.setMapData('Config.1.Garden.0.Local_PalmerDroughtSeverity.0', d, 0)
#
# Local_PalmerDroughtSeverity (PRODUCT DATA)
#
d = twc.Data(
  vector = [
             (( 2,(20,20,20,255),2,),(('states',),),),
             (( 2,(20,20,20,255),2,),(('coastlines',),),),
        ],
)
dsm.set('Config.1.Garden.0.Local_PalmerDroughtSeverity.0', d, 0)

# MAP: 246
# Local_InternationalForecast (MAP DATA)
#
d = twc.Data(mapName='mercator.mx.tif',
             mapcutCoordinate=(0,3),
             mapcutSize=(720,480),
             mapFinalSize=(720,480),
             mapMilesSize=(2979,1831),
)
wxdata.setMapData('Config.1.International.0.Local_InternationalForecast.1', d, 0)
#
# Local_InternationalForecast (PRODUCT DATA)
#
d = twc.Data(
  fcstIcon = [
             (
               (0,1,0,),
               (
                 ( '76255000',(206,261),),
                 ( '76393000',(346,201),),
                 ( '76405000',(222,166),),
                 ( '76595000',(570,121),),
                 ( '76679001',(368,95),),
               ),
             ),
        ],
  fcstValue = [
             (
               ('Frutiger_Bold',26,(212,212,0,255),1,0,'highTemp',1,(),1,0,),
               (
                 ( '76255000',(203,301),),
                 ( '76393000',(343,241),),
                 ( '76405000',(211,206),),
                 ( '76595000',(567,161),),
                 ( '76679001',(365,135),),
               ),
             ),
        ],
  textString = [
             (
               ('Frutiger_Black',19,(212,212,212,255),1,0,0,(),1,0,1,),
               (
                 ( (165,335),'Guaymas',),
                 ( (298,275),'Monterrey',),
                 ( (188,240),'La Paz',),
                 ( (538,195),'Cancun',),
                 ( (315,169),'Mexico City',),
               ),
             ),
        ],
)
dsm.set('Config.1.International.0.Local_InternationalForecast.1', d, 0)

# MAP: 240
# Local_InternationalForecast (MAP DATA)
#
d = twc.Data(mapName='lambert.ca.tif',
             mapcutCoordinate=(0,3),
             mapcutSize=(720,480),
             mapFinalSize=(720,480),
             mapMilesSize=(3635,2907),
)
wxdata.setMapData('Config.1.International.0.Local_InternationalForecast.0', d, 0)
#
# Local_InternationalForecast (PRODUCT DATA)
#
d = twc.Data(
  fcstIcon = [
             (
               (0,1,0,),
               (
                 ( '71182000',(574,186),),
                 ( '71627001',(538,92),),
                 ( '71852000',(365,93),),
                 ( '71879001',(241,140),),
                 ( '71892001',(132,103),),
                 ( '71913000',(374,189),),
                 ( '71936000',(247,234),),
                 ( '71966000',(125,285),),
               ),
             ),
        ],
  fcstValue = [
             (
               ('Frutiger_Bold',26,(212,212,0,255),1,0,'highTemp',1,(),1,0,),
               (
                 ( '71182000',(571,226),),
                 ( '71627001',(535,132),),
                 ( '71852000',(362,133),),
                 ( '71879001',(238,180),),
                 ( '71892001',(129,143),),
                 ( '71913000',(371,229),),
                 ( '71936000',(244,274),),
                 ( '71966000',(122,325),),
               ),
             ),
        ],
  textString = [
             (
               ('Frutiger_Black',19,(212,212,212,255),1,0,0,(),1,0,1,),
               (
                 ( (510,260),'Churchill Falls',),
                 ( (497,166),'Montreal',),
                 ( (322,167),'Winnipeg',),
                 ( (194,214),'Edmonton',),
                 ( (84,177),'Vancouver',),
                 ( (335,263),'Churchill',),
                 ( (192,308),'Yellowknife',),
                 ( (90,359),'Dawson',),
               ),
             ),
        ],
)
dsm.set('Config.1.International.0.Local_InternationalForecast.0', d, 0)

# MAP: 72116
# Radar_LocalDoppler (MAP DATA)
#
d = twc.Data(mapName='mercator.us.bfg',
             mapcutCoordinate=(${radarMapcutX},${radarMapcutY}),
             mapcutSize=(${radarMapcutSize[0]},${radarMapcutSize[1]}),
             mapFinalSize=(248,123),
             mapMilesSize=(450,270),
             datacutType='radar.us',
             datacutCoordinate=(${radarDatacutX},${radarDatacutY}),
             datacutSize=(${radarDatacutSize[0]},${radarDatacutSize[1]}),
             dataFinalSize=(248,123),
             dataOffset=(0,0),
             vectors=['mercator.us.ushighways.vg','mercator.us.counties.vg','mercator.us.states.vg','mercator.us.coastlines.vg','mercator.us.statehighways.vg','mercator.us.otherroutes.vg','mercator.us.interstates.vg',],
)
wxdata.setMapData('Config.1.Radar_LocalDoppler.0', d, 0)
#
# Radar_LocalDoppler (PRODUCT DATA)
#
d = twc.Data(
  tiffImage = [
             (
               ('locatorDotSmallOutline',0,2,1,),
${radarDotCoords}
             ),
             (
               ('locatorDotSmall',0,1,0,),
               (
${radarDotCoords}
               ),
             ),
        ],
  textString = [
             (
               ('Interstate-Bold',14,(255,255,255,192),1,0,0,(20,20,20,128),2,0,0,),
               (
${radarTextEntries}
               ),
             ),
             (
               ('Interstate-Bold',14,(255,255,255,255),1,0,0,(20,20,20,64),1,0,0,),
               (
${radarTextEntries}
               ),
             ),
        ],
  vector = [
             (( 6,(20,20,20,96),1,),(('statehighways',),),),
             (( 6,(20,20,20,96),1,),(('ushighways',),),),
             (( 6,(20,20,20,96),1,),(('interstates',),),),
             (( 6,(20,20,20,96),1,),(('otherroutes',),),),
             (( 1,(20,20,20,255),2,),(('counties',),),),
             (( 2,(20,20,20,255),2,),(('states',),),),
             (( 1,(20,20,20,255),2,),(('coastlines',),),),
             (( 3,(130,130,130,255),2,),(('statehighways',),),),
             (( 3,(130,130,130,255),2,),(('ushighways',),),),
             (( 3,(130,130,130,255),2,),(('interstates',),),),
             (( 3,(130,130,130,255),2,),(('otherroutes',),),),
        ],
)
dsm.set('Config.1.Radar_LocalDoppler.0', d, 0)

# Local_LocalDoppler (MAP DATA)
#
d = twc.Data(mapName='mercator.us.bfg',
             mapcutCoordinate=(${localMapcutX},${localMapcutY}),
             mapcutSize=(${localMapcutSize[0]},${localMapcutSize[1]}),
             mapFinalSize=(720,480),
             mapMilesSize=(217,174),
             datacutType='radar.us',
             datacutCoordinate=(${localDatacutX},${localDatacutY}),
             datacutSize=(${localDatacutSize[0]},${localDatacutSize[1]}),
             dataFinalSize=(720,480),
             dataOffset=(0,0),
             vectors=['mercator.us.ushighways.vg','mercator.us.counties.vg','mercator.us.states.vg','mercator.us.coastlines.vg','mercator.us.statehighways.vg','mercator.us.otherroutes.vg','mercator.us.interstates.vg',],
             activeVocalCue=1,
)
wxdata.setMapData('Config.1.Core1.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.Core2.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.Core3.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.SevereCore2.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.SevereCore1B.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.Core5.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.SevereCore1A.0.Local_LocalDoppler.0', d, 0)
#
# Local_LocalDoppler (PRODUCT DATA)
#
d = twc.Data(
  tiffImage = [
             (
               ('locatorDotOutline',0,2,1,),
               (
${localLocatorLines}
               ),
             ),
             (
               ('locatorDot',0,1,0,),
               (
${localLocatorLines}
               ),
             ),
        ],
  textString = [
             (
               ('Frutiger_Black',20,(230,230,230,205),1,0,0,(20,20,20,128),2,0,0,),
               (
${localTextLines}
               ),
             ),
             (
               ('Frutiger_Black',20,(230,230,230,255),1,0,0,(20,20,20,128),1,0,0,),
               (
${localTextLines}
               ),
             ),
        ],
  vector = [
             (( 8,(20,20,20,96),1,),(('statehighways',),),),
             (( 8,(20,20,20,96),1,),(('ushighways',),),),
             (( 8,(20,20,20,96),1,),(('interstates',),),),
             (( 8,(20,20,20,96),1,),(('otherroutes',),),),
             (( 2,(20,20,20,255),2,),(('counties',),),),
             (( 3,(20,20,20,255),2,),(('states',),),),
             (( 2,(20,20,20,255),2,),(('coastlines',),),),
             (( 4,(130,130,130,255),2,),(('statehighways',),),),
             (( 4,(130,130,130,255),2,),(('ushighways',),),),
             (( 4,(130,130,130,255),2,),(('interstates',),),),
             (( 4,(130,130,130,255),2,),(('otherroutes',),),),
        ],
)
dsm.set('Config.1.Core1.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.Core2.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.Core3.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.SevereCore2.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.SevereCore1B.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.Core5.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.SevereCore1A.0.Local_LocalDoppler.0', d, 0)

# Centered on ${prsntNm}`;
}


function grabValue(data, key) {
    // <ConfigItem key="PrimaryLocation" value="" />
    const value = data.split(`<ConfigItem key=\"${key}\" value="`)[1]?.split("\"")[0]
    console.log(value)
    return value;
}

const getRes = require("./lfrecord/locid")

async function generateI1WXSConfigFromI2Config(i2ConfigXml, adCrawls) {
    const coordinates = grabValue(i2ConfigXml, "PrimaryLatitudeLongitude").split("-")
    const primlat = coordinates[0].startsWith("W") ? coordinates[0].replace("W", "-") : coordinates[0].replace("E", "")
    const primlon = coordinates[1].startsWith("S") ? coordinates[1].replace("S", "-") : coordinates[1].replace("N", "")
    const primloc = (await getRes("locId", grabValue(i2ConfigXml, "PrimaryLocation")))
    // Nearby Locations
    const nearbyLocations = [];
    let index = 1;

    while (true) {
    const value = grabValue(i2ConfigXml, `NearbyLocation${index}`);
    if (!value) break;
    const res = await getRes("locId", value)
    nearbyLocations.push(res);
    index++;
    }

    // Regional Map Cities
    const regionalMapCities = [];
    index = 1;

    while (true) {
    const value = grabValue(i2ConfigXml, `RegionalMapCity${index}`);
    if (!value) break;
    const res = await getRes("locId", value)
    console.log(value)
    regionalMapCities.push(res);
    index++;
    }

    // Metro Map Cities
    const metroMapCities = [];
    index = 1;

    while (true) {
    const value = grabValue(i2ConfigXml, `MetroMapCity${index}`);
    if (!value) break;
    const res = await getRes("locId", value)
    metroMapCities.push(res);
    index++;
    }

    // Map Cities
    const mapCities = [];
    index = 1;

    while (true) {
    const value = grabValue(i2ConfigXml, `MapCity${index}`);
    if (!value) break;
    const res = await getRes("locId", value)
    mapCities.push(res);
    index++;
    }

    // Local Radar Cities
    const localRadarCities = [];
    index = 1;

    while (true) {
    const value = grabValue(i2ConfigXml, `LocalRadarCity${index}`);
    if (!value) break;
    const res = await getRes("locId", value)
    localRadarCities.push(res);
    index++;
    }
console.log(regionalMapCities)
const coopIds = []
const teccis = []
const zones = []
const counties = []
const ski = []
const pollen = []
const aqi = []
nearbyLocations.forEach(n => {
    if(!(coopIds.includes(n.coopId))) {coopIds.push(n.coopId)}; if(!(teccis.includes(n.primTecci))) {teccis.push(n.primTecci)}; if(!(zones.includes(n.zoneId))) {zones.push(n.zoneId)}; if(!(counties.includes(n.cntyId))) {counties.push(n.cntyId)}; if(!(ski.includes(n.skiId))) {ski.push(n.skiId)}; if(!(pollen.includes(n.pllnId))) {pollen.push(n.pllnId)}; if(!(aqi.includes(n.epaId)) && (n.epaId != null)) {aqi.push(n.epaId)}
})
localRadarCities.forEach(n => {
    if(!(coopIds.includes(n.coopId))) {coopIds.push(n.coopId)}; if(!(teccis.includes(n.primTecci))) {teccis.push(n.primTecci)}; if(!(zones.includes(n.zoneId))) {zones.push(n.zoneId)}; if(!(counties.includes(n.cntyId))) {counties.push(n.cntyId)}; if(!(ski.includes(n.skiId))) {ski.push(n.skiId)}; if(!(pollen.includes(n.pllnId))) {pollen.push(n.pllnId)}; if(!(aqi.includes(n.epaId)) && (n.epaId != null)) {aqi.push(n.epaId)}
})
regionalMapCities.forEach(n => {
    if(!(coopIds.includes(n.coopId))) {coopIds.push(n.coopId)}; if(!(teccis.includes(n.primTecci))) {teccis.push(n.primTecci)}; if(!(zones.includes(n.zoneId))) {zones.push(n.zoneId)}; if(!(counties.includes(n.cntyId))) {counties.push(n.cntyId)}; if(!(ski.includes(n.skiId))) {ski.push(n.skiId)}; if(!(pollen.includes(n.pllnId))) {pollen.push(n.pllnId)}; if(!(aqi.includes(n.epaId)) && (n.epaId != null)) {aqi.push(n.epaId)}
})
mapCities.forEach(n => {
    if(!(coopIds.includes(n.coopId))) {coopIds.push(n.coopId)}; if(!(teccis.includes(n.primTecci))) {teccis.push(n.primTecci)}; if(!(zones.includes(n.zoneId))) {zones.push(n.zoneId)}; if(!(counties.includes(n.cntyId))) {counties.push(n.cntyId)}; if(!(ski.includes(n.skiId))) {ski.push(n.skiId)}; if(!(pollen.includes(n.pllnId))) {pollen.push(n.pllnId)}; if(!(aqi.includes(n.epaId)) && (n.epaId != null)) {aqi.push(n.epaId)}
})
metroMapCities.forEach(n => {
    if(!(coopIds.includes(n.coopId))) {coopIds.push(n.coopId)}; if(!(teccis.includes(n.primTecci))) {teccis.push(n.primTecci)}; if(!(zones.includes(n.zoneId))) {zones.push(n.zoneId)}; if(!(counties.includes(n.cntyId))) {counties.push(n.cntyId)}; if(!(ski.includes(n.skiId))) {ski.push(n.skiId)}; if(!(pollen.includes(n.pllnId))) {pollen.push(n.pllnId)}; if(!(aqi.includes(n.epaId)) && (n.epaId != null)) {aqi.push(n.epaId)}
})
// Example coordinates
const lat = primloc.lat;
const lng = primloc.long;

// Lookup IANA timezone
const ianaTimezone = tzlookup(lat, lng);

// Map of common US IANA -> POSIX TZ strings
const ianaToPOSIX = {
  "America/Chicago": "CST6CDT",
  "America/New_York": "EST5EDT",
  "America/Denver": "MST7MDT",
  "America/Los_Angeles": "PST8PDT",
  "America/Phoenix": "MST7", // no DST
  "America/Anchorage": "AKST9AKDT",
  "Pacific/Honolulu": "HST10",
};

    let res = `
# Created on ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getUTCDay()]} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][new Date().getUTCMonth()]} ${String(new Date().getUTCDate()).padStart(2, 0)} ${String(new Date().getUTCHours()).padStart(2, 0)}:${String(new Date().getUTCMinutes()).padStart(2, 0)}:${String(new Date().getUTCSeconds()).padStart(2, 0)} GMT ${new Date().getUTCFullYear()}

twc.Log.info('scmt config started')
# EXP: 35
# VIW: 7403
# CLN: 17633
#
def scmtRemove(key):
    try:
        dsm.remove(key)
    except:
        pass
#

#
# Beginning of SCMT deployment
import os
#
dsm.set('scmt_configType', 'wxscan',0)
dsm.set('scmt.ProductTypes',['None'], 0)
#
# MAP: 72116
# Radar_LocalDoppler (MAP DATA)
#
${getTWCMap1(primlon, primlat, "I2 Primary Location")}
wxdata.setMapData('Config.1.Radar_LocalDoppler.0', d, 0)
${generateRadarLocalDoppler(primloc, regionalMapCities, "I2 Primary Location")}
dsm.set('Config.1.Radar_LocalDoppler.0', d, 0)
${getTWCMap2(primlon, primlat, "I2 Primary Location")}
wxdata.setMapData('Config.1.Core1.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.Core2.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.Core3.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.SevereCore2.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.SevereCore1B.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.Core5.0.Local_LocalDoppler.0', d, 0)
wxdata.setMapData('Config.1.SevereCore1A.0.Local_LocalDoppler.0', d, 0)
${generateLocalLocalDoppler(primloc, localRadarCities, "I2 Primary Location")}
dsm.set('Config.1.Core1.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.Core2.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.Core3.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.SevereCore2.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.SevereCore1B.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.Core5.0.Local_LocalDoppler.0', d, 0)
dsm.set('Config.1.SevereCore1A.0.Local_LocalDoppler.0', d, 0)
${generateAllMinneapolisConfigs(primloc, regionalMapCities, localRadarCities)}
dsm.set('Config.1.International.0.Local_InternationalForecast.0', d, 0)
#
wxdata.setInterestList('lambert.us','1',['precipQpfForecast.us','estimatedPrecip.us','travelWeather.us','snowfallQpfForecast.us','palmerDrought.us','frostFreeze.us','radarSatellite.us',])
wxdata.setInterestList('mercator.us','1',['radar.us',])
#
#
wxdata.setInterestList('travelWeather.us.cuts','1',['Config.1.Travel.0.Local_NationalTravelWeather.0',])
wxdata.setInterestList('precipQpfForecast.us.cuts','1',['Config.1.Garden.0.Local_PrecipitationQpfForecast.0',])
wxdata.setInterestList('radar.us.cuts','1',['Config.1.Radar_LocalDoppler.0','Config.1.Core1.0.Local_LocalDoppler.0','Config.1.Core2.0.Local_LocalDoppler.0','Config.1.Core3.0.Local_LocalDoppler.0','Config.1.SevereCore2.0.Local_LocalDoppler.0','Config.1.SevereCore1B.0.Local_LocalDoppler.0','Config.1.Core5.0.Local_LocalDoppler.0','Config.1.SevereCore1A.0.Local_LocalDoppler.0',])
wxdata.setInterestList('estimatedPrecip.us.cuts','1',['Config.1.Garden.0.Local_EstimatedPrecipitation.0',])
wxdata.setInterestList('frostFreeze.us.cuts','1',['Config.1.Garden.0.Local_FrostFreezeWarnings.0',])
wxdata.setInterestList('radarSatellite.us.cuts','1',['Config.1.Core4.0.Local_RadarSatelliteComposite.0','Config.1.SevereCore1A.0.Local_RadarSatelliteComposite.0',])
wxdata.setInterestList('snowfallQpfForecast.us.cuts','1',['Config.1.Ski.0.Local_SnowfallQpfForecast.0',])
wxdata.setInterestList('palmerDrought.us.cuts','1',['Config.1.Garden.0.Local_PalmerDroughtSeverity.0',])
#
wxdata.setInterestList('mapData','1',['lambert.ca','mercator.us','mercator.mx','lambert.us',])
#
wxdata.setInterestList('imageData','1',['frostFreeze.us','palmerDrought.us','radarSatellite.us','snowfallQpfForecast.us','precipQpfForecast.us','radar.us','travelWeather.us','estimatedPrecip.us',])
#
ds.commit()
wxdata.setInterestList('airportId','1',['ATL','BOS','DEN','DFW','FSM','IAD','LAX','LGA','LIT','MEM','MIA','ORD','PHL','PHX','SEA','SFO','SLC','STL','TUL','XNA',])
wxdata.setInterestList('coopId','1',['03772000','06240000','07149000','16242000','45007000','47671000','${coopIds.join("','")}','87576000','94767000',])
wxdata.setInterestList('pollenId','1',['HRO',])
wxdata.setInterestList('obsStation','1',['${teccis.join("','")}',])
wxdata.setInterestList('metroId','1',['178',])
wxdata.setInterestList('climId','1',['033165',])
wxdata.setInterestList('zone','1',['${zones.join("','")}',])
wxdata.setInterestList('aq','1',['${aqi.join("','")}',])
wxdata.setInterestList('skiId','1',['${ski.join("','")}',])
wxdata.setInterestList('county','1',['${counties.join("','")}',])
#
dsm.set('Config.1.Package.21',('Health',0), 0)
dsm.set('Config.1.Package.10',('International',0), 0)
dsm.set('Config.1.Package.8',('Garden',0), 0)
dsm.set('Config.1.Package.4',('International',0), 0)
dsm.set('Config.1.Package.1',('Garden',0), 0)
dsm.set('Config.1.Package.19',('Core2',0), 0)
dsm.set('Config.1.Package.18',('International',0), 0)
dsm.set('Config.1.Package.15',('Garden',0), 0)
dsm.set('Config.1.Package.14',('Core5',0), 0)
dsm.set('Config.1.Package.13',('Health',0), 0)
dsm.set('Config.1.Package.9',('International',0), 0)
dsm.set('Config.1.Package.6',('Garden',0), 0)
dsm.set('Config.1.Package.3',('Core5',0), 0)
dsm.set('Config.1.Package.2',('Health',0), 0)
dsm.set('Config.1.Package.20',('Core2',0), 0)
dsm.set('Config.1.Package.17',('Garden',0), 0)
dsm.set('Config.1.Package.16',('Health',0), 0)
dsm.set('Config.1.Package.12',('International',0), 0)
dsm.set('Config.1.Package.11',('Airport',0), 0)
dsm.set('Config.1.Package.7',('Travel',0), 0)
dsm.set('Config.1.Package.5',('Garden',0), 0)
dsm.set('Config.1.Package.0',('Health',0), 0)
dsm.set('dmaCode','${grabValue(i2ConfigXml, "DmaCode")}', 0)
dsm.set('secondaryObsStation','KBPK', 0)
dsm.set('primaryClimoStation','033165', 0)
dsm.set('stateCode','${grabValue(i2ConfigXml, "StateCode")}', 0)
dsm.set('expRev','617493', 0)
dsm.set('primaryCoopId','${primloc.coopId}', 0)
dsm.set('primarylat',${primlon}, 0)
dsm.set('primaryCounty','${grabValue(i2ConfigXml, "primaryCounty")}', 0)
dsm.set('primaryObsStation','KHRO', 0)
dsm.set('hasTraffic',0, 0)
dsm.set('Config.1.Clock','scmt.clock', 0)
dsm.set('primaryLon',${primlat}, 0)
dsm.set('primaryForecastName','${grabValue(i2ConfigXml, "CityName")}', 0)
dsm.set('primaryZone','${grabValue(i2ConfigXml, "primaryZone")}', 0)
dsm.set('Config.1.SevereClock','scmt_severe.clock', 0)
dsm.set('headendId','${grabValue(i2ConfigXml, "HeadendId")}', 0)
dsm.set('msoName','${grabValue(i2ConfigXml, "MsoName")}', 0)
dsm.set('countryCode','US', 0)
dsm.set('affiliateName','00915', 0)
dsm.set('msoCode','${grabValue(i2ConfigXml, "MsoCode")}', 0)
dsm.set('headendName','${grabValue(i2ConfigXml, "HeadendName").replaceAll("ADOM", "WXS").replaceAll("DDOM", "WXS").replaceAll("HD XD", "WXS").replaceAll("HD", "WXS")}', 0)
dsm.set('zipCode','${grabValue(i2ConfigXml, "ZipCode")}', 0)
dsm.set('Config.1.irdAddress','0000315577006105', 0)
dsm.set('Config.1.bcNetMask','255.255.255.128', 0)
dsm.set('Config.1.bcConnectMethod','E', 0)
dsm.set('Config.1.irdSlave','0', 0)
dsm.set('Config.1.starId','TWCS02040073', 0)
dsm.set('Config.1.bcDialInNumber','', 0)
dsm.set('Config.1.bcGateWay','24.248.219.129', 0)
dsm.set('Config.1.bcIpAddress','24.248.219.130', 0)
#
#  Non Image Maps
#
d = [
'Config.1.International.0.Local_InternationalForecast.0',
'Config.1.International.0.Local_InternationalForecast.1',
]
dsm.set('Config.1.nonImageMaps', d, 0)
#

#
#
wxdata.setTimeZone('${ianaToPOSIX[ianaTimezone] || "UTC0"}')
#
d = twc.Data()
d.affiliateLogo = 'coxLogo'
dsm.set('Config.1.Background_Default.0', d, 0, 1)
#
scmtRemove('Config.1.Travel.LasCrawl_Default')
scmtRemove('Config.1.Ski.LasCrawl_Default')
scmtRemove('Config.1.Golf.LasCrawl_Default')
scmtRemove('Config.1.BoatAndBeach.LasCrawl_Default')
scmtRemove('Config.1.Health.LasCrawl_Default')
scmtRemove('Config.1.Traffic.LasCrawl_Default')
scmtRemove('Config.1.SpanishCore.LasCrawl_Default')
scmtRemove('Config.1.International.LasCrawl_Default')
scmtRemove('Config.1.Core.LasCrawl_Default')
scmtRemove('Config.1.Garden.LasCrawl_Default')
scmtRemove('Config.1.Airport.LasCrawl_Default')
scmtRemove('Config.1.LasCrawl_Default')
#
scmtRemove('Config.1.Core2Spanish.LasCrawl_Default')
scmtRemove('Config.1.Core2.LasCrawl_Default')
scmtRemove('Config.1.Core5.LasCrawl_Default')
scmtRemove('Config.1.Core4Spanish.LasCrawl_Default')
scmtRemove('Config.1.Core3.LasCrawl_Default')
scmtRemove('Config.1.Core1.LasCrawl_Default')
scmtRemove('Config.1.Core4.LasCrawl_Default')
scmtRemove('Config.1.LocalBroadcaster.LasCrawl_Default')
#
d = twc.Data()
d.text = [
${adCrawls.map(c => `(${Math.round(new Date() / 1000) - (3600 * 24)},${Math.round(new Date() / 1000) + (3600 * 24 * 30 * 12)},[(0,23)],'${String(new Date().getUTCMonth() + 1).padStart(2, 0)}${String(new Date().getUTCFullYear()).split("20")[1].padStart(2, 0)}${String(new Date().getUTCFullYear()).padStart(2, 0)}','${c.text}'),\n`)}
]
d.packageGroup = 'Global'
d.crawlFont = 'Frutiger_Bold'
d.crawlFontSize = 21
d.crawlBkgColor = (163,199,235,255)
d.crawlTextColor = (20,20,20,255)
d.maxCrawlSpeed = 2.8
dsm.set('Config.1.LasCrawl_Default', d, 0)
#
#
scmtRemove('Config.1.Health.0.Local_SunSafetyFacts.0')
scmtRemove('Config.1.Airport.0.Local_NationalAirportConditions.0')
scmtRemove('Config.1.Airport.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Core4.0.Local_CurrentConditions.0')
scmtRemove('Config.1.Ski.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Airport.0.Local_NationalAirportConditions.1')
scmtRemove('Config.1.Traffic.0.Local_TrafficReport.0')
scmtRemove('Config.1.Ski.0.Local_SkiConditions.0')
scmtRemove('Config.1.Core4.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.SevereCore1B.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Travel.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Traffic.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Traffic.0.Local_TrafficFlow.0')
scmtRemove('Config.1.Core1.0.Local_LocalObservations.0')
scmtRemove('Config.1.Core3.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Airport.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Airport.0.Local_LocalAirportConditions.1')
scmtRemove('Config.1.Health.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Garden.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Core5.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Core5.0.Local_MenuBoard.0')
scmtRemove('Config.1.Traffic.0.Fcst_TextForecast.0')
scmtRemove('Config.1.SevereCore2.0.Local_SevereWeatherMessage.0')
scmtRemove('Config.1.SevereCore1A.0.Local_CurrentConditions.0')
scmtRemove('Config.1.Core2.0.Local_DaypartForecast.0')
scmtRemove('Config.1.CityTicker_AirportDelays.0')
scmtRemove('Config.1.Airport.0.Local_LocalAirportConditions.2')
scmtRemove('Config.1.Travel.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Ski.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Traffic.0.Local_PackageIntro.0')
scmtRemove('Config.1.Health.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.International.0.Local_InternationalDestinations.3')
scmtRemove('Config.1.International.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Core1.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Core3.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Core3.0.Local_WeatherBulletin.0')
scmtRemove('Config.1.CityTicker_LocalCitiesCurrentConditions.0')
scmtRemove('Config.1.Fcst_DaypartForecast.0')
scmtRemove('Config.1.SevereCore1B.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.SevereCore1B.0.Local_SevereWeatherMessage.0')
scmtRemove('Config.1.SevereCore1B.0.Local_CurrentConditions.0')
scmtRemove('Config.1.Core1.0.Local_TextForecast.0')
scmtRemove('Config.1.Core3.0.Local_CurrentConditions.0')
scmtRemove('Config.1.Core2.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Garden.0.Local_Promo.0')
scmtRemove('Config.1.Traffic.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.SevereCore2.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Core1.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Core1.0.Local_MenuBoard.0')
scmtRemove('Config.1.Core2.0.Local_CurrentConditions.0')
scmtRemove('Config.1.SevereCore2.0.Local_WeatherBulletin.0')
scmtRemove('Config.1.Core2.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Core4.0.Local_WeatherBulletin.0')
scmtRemove('Config.1.Core3.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.International.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Travel.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.SevereCore1A.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Fcst_TextForecast.0')
scmtRemove('Config.1.Airport.0.Local_PackageIntro.0')
scmtRemove('Config.1.Health.0.Local_Promo.0')
scmtRemove('Config.1.Core4.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Airport.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.International.0.Local_PackageIntro.0')
scmtRemove('Config.1.Core5.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Ski.0.Local_SkiConditions.2')
scmtRemove('Config.1.Core4.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Health.0.Local_HealthForecast.0')
scmtRemove('Config.1.CityTicker_TravelCitiesForecast.0')
scmtRemove('Config.1.SevereCore1B.0.Local_ExtendedForecast.0')
scmtRemove('Config.1.Core4.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Garden.0.Fcst_TextForecast.0')
scmtRemove('Config.1.SevereCore2.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Core3.0.Local_TextForecast.0')
scmtRemove('Config.1.Airport.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Airport.0.Local_LocalAirportConditions.0')
scmtRemove('Config.1.SevereCore1B.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.SevereCore1B.0.Local_WeatherBulletin.0')
scmtRemove('Config.1.Core1.0.Local_CurrentConditions.0')
scmtRemove('Config.1.SevereCore1A.0.Local_WeatherBulletin.0')
scmtRemove('Config.1.Core4.0.Local_DaypartForecast.0')
scmtRemove('Config.1.Health.0.Local_PackageIntro.0')
scmtRemove('Config.1.Health.0.Local_OutdoorActivityForecast.0')
scmtRemove('Config.1.SevereCore2.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Core4.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Core3.0.Local_MenuBoard.0')
scmtRemove('Config.1.Core5.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Core2.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Core2.0.Local_ExtendedForecast.0')
scmtRemove('Config.1.SevereCore1A.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Ski.0.Local_SkiConditions.3')
scmtRemove('Config.1.SevereCore1A.0.Local_TextForecast.0')
scmtRemove('Config.1.Garden.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Ski.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Core2.0.Local_MenuBoard.0')
scmtRemove('Config.1.Health.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.International.0.Local_InternationalDestinations.1')
scmtRemove('Config.1.SevereCore1A.0.Local_ExtendedForecast.0')
scmtRemove('Config.1.International.0.Local_InternationalDestinations.4')
scmtRemove('Config.1.Core1.0.Local_Almanac.0')
scmtRemove('Config.1.International.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Airport.0.Local_LocalAirportConditions.3')
scmtRemove('Config.1.Traffic.0.Local_TrafficOverview.0')
scmtRemove('Config.1.SevereCore2.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Health.0.Local_AllergyReport.0')
scmtRemove('Config.1.SevereCore1A.0.Local_LocalObservations.0')
scmtRemove('Config.1.Core2.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.SevereCore1A.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Core5.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Ski.0.Local_SunSafetyFacts.0')
scmtRemove('Config.1.SevereCore1A.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Core2.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Core1.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Core5.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Travel.0.Local_Destinations.1')
scmtRemove('Config.1.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.CityTicker_LocalCitiesForecast.0')
scmtRemove('Config.1.Travel.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Traffic.0.SmLocal_TrafficSponsor.0')
scmtRemove('Config.1.Ski.0.Local_PackageIntro.0')
scmtRemove('Config.1.Ski.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Garden.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Travel.0.Local_Destinations.0')
scmtRemove('Config.1.Garden.0.Local_PackageIntro.0')
scmtRemove('Config.1.CityTicker_TravelCitiesCurrentConditions.0')
scmtRemove('Config.1.International.0.Local_InternationalDestinations.0')
scmtRemove('Config.1.Airport.0.Local_NationalAirportConditions.3')
scmtRemove('Config.1.Core1.0.Local_WeatherBulletin.0')
scmtRemove('Config.1.Traffic.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Health.0.Local_SunSafetyFacts.1')
scmtRemove('Config.1.International.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Core1.0.Local_LocalObservations.1')
scmtRemove('Config.1.Airport.0.Local_NationalAirportConditions.2')
scmtRemove('Config.1.SevereCore1A.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Core2.0.Local_WeatherBulletin.0')
scmtRemove('Config.1.International.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Ski.0.Local_SkiConditions.1')
scmtRemove('Config.1.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.SevereCore1B.0.Local_DaypartForecast.0')
scmtRemove('Config.1.Travel.0.Local_PackageIntro.0')
scmtRemove('Config.1.International.0.Local_InternationalDestinations.2')
scmtRemove('Config.1.SevereCore1A.0.Local_SevereWeatherMessage.0')
scmtRemove('Config.1.Garden.0.Local_GardeningForecast.0')
scmtRemove('Config.1.Core3.0.Fcst_TextForecast.0')
scmtRemove('Config.1.SevereCore1B.0.Cc_LongCurrentConditions.0')
scmtRemove('Config.1.Travel.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Ski.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.Core3.0.Fcst_ExtendedForecast.0')
scmtRemove('Config.1.International.0.Local_InternationalDestinations.5')
scmtRemove('Config.1.Travel.0.Local_Destinations.2')
scmtRemove('Config.1.SevereCore2.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Airport.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Health.0.Local_UltravioletIndex.0')
scmtRemove('Config.1.Garden.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Core1.0.Cc_ShortCurrentConditions.0')
scmtRemove('Config.1.Core1.0.Local_NetworkIntro.0')
scmtRemove('Config.1.Core1.0.Local_ExtendedForecast.0')
scmtRemove('Config.1.Health.0.Local_AirQualityForecast.0')
scmtRemove('Config.1.Core4.0.Local_ExtendedForecast.0')
scmtRemove('Config.1.SevereCore1B.0.Fcst_TextForecast.0')
scmtRemove('Config.1.SevereCore1A.0.Local_LocalObservations.1')
scmtRemove('Config.1.Health.0.Fcst_TextForecast.0')
scmtRemove('Config.1.Core1.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Traffic.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Health.0.Fcst_DaypartForecast.0')
scmtRemove('Config.1.Core4.0.Local_MenuBoard.0')
#
scmtRemove('Config.1.Ski.0')
d = twc.Data()
d.bkgImage = 'ski_bg'
d.packageTitle = 'Ski & Snow'
d.packageFlavor = 1
d.shortPackageTitle = 'SKI'
dsm.set('Config.1.Ski.0', d, 0, 1)
scmtRemove('Config.1.Garden.0')
d = twc.Data()
d.bkgImage = 'garden_bg'
d.packageTitle = 'Garden'
d.packageFlavor = 1
d.shortPackageTitle = 'GARDEN'
dsm.set('Config.1.Garden.0', d, 0, 1)
scmtRemove('Config.1.SevereCore1B.0')
d = twc.Data()
d.bkgImage = 'severe_core_bg'
d.packageTitle = 'Your Local Forecast'
d.packageFlavor = 1
d.shortPackageTitle = 'YOUR LOCAL FORECAST'
dsm.set('Config.1.SevereCore1B.0', d, 0, 1)
scmtRemove('Config.1.SevereCore1A.0')
d = twc.Data()
d.bkgImage = 'severe_core_bg'
d.packageTitle = 'Your Local Forecast'
d.packageFlavor = 1
d.shortPackageTitle = 'YOUR LOCAL FORECAST'
dsm.set('Config.1.SevereCore1A.0', d, 0, 1)
scmtRemove('Config.1.International.0')
d = twc.Data()
d.bkgImage = 'international_bg'
d.packageTitle = 'International Forecast'
d.packageFlavor = 3
d.shortPackageTitle = 'INTERNATIONAL'
dsm.set('Config.1.International.0', d, 0, 1)
scmtRemove('Config.1.SevereCore2.0')
d = twc.Data()
d.bkgImage = 'severe_core_bg'
d.packageTitle = 'Your Local Forecast'
d.packageFlavor = 1
d.shortPackageTitle = 'YOUR LOCAL FORECAST'
dsm.set('Config.1.SevereCore2.0', d, 0, 1)
scmtRemove('Config.1.Airport.0')
d = twc.Data()
d.bkgImage = 'airport_bg'
d.packageTitle = 'Airport Conditions'
d.packageFlavor = 3
d.shortPackageTitle = 'AIRPORT'
dsm.set('Config.1.Airport.0', d, 0, 1)
scmtRemove('Config.1.Core5.0')
d = twc.Data()
d.bkgImage = 'core_bg'
d.packageTitle = 'Your Local Radar'
d.packageFlavor = 0
d.shortPackageTitle = '${String(primloc.prsntNm).toUpperCase()} RADAR'
dsm.set('Config.1.Core5.0', d, 0, 1)
scmtRemove('Config.1.Core4.0')
d = twc.Data()
d.bkgImage = 'core_bg'
d.packageTitle = 'Your Local Forecast'
d.packageFlavor = 1
d.shortPackageTitle = '${String(primloc.prsntNm).toUpperCase()}'
dsm.set('Config.1.Core4.0', d, 0, 1)
scmtRemove('Config.1.Core3.0')
d = twc.Data()
d.bkgImage = 'core_bg'
d.packageTitle = 'Your Local Forecast'
d.packageFlavor = 1
d.shortPackageTitle = '${String(primloc.prsntNm).toUpperCase()}'
dsm.set('Config.1.Core3.0', d, 0, 1)
scmtRemove('Config.1.Core2.0')
d = twc.Data()
d.bkgImage = 'core_bg'
d.packageTitle = 'Your Local Forecast'
d.packageFlavor = 1
d.shortPackageTitle = '${String(primloc.prsntNm).toUpperCase()}'
dsm.set('Config.1.Core2.0', d, 0, 1)
scmtRemove('Config.1.Travel.0')
d = twc.Data()
d.bkgImage = 'travel_bg'
d.packageTitle = 'Travel Forecast'
d.packageFlavor = 1
d.shortPackageTitle = 'TRAVEL'
dsm.set('Config.1.Travel.0', d, 0, 1)
scmtRemove('Config.1.Core1.0')
d = twc.Data()
d.bkgImage = 'core_bg'
d.packageTitle = 'Your Local Forecast'
d.packageFlavor = 1
d.shortPackageTitle = '${String(primloc.prsntNm).toUpperCase()}'
dsm.set('Config.1.Core1.0', d, 0, 1)
scmtRemove('Config.1.Traffic.0')
d = twc.Data()
d.activeCc_LongCurrentConditions = 0
d.activeCc_ShortCurrentConditions = 0
d.activeFcst_DaypartForecast = 0
d.activeFcst_ExtendedForecast = 0
d.activeFcst_TextForecast = 0
d.activeLocal_PackageIntro = 1
d.activeLocal_TrafficFlow = 1
d.activeLocal_TrafficOverview = 1
d.activeLocal_TrafficReport = 1
d.activeSmLocal_TrafficSponsor = 1
d.bkgImage = 'traffic_bg'
d.packageTitle = 'Traffic Report'
d.packageFlavor = 3
d.shortPackageTitle = 'TRAFFIC'
dsm.set('Config.1.Traffic.0', d, 0, 1)
scmtRemove('Config.1.Health.0')
d = twc.Data()
d.bkgImage = 'health_bg'
d.packageTitle = 'Weather & Your Health'
d.packageFlavor = 2
d.shortPackageTitle = 'HEALTH'
dsm.set('Config.1.Health.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'neighborhood_bg'
dsm.set('Config.1.Core3.0.Local_MenuBoard.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Health.0.Local_HealthForecast.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${primloc.primTecci}','${nearbyLocations[0].primTecci}',]
d.locName = ['${primloc.prsntNm}','${nearbyLocations[0].prsntNm}',]
d.elementDurationShort = 6
dsm.set('Config.1.Cc_ShortCurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm} Area'
d.zone = '${primloc.zoneId}'
dsm.set('Config.1.SevereCore2.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.SevereCore1A.0.Local_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${primloc.primTecci}','${nearbyLocations[0].primTecci}',]
d.locName = ['${primloc.prsntNm}','${nearbyLocations[0].prsntNm}',]
dsm.set('Config.1.Core3.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.SevereCore1B.0.Local_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'international_intro_bg'
dsm.set('Config.1.International.0.Local_PackageIntro.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm} Area'
d.zone = '${primloc.zoneId}'
dsm.set('Config.1.SevereCore1B.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${primloc.primTecci}','${nearbyLocations[0].primTecci}',]
d.locName = ['${primloc.prsntNm}','${nearbyLocations[0].prsntNm}',]
d.elementDurationLong = 6
dsm.set('Config.1.Cc_LongCurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${nearbyLocations.map(c => `${c.primTecci}','`)}',]
d.locName = ['${nearbyLocations.map(c => `${c.prsntNm}','`)}',]
dsm.set('Config.1.CityTicker_LocalCitiesCurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.airportId = ['SFO','PHL','SEA','STL',]
d.obsStation = ['KSFO','KPHL','KSEA','KSTL',]
d.locName = ['San Francisco Int\`l','Philadelphia Int\`l','Seattle - Tacoma Int\`l','Lambert - St. Louis Int\`l',]
dsm.set('Config.1.Airport.0.Local_NationalAirportConditions.3', d, 0, 1)
#
d = twc.Data()
d.airportId = ['MIA','PHX','LIT','IAD',]
d.obsStation = ['KMIA','KPHX','KLIT','KIAD',]
d.locName = ['Miami International','Phoenix / Sky Harbor','Adams Field / Little Rock','Washington Dulles Int\`l',]
dsm.set('Config.1.Airport.0.Local_NationalAirportConditions.2', d, 0, 1)
#
d = twc.Data()
d.airportId = ['DFW','DEN','FSM','SLC',]
d.obsStation = ['KDFW','KDEN','KFSM','KSLC',]
d.locName = ['Dallas / Ft. Worth Int\`l','Denver International','Fort Smith Regional','Salt Lake City Int\`l',]
dsm.set('Config.1.Airport.0.Local_NationalAirportConditions.1', d, 0, 1)
#
d = twc.Data()
d.minPageDuration = 8
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
d.maxPageDuration = 14
dsm.set('Config.1.Core3.0.Local_TextForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['Nassau','Amsterdam','Buenos Aires',]
d.coopId = ['78073000','06240000','87576000',]
dsm.set('Config.1.International.0.Local_InternationalDestinations.3', d, 0, 1)
#
d = twc.Data()
d.airportId = ['LGA','ORD','LAX','ATL',]
d.obsStation = ['KLGA','KORD','KLAX','KATL',]
d.locName = ['New York / LaGuardia','Chicago O\`Hare Int\`l','Los Angeles International','Atlanta International',]
dsm.set('Config.1.Airport.0.Local_NationalAirportConditions.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${primloc.primTecci}','${nearbyLocations[0].primTecci}',]
d.locName = ['${primloc.prsntNm}','${nearbyLocations[0].prsntNm}',]
dsm.set('Config.1.SevereCore1B.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Core4.0.Local_DaypartForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['Rome','Vancouver','Hong Kong',]
d.coopId = ['16242000','71892000','45007000',]
dsm.set('Config.1.International.0.Local_InternationalDestinations.2', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm} Area'
d.zone = '${primloc.zoneId}'
dsm.set('Config.1.Core2.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['Cancun','Tokyo','Sydney',]
d.coopId = ['76595000','47671000','94767000',]
dsm.set('Config.1.International.0.Local_InternationalDestinations.1', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${regionalMapCities.map(c => `${c.primTecci}','`)}',]
d.locName = ['${regionalMapCities.map(c => `${c.prsntNm}','`)}',]
dsm.set('Config.1.CityTicker_TravelCitiesCurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['Toronto','London','Paris',]
d.coopId = ['71624000','03772000','07149000',]
dsm.set('Config.1.International.0.Local_InternationalDestinations.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = '${primloc.primTecci}'
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Health.0.Local_UltravioletIndex.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'neighborhood_bg'
dsm.set('Config.1.Core5.0.Local_MenuBoard.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Fcst_TextForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '/ ${grabValue(i2ConfigXml, "MsoName").split(" ")[0]}'
dsm.set('Config.1.SevereCore1A.0.Local_SevereWeatherMessage.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'neighborhood_bg'
dsm.set('Config.1.Core2.0.Local_MenuBoard.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${primloc.primTecci}','${nearbyLocations[0].primTecci}',]
d.locName = ['${primloc.prsntNm}','${nearbyLocations[0].prsntNm}',]
dsm.set('Config.1.Core2.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.pollenId = '${primloc.pllnId}'
dsm.set('Config.1.Health.0.Local_AllergyReport.0', d, 0, 1)
#
d = twc.Data()
d.minPageDuration = 8
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
d.maxPageDuration = 14
dsm.set('Config.1.Core1.0.Local_TextForecast.0', d, 0, 1)
#
d = twc.Data()
d.summerFlag = 1
dsm.set('Config.1.Health.0.Local_SunSafetyFacts.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['${nearbyLocations.map(c => `${c.prsntNm}','`)}',]
d.coopId = ['${nearbyLocations.map(c => `${c.coopId}','`)}',]
dsm.set('Config.1.CityTicker_LocalCitiesForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm} Area'
d.zone = '${primloc.zoneId}'
dsm.set('Config.1.SevereCore1A.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${primloc.primTecci}','${nearbyLocations[0].primTecci}',]
d.locName = ['${primloc.prsntNm}','${nearbyLocations[0].prsntNm}',]
dsm.set('Config.1.SevereCore1A.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Health.0.Local_OutdoorActivityForecast.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${localRadarCities.map(c => `${c.primTecci}','`)}',]
d.locName = ['${localRadarCities.map(c => `${c.prsntNm}','`)}',]
dsm.set('Config.1.SevereCore1A.0.Local_LocalObservations.1', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm} Area'
d.zone = '${primloc.zoneId}'
dsm.set('Config.1.Core1.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${metroMapCities.map(c => `${c.primTecci}','`)}',]
d.locName = ['${metroMapCities.map(c => `${c.prsntNm}','`)}',]
dsm.set('Config.1.SevereCore1A.0.Local_LocalObservations.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['${regionalMapCities.map(c => `${c.prsntNm}','`)}',]
d.coopId = ['${regionalMapCities.map(c => `${c.coopId}','`)}',]
dsm.set('Config.1.CityTicker_TravelCitiesForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Fcst_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Fcst_DaypartForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm} Area'
d.zone = '${primloc.zoneId}'
dsm.set('Config.1.Core4.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.aq = '${primloc.epaId || "zz001"}'
dsm.set('Config.1.Health.0.Local_AirQualityForecast.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'neighborhood_bg'
dsm.set('Config.1.Core4.0.Local_MenuBoard.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['Orlando','Washington, DC','San Francisco',]
d.coopId = ['72205000','72405000','72494000',]
dsm.set('Config.1.Travel.0.Local_Destinations.2', d, 0, 1)
#
d = twc.Data()
d.locName = ['Atlanta','Dallas','Boston',]
d.coopId = ['72219000','72259000','72509000',]
dsm.set('Config.1.Travel.0.Local_Destinations.1', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'neighborhood_bg'
dsm.set('Config.1.Core1.0.Local_MenuBoard.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${localRadarCities.map(c => `${c.primTecci}','`)}',]
d.locName = ['${localRadarCities.map(c => `${c.prsntNm}','`)}',]
dsm.set('Config.1.Core1.0.Local_LocalObservations.1', d, 0, 1)
#
d = twc.Data()
d.locName = ['New York City','Chicago','Los Angeles',]
d.coopId = ['72503023','72530000','72295023',]
dsm.set('Config.1.Travel.0.Local_Destinations.0', d, 0, 1)
#
d = twc.Data()
d.locName = '/ ${grabValue(i2ConfigXml, "MsoName").split(" ")[0]}'
dsm.set('Config.1.SevereCore1B.0.Local_SevereWeatherMessage.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.SevereCore1B.0.Local_DaypartForecast.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${primloc.primTecci}','${nearbyLocations[0].primTecci}',]
d.locName = ['${primloc.prsntNm}','${nearbyLocations[0].prsntNm}',]
dsm.set('Config.1.Core1.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${metroMapCities.map(c => `${c.primTecci}','`)}',]
d.locName = ['${metroMapCities.map(c => `${c.prsntNm}','`)}',]
dsm.set('Config.1.Core1.0.Local_LocalObservations.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = ['${primloc.primTecci}','${nearbyLocations[0].primTecci}',]
d.locName = ['${primloc.prsntNm}','${nearbyLocations[0].prsntNm}',]
dsm.set('Config.1.Core4.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.bkgImage = 'neighborhood_bg'
d.affiliateName = '${grabValue(i2ConfigXml, "MsoName")}'
dsm.set('Config.1.Core1.0.Local_NetworkIntro.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'airport_intro_bg'
dsm.set('Config.1.Airport.0.Local_PackageIntro.0', d, 0, 1)
#
d = twc.Data()
d.climId = '033165'
d.latitude = 36.22
d.longitude = -93.13
d.locName = 'Harrison'
d.coopId = '72440066'
dsm.set('Config.1.Core1.0.Local_Almanac.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'garden_intro_bg'
dsm.set('Config.1.Garden.0.Local_PackageIntro.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Core1.0.Local_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Core4.0.Local_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Core2.0.Local_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '/ ${grabValue(i2ConfigXml, "MsoName").split(" ")[0]}'
dsm.set('Config.1.SevereCore2.0.Local_SevereWeatherMessage.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Core2.0.Local_DaypartForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${primloc.prsntNm}'
d.coopId = '${primloc.coopId}'
dsm.set('Config.1.Garden.0.Local_GardeningForecast.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'travel_intro_bg'
dsm.set('Config.1.Travel.0.Local_PackageIntro.0', d, 0, 1)
#
d = twc.Data()
d.airportId = 'TUL'
d.obsStation = 'KTUL'
d.locName = 'Tulsa International Airport'
dsm.set('Config.1.Airport.0.Local_LocalAirportConditions.1', d, 0, 1)
#
d = twc.Data()
d.promoText = ['For more on weather and your health','tune to The Weather Channel or','go to weather.com/health',]
d.promoImage = 'health_promo'
d.promoLogo = 'blankLogo'
dsm.set('Config.1.Health.0.Local_Promo.0', d, 0, 1)
#
d = twc.Data()
d.airportId = ['XNA','FSM',]
d.obsStation = ['KXNA','KFSM',]
d.locName = ['Northwest Regional Arpt.','Fort Smith Regional Arpt.',]
dsm.set('Config.1.CityTicker_AirportDelays.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'health_intro_bg'
dsm.set('Config.1.Health.0.Local_PackageIntro.0', d, 0, 1)
#
d = twc.Data()
d.airportId = 'XNA'
d.obsStation = 'KXNA'
d.locName = 'Northwest Arkansas Regional Arpt.'
dsm.set('Config.1.Airport.0.Local_LocalAirportConditions.0', d, 0, 1)
#
d = twc.Data()
d.preRoll = 8
d.schedule = ((14,60),(29,60),(44,60),(58,120),)
dsm.set('Config.1.Local_Avail_Schedule', d, 0)
#
# End of SCMT deployment
#
twc.Log.info('scmt config finished')
# Finished generation on ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getUTCDay()]} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][new Date().getUTCMonth()]} ${String(new Date().getUTCDate()).padStart(2, 0)} ${String(new Date().getUTCHours()).padStart(2, 0)}:${String(new Date().getUTCMinutes()).padStart(2, 0)}:${String(new Date().getUTCSeconds()).padStart(2, 0)} GMT ${new Date().getUTCFullYear()}
`
console.log(regionalMapCities)
console.log(primlon, primlat, "I2 Primary Location")
    writeFileSync(path.join(__dirname, "temp"), res, "utf-8")
}

//generateI1WXSConfigFromI2Config(readFileSync(path.join(__dirname, "test.xml"), "utf-8"), [{text:"Brought to you by ClosedTelecom"}])
