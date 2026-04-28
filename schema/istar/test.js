// WeatherScan Configuration Generator
// Generates complete Python configs matching original format

const fs = require('fs').promises;
const xml2js = require('xml2js');

// Map projection utilities
const mapBounds = {
  topLat: 52.736356,
  leftLon: -131.966606,
  bottomLat: 16.455981,
  rightLon: -60.465581,
  mapWidth: 39406,
  mapHeight: 20672,
};

function latLonToMapCoords(lat, lon) {
  const x = Math.round(
    ((lon - mapBounds.leftLon) / (mapBounds.rightLon - mapBounds.leftLon)) * mapBounds.mapWidth
  );
  const y = Math.round(
    ((mapBounds.topLat - lat) / (mapBounds.topLat - mapBounds.bottomLat)) * mapBounds.mapHeight
  );
  return { x, y };
}

function calculateMapCut(centerLat, centerLon, widthMiles, heightMiles, finalWidth, finalHeight) {
  const milesPerDegLat = 69;
  const milesPerDegLon = 54.6;
  
  const latDelta = heightMiles / milesPerDegLat / 2;
  const lonDelta = widthMiles / milesPerDegLon / 2;
  
  const topLeft = latLonToMapCoords(centerLat + latDelta, centerLon - lonDelta);
  const bottomRight = latLonToMapCoords(centerLat - latDelta, centerLon + lonDelta);
  
  const width = bottomRight.x - topLeft.x;
  const height = bottomRight.y - topLeft.y;
  
  return {
    mapcutCoordinate: `(${topLeft.x},${topLeft.y})`,
    mapcutSize: `(${width},${height})`,
    mapFinalSize: `(${finalWidth},${finalHeight})`,
    datacutCoordinate: `(${Math.round(topLeft.x/20)},${Math.round(topLeft.y/20)})`,
    datacutSize: `(${Math.round(width/20)},${Math.round(height/20)})`,
    dataFinalSize: `(${finalWidth},${finalHeight})`,
  };
}

class ConfigGenerator {
  constructor(returnI2LFRecordLoc) {
    this.lookupLocation = returnI2LFRecordLoc;
    this.locationCache = new Map();
  }

  async getLocation(locId) {
    if (!locId) return null;
    if (this.locationCache.has(locId)) {
      return this.locationCache.get(locId);
    }
    const loc = await this.lookupLocation('locId', locId);
    this.locationCache.set(locId, loc);
    return loc;
  }

  async parseXMLConfig(xmlPath) {
    const xmlContent = await fs.readFile(xmlPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlContent);
    return result.Config.ConfigDef[0].ConfigItems[0].ConfigItem;
  }

  getConfigValue(items, key) {
    const item = items.find(i => i.$.key === key);
    return item ? item.$.value : '';
  }

  getTimeZone(longitude) {
    const offset = Math.round(longitude / 15);
    if (offset >= -5) return 'EST5EDT';
    if (offset >= -6) return 'CST6CDT';
    if (offset >= -7) return 'MST7MDT';
    return 'PST8PDT';
  }

  async generateConfig(xmlPath) {
    const items = await this.parseXMLConfig(xmlPath);
    
    // Extract all config values
    const primaryLocId = this.getConfigValue(items, 'PrimaryLocation');
    const cityName = this.getConfigValue(items, 'CityName');
    const stateCode = this.getConfigValue(items, 'StateCode');
    const zipCode = this.getConfigValue(items, 'ZipCode');
    const headendId = this.getConfigValue(items, 'HeadendId');
    const headendName = this.getConfigValue(items, 'HeadendName');
    const msoName = this.getConfigValue(items, 'MsoName');
    const msoCode = this.getConfigValue(items, 'MsoCode');
    const serialNumber = this.getConfigValue(items, 'serialNumber');
    const dmaCode = this.getConfigValue(items, 'DmaCode');
    const localIp = this.getConfigValue(items, 'LocalIpAddress');
    const gateway = this.getConfigValue(items, 'GatewayAddress');
    const netmask = this.getConfigValue(items, 'NetMask');
    const systemId = this.getConfigValue(items, 'SystemId');
    
    // Get primary location
    const primaryLoc = await this.getLocation(primaryLocId);
    
    // Get local radar cities
    const localRadarCities = [];
    for (let i = 1; i <= 8; i++) {
      const locId = this.getConfigValue(items, `LocalRadarCity${i}`);
      if (locId) {
        const loc = await this.getLocation(locId);
        if (loc && loc.locId) localRadarCities.push(loc);
      }
    }

    // Get metro cities
    const metroCities = [];
    for (let i = 1; i <= 8; i++) {
      const locId = this.getConfigValue(items, `MetroMapCity${i}`);
      if (locId) {
        const loc = await this.getLocation(locId);
        if (loc && loc.locId) metroCities.push(loc);
      }
    }

    // Get regional cities
    const regionalCities = [];
    for (let i = 1; i <= 8; i++) {
      const locId = this.getConfigValue(items, `RegionalMapCity${i}`);
      if (locId) {
        const loc = await this.getLocation(locId);
        if (loc && loc.locId) regionalCities.push(loc);
      }
    }

    // Get travel cities
    const travelCities = [];
    for (let i = 1; i <= 5; i++) {
      const locId = this.getConfigValue(items, `TravelCity${i}`);
      if (locId) {
        const loc = await this.getLocation(locId);
        if (loc && loc.locId) travelCities.push(loc);
      }
    }

    // Get airports
    const airports = [];
    for (let i = 1; i <= 3; i++) {
      const airportId = this.getConfigValue(items, `Airport${i}`);
      if (airportId) {
        const code = airportId.split('_')[2];
        if (code) airports.push(code);
      }
    }

    return this.buildPythonConfig({
      primaryLoc,
      localRadarCities,
      metroCities,
      regionalCities,
      travelCities,
      airports,
      cityName,
      stateCode,
      zipCode,
      headendId,
      headendName,
      msoName,
      msoCode,
      serialNumber,
      dmaCode,
      localIp,
      gateway,
      netmask,
      systemId,
    });
  }

  buildPythonConfig(data) {
    const {
      primaryLoc,
      localRadarCities,
      metroCities,
      regionalCities,
      travelCities,
      airports,
      cityName,
      stateCode,
      zipCode,
      headendId,
      headendName,
      msoName,
      msoCode,
      serialNumber,
      dmaCode,
      localIp,
      gateway,
      netmask,
      systemId,
    } = data;

    const timestamp = new Date().toUTCString();
    const centerLat = parseFloat(primaryLoc.lat);
    const centerLon = parseFloat(primaryLoc.long);
    
    // Calculate radar map coordinates
    const radarSmall = calculateMapCut(centerLat, centerLon, 447, 266, 248, 123);
    const radarLarge = calculateMapCut(centerLat, centerLon, 217, 174, 720, 480);
    const radarSatellite = calculateMapCut(centerLat, centerLon, 1454, 982, 720, 480);
    const regionalMap = calculateMapCut(centerLat, centerLon, 2184, 1486, 720, 480);

    // Generate city markers for small radar
    const smallRadarMarkers = localRadarCities.slice(0, 3).map((city, idx) => {
      const offset = idx * 30;
      return {
        coord: `(${146 + offset},${37 + offset})`,
        name: city.prsntNm,
      };
    });

    // Generate city markers for large radar
    const largeRadarMarkers = localRadarCities.slice(0, 9).map((city, idx) => {
      const relLat = parseFloat(city.lat) - centerLat;
      const relLon = parseFloat(city.long) - centerLon;
      const x = 360 + Math.round(relLon * 600);
      const y = 240 - Math.round(relLat * 600);
      return {
        coord: `(${Math.max(50, Math.min(670, x))},${Math.max(50, Math.min(430, y))})`,
        name: city.prsntNm,
      };
    });

    // Generate regional forecast markers
    const regionalMarkers = regionalCities.slice(0, 8).map((city, idx) => {
      const relLat = parseFloat(city.lat) - centerLat;
      const relLon = parseFloat(city.long) - centerLon;
      const x = 360 + Math.round(relLon * 80);
      const y = 240 - Math.round(relLat * 80);
      return {
        coord: `(${Math.max(50, Math.min(670, x))},${Math.max(50, Math.min(430, y))})`,
        name: city.prsntNm,
        coopId: city.coopId,
      };
    });

    return `# Created on ${timestamp}
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
d = twc.Data(mapName='mercator.us.bfg',
             mapcutCoordinate=${radarSmall.mapcutCoordinate},
             mapcutSize=${radarSmall.mapcutSize},
             mapFinalSize=${radarSmall.mapFinalSize},
             mapMilesSize=(447,266),
             datacutType='radar.us',
             datacutCoordinate=${radarSmall.datacutCoordinate},
             datacutSize=${radarSmall.datacutSize},
             dataFinalSize=${radarSmall.dataFinalSize},
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
               ( ${smallRadarMarkers.map(m => `( ${m.coord},),`).join('\n                 ')}
               ),
             ),
             (
               ('locatorDotSmall',0,1,0,),
               ( ${smallRadarMarkers.map(m => `( ${m.coord},),`).join('\n                 ')}
               ),
             ),
        ],
  textString = [
             (
               ('Interstate-Bold',14,(255,255,255,192),1,0,0,(20,20,20,128),2,0,0,),
               ( ${smallRadarMarkers.map(m => `( ${m.coord},'${m.name}',),`).join('\n                 ')}
               ),
             ),
             (
               ('Interstate-Bold',14,(255,255,255,255),1,0,0,(20,20,20,64),1,0,0,),
               ( ${smallRadarMarkers.map(m => `( ${m.coord},'${m.name}',),`).join('\n                 ')}
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
# MAP: 178
# Local_LocalDoppler (MAP DATA)
#
d = twc.Data(mapName='mercator.us.bfg',
             mapcutCoordinate=${radarLarge.mapcutCoordinate},
             mapcutSize=${radarLarge.mapcutSize},
             mapFinalSize=${radarLarge.mapFinalSize},
             mapMilesSize=(217,174),
             datacutType='radar.us',
             datacutCoordinate=${radarLarge.datacutCoordinate},
             datacutSize=${radarLarge.datacutSize},
             dataFinalSize=${radarLarge.dataFinalSize},
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
               ( ${largeRadarMarkers.map(m => `( ${m.coord},),`).join('\n                 ')}
               ),
             ),
             (
               ('locatorDot',0,1,0,),
               ( ${largeRadarMarkers.map(m => `( ${m.coord},),`).join('\n                 ')}
               ),
             ),
        ],
  textString = [
             (
               ('Frutiger_Black',20,(230,230,230,205),1,0,0,(20,20,20,128),2,0,0,),
               ( ${largeRadarMarkers.map(m => `( ${m.coord},'${m.name}',),`).join('\n                 ')}
               ),
             ),
             (
               ('Frutiger_Black',20,(230,230,230,255),1,0,0,(20,20,20,128),1,0,0,),
               ( ${largeRadarMarkers.map(m => `( ${m.coord},'${m.name}',),`).join('\n                 ')}
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
# MAP: 67
# Local_RadarSatelliteComposite (MAP DATA)
#
d = twc.Data(mapName='lambert.us.tif',
             mapcutCoordinate=(3190,1873),
             mapcutSize=(1500,1000),
             mapFinalSize=(720,480),
             mapMilesSize=(1454,982),
             datacutType='radarSatellite.us',
             datacutCoordinate=(746,621),
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
             mapcutCoordinate=${regionalMap.mapcutCoordinate},
             mapcutSize=${regionalMap.mapcutSize},
             mapFinalSize=(720,480),
             mapMilesSize=(2184,1486),
             datacutType='frostFreeze.us',
             datacutCoordinate=${regionalMap.datacutCoordinate},
             datacutSize=${regionalMap.datacutSize},
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
               ( ( '76255000',(206,261),),
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
               ( ( '76255000',(203,301),),
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
               ( ( (165,335),'Guaymas',),
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
               ( ( '71182000',(574,186),),
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
               ( ( '71182000',(571,226),),
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
               ( ( (510,260),'Churchill Falls',),
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
wxdata.setInterestList('airportId','1',[${airports.map(a => `'${a}'`).join(',')}])
wxdata.setInterestList('coopId','1',['${primaryLoc.coopId}',${[...localRadarCities, ...metroCities, ...regionalCities].filter((c, i, arr) => arr.findIndex(x => x.coopId === c.coopId) === i).map(c => `'${c.coopId}'`).join(',')}])
wxdata.setInterestList('pollenId','1',['${primaryLoc.pllnId || 'N/A'}'])
wxdata.setInterestList('obsStation','1',['${primaryLoc.primTecci}',${[...localRadarCities, ...metroCities].filter((c, i, arr) => arr.findIndex(x => x.primTecci === c.primTecci) === i).map(c => `'${c.primTecci}'`).join(',')}])
wxdata.setInterestList('metroId','1',['${dmaCode}'])
wxdata.setInterestList('climId','1',['${primaryLoc.coopId ? primaryLoc.coopId.substring(0, 6) : ''}'])
wxdata.setInterestList('zone','1',['${primaryLoc.zoneId}'])
wxdata.setInterestList('aq','1',['${primaryLoc.epaId || 'zz001'}'])
wxdata.setInterestList('skiId','1',[${primaryLoc.skiId ? `'${primaryLoc.skiId}'` : ''}])
wxdata.setInterestList('county','1',['${primaryLoc.cntyId}'])
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
dsm.set('dmaCode','${dmaCode}', 0)
dsm.set('secondaryObsStation','${localRadarCities[1]?.primTecci || primaryLoc.primTecci}', 0)
dsm.set('primaryClimoStation','${primaryLoc.coopId ? primaryLoc.coopId.substring(0, 6) : ''}', 0)
dsm.set('stateCode','${stateCode}', 0)
dsm.set('expRev','${Math.floor(Math.random() * 9000000 + 1000000)}', 0)
dsm.set('primaryCoopId','${primaryLoc.coopId}', 0)
dsm.set('primarylat',${primaryLoc.lat}, 0)
dsm.set('primaryCounty','${primaryLoc.cntyId}', 0)
dsm.set('primaryObsStation','${primaryLoc.primTecci}', 0)
dsm.set('hasTraffic',0, 0)
dsm.set('Config.1.Clock','scmt.clock', 0)
dsm.set('primaryLon',${primaryLoc.long}, 0)
dsm.set('primaryForecastName','${cityName}', 0)
dsm.set('primaryZone','${primaryLoc.zoneId}', 0)
dsm.set('Config.1.SevereClock','scmt_severe.clock', 0)
dsm.set('headendId','${headendId}', 0)
dsm.set('msoName','${msoName}', 0)
dsm.set('countryCode','US', 0)
dsm.set('affiliateName','${systemId}', 0)
dsm.set('msoCode','${msoCode}', 0)
dsm.set('headendName','${headendName}', 0)
dsm.set('zipCode','${zipCode}', 0)
dsm.set('Config.1.irdAddress','0000315577006105', 0)
dsm.set('Config.1.bcNetMask','${netmask}', 0)
dsm.set('Config.1.bcConnectMethod','E', 0)
dsm.set('Config.1.irdSlave','0', 0)
dsm.set('Config.1.starId','${serialNumber}', 0)
dsm.set('Config.1.bcDialInNumber','', 0)
dsm.set('Config.1.bcGateWay','${gateway}', 0)
dsm.set('Config.1.bcIpAddress','${localIp}', 0)
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
wxdata.setTimeZone('${this.getTimeZone(parseFloat(primaryLoc.long))}')
#
d = twc.Data()
d.affiliateLogo = '${msoName.toLowerCase().includes('cox') ? 'coxLogo' : msoName.toLowerCase().includes('comcast') || msoName.toLowerCase().includes('xfinity') ? 'xfinityLogo' : msoName.toLowerCase().includes('cablevision') ? 'cablevisionLogo' : 'blankLogo'}'
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
d.text=[(1390024800,2098052799,[(0,23)],'480282','LOCAL FORECAST FOR ${cityName.toUpperCase()}, ${stateCode} - YOUR WEATHER ALL DAY, EVERY DAY'),
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
d.shortPackageTitle = '${cityName.toUpperCase()} RADAR'
dsm.set('Config.1.Core5.0', d, 0, 1)
scmtRemove('Config.1.Core4.0')
d = twc.Data()
d.bkgImage = 'core_bg'
d.packageTitle = 'Your Local Forecast'
d.packageFlavor = 1
d.shortPackageTitle = '${cityName.toUpperCase()}'
dsm.set('Config.1.Core4.0', d, 0, 1)
scmtRemove('Config.1.Core3.0')
d = twc.Data()
d.bkgImage = 'core_bg'
d.packageTitle = 'Your Local Forecast'
d.packageFlavor = 1
d.shortPackageTitle = '${cityName.toUpperCase()}'
dsm.set('Config.1.Core3.0', d, 0, 1)
scmtRemove('Config.1.Core2.0')
d = twc.Data()
d.bkgImage = 'core_bg'
d.packageTitle = 'Your Local Forecast'
d.packageFlavor = 1
d.shortPackageTitle = '${cityName.toUpperCase()}'
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
d.shortPackageTitle = '${cityName.toUpperCase()}'
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
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Health.0.Local_HealthForecast.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(0, 2).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(0, 2).map(c => `'${c.prsntNm}'`).join(',')}]
d.elementDurationShort = 6
dsm.set('Config.1.Cc_ShortCurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName} Area'
d.zone = '${primaryLoc.zoneId}'
dsm.set('Config.1.SevereCore2.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.SevereCore1A.0.Local_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(0, 2).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(0, 2).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.Core3.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.SevereCore1B.0.Local_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'international_intro_bg'
dsm.set('Config.1.International.0.Local_PackageIntro.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName} Area'
d.zone = '${primaryLoc.zoneId}'
dsm.set('Config.1.SevereCore1B.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(0, 2).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(0, 2).map(c => `'${c.prsntNm}'`).join(',')}]
d.elementDurationLong = 6
dsm.set('Config.1.Cc_LongCurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${metroCities.slice(0, 10).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${metroCities.slice(0, 10).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.CityTicker_LocalCitiesCurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.airportId = [${airports.slice(9, 13).map(a => `'${a}'`).join(',')}]
d.obsStation = [${airports.slice(9, 13).map(a => `'K${a}'`).join(',')}]
d.locName = [${airports.slice(9, 13).map(a => `'Airport ${a}'`).join(',')}]
dsm.set('Config.1.Airport.0.Local_NationalAirportConditions.3', d, 0, 1)
#
d = twc.Data()
d.airportId = [${airports.slice(5, 9).map(a => `'${a}'`).join(',')}]
d.obsStation = [${airports.slice(5, 9).map(a => `'K${a}'`).join(',')}]
d.locName = [${airports.slice(5, 9).map(a => `'Airport ${a}'`).join(',')}]
dsm.set('Config.1.Airport.0.Local_NationalAirportConditions.2', d, 0, 1)
#
d = twc.Data()
d.airportId = [${airports.slice(1, 5).map(a => `'${a}'`).join(',')}]
d.obsStation = [${airports.slice(1, 5).map(a => `'K${a}'`).join(',')}]
d.locName = [${airports.slice(1, 5).map(a => `'Airport ${a}'`).join(',')}]
dsm.set('Config.1.Airport.0.Local_NationalAirportConditions.1', d, 0, 1)
#
d = twc.Data()
d.minPageDuration = 8
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
d.maxPageDuration = 14
dsm.set('Config.1.Core3.0.Local_TextForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['Nassau','Amsterdam','Buenos Aires',]
d.coopId = ['78073000','06240000','87576000',]
dsm.set('Config.1.International.0.Local_InternationalDestinations.3', d, 0, 1)
#
d = twc.Data()
d.airportId = [${airports.slice(0, 4).map(a => `'${a}'`).join(',')}]
d.obsStation = [${airports.slice(0, 4).map(a => `'K${a}'`).join(',')}]
d.locName = [${airports.slice(0, 4).map(a => `'Airport ${a}'`).join(',')}]
dsm.set('Config.1.Airport.0.Local_NationalAirportConditions.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(0, 2).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(0, 2).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.SevereCore1B.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Core4.0.Local_DaypartForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['Rome','Vancouver','Hong Kong',]
d.coopId = ['16242000','71892000','45007000',]
dsm.set('Config.1.International.0.Local_InternationalDestinations.2', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName} Area'
d.zone = '${primaryLoc.zoneId}'
dsm.set('Config.1.Core2.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['Cancun','Tokyo','Sydney',]
d.coopId = ['76595000','47671000','94767000',]
dsm.set('Config.1.International.0.Local_InternationalDestinations.1', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${travelCities.slice(0, 6).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${travelCities.slice(0, 6).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.CityTicker_TravelCitiesCurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = ['Toronto','London','Paris',]
d.coopId = ['71624000','03772000','07149000',]
dsm.set('Config.1.International.0.Local_InternationalDestinations.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = '${primaryLoc.primTecci}'
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Health.0.Local_UltravioletIndex.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'neighborhood_bg'
dsm.set('Config.1.Core5.0.Local_MenuBoard.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Fcst_TextForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '/ ${msoName}'
dsm.set('Config.1.SevereCore1A.0.Local_SevereWeatherMessage.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'neighborhood_bg'
dsm.set('Config.1.Core2.0.Local_MenuBoard.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(0, 2).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(0, 2).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.Core2.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.pollenId = '${primaryLoc.pllnId || 'N/A'}'
dsm.set('Config.1.Health.0.Local_AllergyReport.0', d, 0, 1)
#
d = twc.Data()
d.minPageDuration = 8
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
d.maxPageDuration = 14
dsm.set('Config.1.SevereCore1A.0.Local_TextForecast.0', d, 0, 1)
#
d = twc.Data()
d.minPageDuration = 8
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
d.maxPageDuration = 14
dsm.set('Config.1.Core1.0.Local_TextForecast.0', d, 0, 1)
#
d = twc.Data()
d.summerFlag = 1
dsm.set('Config.1.Health.0.Local_SunSafetyFacts.0', d, 0, 1)
#
d = twc.Data()
d.locName = [${metroCities.slice(0, 10).map(c => `'${c.prsntNm}'`).join(',')}]
d.coopId = [${metroCities.slice(0, 10).map(c => `'${c.coopId}'`).join(',')}]
dsm.set('Config.1.CityTicker_LocalCitiesForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName} Area'
d.zone = '${primaryLoc.zoneId}'
dsm.set('Config.1.SevereCore1A.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(0, 2).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(0, 2).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.SevereCore1A.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Health.0.Local_OutdoorActivityForecast.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(0, 4).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(0, 4).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.SevereCore1A.0.Local_LocalObservations.1', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName} Area'
d.zone = '${primaryLoc.zoneId}'
dsm.set('Config.1.Core1.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(4, 8).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(4, 8).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.SevereCore1A.0.Local_LocalObservations.0', d, 0, 1)
#
d = twc.Data()
d.locName = [${travelCities.slice(0, 6).map(c => `'${c.prsntNm}'`).join(',')}]
d.coopId = [${travelCities.slice(0, 6).map(c => `'${c.coopId}'`).join(',')}]
dsm.set('Config.1.CityTicker_TravelCitiesForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Fcst_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Fcst_DaypartForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName} Area'
d.zone = '${primaryLoc.zoneId}'
dsm.set('Config.1.Core4.0.Local_WeatherBulletin.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.aq = '${primaryLoc.epaId || 'zz001'}'
dsm.set('Config.1.Health.0.Local_AirQualityForecast.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'neighborhood_bg'
dsm.set('Config.1.Core4.0.Local_MenuBoard.0', d, 0, 1)
#
d = twc.Data()
d.locName = [${travelCities.slice(0, 3).map(c => `'${c.prsntNm}'`).join(',')}]
d.coopId = [${travelCities.slice(0, 3).map(c => `'${c.coopId}'`).join(',')}]
dsm.set('Config.1.Travel.0.Local_Destinations.2', d, 0, 1)
#
d = twc.Data()
d.locName = [${travelCities.slice(0, 3).map(c => `'${c.prsntNm}'`).join(',')}]
d.coopId = [${travelCities.slice(0, 3).map(c => `'${c.coopId}'`).join(',')}]
dsm.set('Config.1.Travel.0.Local_Destinations.1', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'neighborhood_bg'
dsm.set('Config.1.Core1.0.Local_MenuBoard.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(0, 4).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(0, 4).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.Core1.0.Local_LocalObservations.1', d, 0, 1)
#
d = twc.Data()
d.locName = [${travelCities.slice(0, 3).map(c => `'${c.prsntNm}'`).join(',')}]
d.coopId = [${travelCities.slice(0, 3).map(c => `'${c.coopId}'`).join(',')}]
dsm.set('Config.1.Travel.0.Local_Destinations.0', d, 0, 1)
#
d = twc.Data()
d.locName = '/ ${msoName}'
dsm.set('Config.1.SevereCore1B.0.Local_SevereWeatherMessage.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.SevereCore1B.0.Local_DaypartForecast.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(0, 2).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(0, 2).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.Core1.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(4, 8).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(4, 8).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.Core1.0.Local_LocalObservations.0', d, 0, 1)
#
d = twc.Data()
d.obsStation = [${localRadarCities.slice(0, 2).map(c => `'${c.primTecci}'`).join(',')}]
d.locName = [${localRadarCities.slice(0, 2).map(c => `'${c.prsntNm}'`).join(',')}]
dsm.set('Config.1.Core4.0.Local_CurrentConditions.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.bkgImage = 'neighborhood_bg'
d.affiliateName = '${msoName}'
dsm.set('Config.1.Core1.0.Local_NetworkIntro.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'airport_intro_bg'
dsm.set('Config.1.Airport.0.Local_PackageIntro.0', d, 0, 1)
#
d = twc.Data()
d.climId = '${primaryLoc.coopId ? primaryLoc.coopId.substring(0, 6) : ''}'
d.latitude = ${primaryLoc.lat}
d.longitude = ${primaryLoc.long}
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Core1.0.Local_Almanac.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'garden_intro_bg'
dsm.set('Config.1.Garden.0.Local_PackageIntro.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Core1.0.Local_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Core4.0.Local_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Core2.0.Local_ExtendedForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '/ ${msoName}'
dsm.set('Config.1.SevereCore2.0.Local_SevereWeatherMessage.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Core2.0.Local_DaypartForecast.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName}'
d.coopId = '${primaryLoc.coopId}'
dsm.set('Config.1.Garden.0.Local_GardeningForecast.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'travel_intro_bg'
dsm.set('Config.1.Travel.0.Local_PackageIntro.0', d, 0, 1)
#
d = twc.Data()
d.locName = '${cityName} Area'
d.zone = '${primaryLoc.zoneId}'
dsm.set('Config.1.Core3.0.Local_WeatherBulletin.0', d, 0, 1)
#
${airports.length > 1 ? `d = twc.Data()
d.airportId = '${airports[1]}'
d.obsStation = 'K${airports[1]}'
d.locName = '${airports[1]} Airport'
dsm.set('Config.1.Airport.0.Local_LocalAirportConditions.1', d, 0, 1)
#` : ''}
d = twc.Data()
d.promoText = ['For more on weather and your health','tune to The Weather Channel or','go to weather.com/health',]
d.promoImage = 'health_promo'
d.promoLogo = 'blankLogo'
dsm.set('Config.1.Health.0.Local_Promo.0', d, 0, 1)
#
d = twc.Data()
d.airportId = [${airports.slice(0, 2).map(a => `'${a}'`).join(',')}]
d.obsStation = [${airports.slice(0, 2).map(a => `'K${a}'`).join(',')}]
d.locName = [${airports.slice(0, 2).map(a => `'${a} Airport'`).join(',')}]
dsm.set('Config.1.CityTicker_AirportDelays.0', d, 0, 1)
#
d = twc.Data()
d.bkgImage = 'health_intro_bg'
dsm.set('Config.1.Health.0.Local_PackageIntro.0', d, 0, 1)
#
${airports.length > 0 ? `d = twc.Data()
d.airportId = '${airports[0]}'
d.obsStation = 'K${airports[0]}'
d.locName = '${airports[0]} Airport'
dsm.set('Config.1.Airport.0.Local_LocalAirportConditions.0', d, 0, 1)
#` : ''}
d = twc.Data()
d.preRoll = 8
d.schedule = ((14,60),(29,60),(44,60),(58,120),)
dsm.set('Config.1.Local_Avail_Schedule', d, 0)
#
# End of SCMT deployment
#
ds.commit()
twc.Log.info('scmt config finished')
# Finished generation on ${timestamp}
`;
  }
}

// Usage example and export
async function generateConfigFromXML(xmlPath, lookupFunction) {
  const generator = new ConfigGenerator(lookupFunction);
  const config = await generator.generateConfig(xmlPath);
  
  // Write to file
  const outputPath = xmlPath.replace('.xml', '_generated.py');
  await fs.writeFile(outputPath, config, 'utf-8');
  
  console.log(`Configuration generated: ${outputPath}`);
  return config;
}

module.exports = { ConfigGenerator, generateConfigFromXML };

// Example usage:
// const { generateConfigFromXML } = require('./weatherscan-config-generator');
//generateConfigFromXML('./test.xml', require("./lfrecord/locid"))