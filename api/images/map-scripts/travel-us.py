import asyncio
import collections
from genericpath import exists
import gzip
from multiprocessing import Pool
import aiohttp
import os
import json
import time as epochTime
import requests
import logging,coloredlogs

from os import path, mkdir, listdir, remove, cpu_count
from shutil import rmtree
from PIL import Image as PILImage
from wand.image import Image as wandImage
from wand.color import Color


radarType = "Radar-US"

l = logging.getLogger(__name__)
coloredlogs.install()

upperLeftX,upperLeftY,lowerRightX,lowerRightY = 0,0,0,0
xStart,xEnd,yStart,yEnd = 0,0,0,0
imgW = 0
imgH = 0

import sys
sys.path.append("./")
from RadarProcessor import *

# Returns a list of (ts, effective_time)
# Where effective_time = fts[-1] if exists, else ts
async def getValidTimestamps(boundaries: ImageBoundaries) -> list[tuple[int, int]]:
    """Gets valid radar timestamps with proper effective times (last fts or ts)."""
    l.info("Getting timestamps for the radar...")

    results = []
    async with aiohttp.ClientSession() as session:
        url = "https://api.weather.com/v3/TileServer/series/productSet?apiKey=e1f10a1e78da46f5b10a1e78da96f525&filter=sensibleWeather12hrFcst"
        async with session.get(url) as r:
            response = await r.json()
            series_data = response['seriesInfo']['sensibleWeather12hrFcst']['series']

            for item in series_data:
                ts = item['ts']
                effective_time = item['fts'][len(item['fts']) - 3] if 'fts' in item and item['fts'] else ts
                results.append((ts, effective_time))

    return results



def downloadRadarTile(url, p, fn):
    img = requests.get(url, stream=True)
    ts = fn.split("_")[0]
    download = True
    
    # Make the path if it doesn't exist
    print(ts)
    if exists(f"../../../images/maps/travel-us/{ts}.png") or exists(f"../../../images/maps/travel-us/temp/{ts}.png"):
        l.info("Not downloading tiles for timestamp " + str(ts) + " since a frame for it already exists." )
        download = False
    if not path.exists(p):
        mkdir(p)
        l.info(f"Download {ts}")
    if exists(f"{p}/{fn}"): 
        l.debug(f"Not downloading new tiles for {ts} as they already exist.")
        download = False

    if (img.status_code == 200 and download):
        with open(f'{p}/{fn}', 'wb') as tile:
            for data in img:
                tile.write(data)
    elif (img.status_code != 200):
        l.error("ERROR DOWNLOADING " + p + "\nSTATUS CODE " + str(img.status_code))
    elif (download == False):
        pass



def getImageBoundaries() -> ImageBoundaries:
    """ Gets the image boundaries for the specified radar definition """
    with open('./ImageSequenceDefs.json', 'r') as f:
        ImageSequenceDefs = json.loads(f.read())
  
    seqDef = ImageSequenceDefs['ImageSequenceDefs'][radarType]

    return ImageBoundaries(
        LowerLeftLong = seqDef['LowerLeftLong'],
        LowerLeftLat= seqDef['LowerLeftLat'],
        UpperRightLong= seqDef['UpperRightLong'],
        UpperRightLat= seqDef['UpperRightLat'],
        VerticalAdjustment= seqDef['VerticalAdjustment'],
        OGImgW= seqDef['OriginalImageWidth'],
        OGImgH= seqDef['OriginalImageHeight'],
        ImagesInterval= seqDef['ImagesInterval'],
        Expiration= seqDef['Expiration']
    )

def CalculateBounds(upperRight:LatLong, lowerLeft:LatLong, upperLeft:LatLong, lowerRight: LatLong):
    """ Calculates the image bounds for radar stitching & tile downloading """
    upperRightTile:Point = WorldCoordinateToTile(LatLongProject(upperRight.x, upperRight.y))
    lowerLeftTile:Point = WorldCoordinateToTile(LatLongProject(lowerLeft.x, lowerLeft.y))
    upperLeftTile:Point = WorldCoordinateToTile(LatLongProject(upperLeft.x, upperLeft.y))
    lowerRightTile:Point = WorldCoordinateToTile(LatLongProject(lowerRight.x,lowerRight.y))

    upperLeftPx:Point = WorldCoordinateToPixel(LatLongProject(upperLeft.x, upperLeft.y))
    lowerRightPx:Point = WorldCoordinateToPixel(LatLongProject(lowerRight.x,lowerRight.y))

    global upperLeftX,upperLeftY,lowerRightX,lowerRightY
    global xStart,xEnd,yStart,yEnd
    global imgW,imgH

    upperLeftX = upperLeftPx.x - upperLeftTile.x * 256
    upperLeftY = upperLeftPx.y - upperLeftTile.y * 256
    lowerRightX = lowerRightPx.x - upperLeftTile.x * 256
    lowerRightY = lowerRightPx.y - upperLeftTile.y * 256

    # Set the xStart, xEnd, yStart, and yEnd positions so we can download tiles that are within the tile coordinate regions
    xStart = int(upperLeftTile.x)
    xEnd = int(upperRightTile.x) + 1
    yStart = int(upperLeftTile.y)
    yEnd = int(lowerLeftTile.y) + 1

    # Set the image width & height based off the x and y tile amounts

    # These should amount to the amount of tiles needed to be downloaded
    # for both the x and y coordinates.
    xTiles:int = xEnd - xStart
    yTiles:int = yEnd - yStart

    imgW = 256 * (xTiles + 1)
    imgH = 256 * (yTiles + 1)
    print(f"{imgW} x {imgH}")

def convertPaletteToWXPro(filepath:str):
    """ Converts the color palette of a radar frame to one acceptable to the i2 """
    img = wandImage(filename = filepath)

    img.opaque_paint(Color('rgb(8,193,230)'), Color('rgb(212,212,209)'), 7000.0)
    img.opaque_paint(Color('rgb(8,155,186)'), Color('rgb(212,212,209)'), 7000.0)
    img.opaque_paint(Color('rgb(8,123,153)'), Color('rgb(212,212,209)'), 7000.0)
    img.opaque_paint(Color('rgb(17,194,160)'), Color('rgb(212,212,209)'), 7000.0)

    img.transparent_color(Color('rgb(31,115,17)'), .5, 1.0)

    #img.compression = 'lzw'
    img.save(filename=filepath)
    final_filepath = os.path.join("../../../images/maps/travel-us", os.path.basename(filepath))
    img.save(filename=final_filepath)

    # Delete the file from the temporary directory
    if os.path.exists(filepath):
        os.remove(filepath)    



def getTime(timestamp) -> str:
    time:datetime = datetime.utcfromtimestamp(timestamp).strftime("%m/%d/%Y %H:%M:%S")
        
    return str(time)


async def makeRadarImages():
    """ Creates proper radar frames for the i2 """
    l.info("Downloading frames for the Regional Radar...")
    
    combinedCoordinates = []

    boundaries = getImageBoundaries()
    upperRight:LatLong = boundaries.GetUpperRight()
    lowerLeft:LatLong = boundaries.GetLowerLeft()
    upperLeft:LatLong = boundaries.GetUpperLeft()
    lowerRight:LatLong = boundaries.GetLowerRight()

    CalculateBounds(upperRight, lowerLeft, upperLeft, lowerRight)
    # Get all valid (ts, fts) pairs
    all_times = await getValidTimestamps(boundaries)

    # Get current epoch time
    now = int(epochTime.time())

    # Find the pair with the fts (or ts) closest to now
    closest_pair = min(all_times, key=lambda x: abs((x[1] if x[1] else x[0]) - now))
    times = [closest_pair]  # Overwrite times with only the closest one

    l.info(f"Using radar time closest to now: ts={closest_pair[0]}, effective_time={closest_pair[1]}")

    # Get rid of invalid radar frames 
    #for i in listdir('/opt/page/dalk/miststar/data/regionalRadar/'):
        #if i.split('.')[0] not in [str(x) for x in times] and i != "Thumbs.db":
            #l.debug(f"Deleting {i} as it is no longer valid.")
            #remove("/opt/page/dalk/miststar/data/regionalRadar/" + i)
    
    # Collect coordinates for the frame tiles
    for y in range(yStart, yEnd):
        if y <= yEnd:
            for x in range(xStart, xEnd):
                if x <= xEnd:
                    combinedCoordinates.append(Point(x,y))

    # Create urls, paths, and filenames to download tiles for.
    urls = []
    paths = []
    filenames = []

    for ts, effective_time in times:
        for c in combinedCoordinates:
            output_file = f"{effective_time}.png"

            if not exists(f'../../../images/maps/travel-us/{output_file}') and not exists(f'../../../images/maps/travel-us/temp/{output_file}') and not exists(f'../../../images/maps/travel-us/{ts}.png'):
                url = f"https://api.weather.com/v3/TileServer/tile/sensibleWeather12hrFcst?ts={ts}&fts={effective_time}&xyz={c.x}:{c.y}:6&apiKey=e1f10a1e78da46f5b10a1e78da96f525"
                path = f"../../../images/maps/travel-us/tiles/{ts}"
                fname = f"{ts}_{c.x}_{c.y}.png"
                print(url)
                urls.append(url)
                paths.append(path)
                filenames.append(fname)



    l.debug(len(urls))
    if len(urls) != 0 and len(urls) >= 6:
        with Pool(cpu_count() - 1) as p:
            print(paths)
            p.starmap(downloadRadarTile, zip(urls, paths, filenames))
            p.close()
            p.join()
    elif len(urls) < 6 and len(urls) != 0:     # We don't need to run more threads than we need to, that's how we get halted.
        with Pool(len(urls)) as p:
            p.starmap(downloadRadarTile, zip(urls, paths, filenames))
            p.close()
            p.join()
    elif len(urls) == 0:
        l.info("No new radar frames need to be downloaded.")
        return

    # Stitch them all together!

    imgsToGenerate = []
    framesToComposite = []
    finished = []
    files = []

    for t in times:
        imgsToGenerate.append(PILImage.new("RGBA", (imgW, imgH)))

    # Stitch the frames together
    for i in range(0, len(imgsToGenerate)):
        if (not exists(f"../../../images/maps/travel-us/{times[i]}.png")) and (not exists(f"../../../images/maps/travel-us/temp/{times[i]}.png")):
            l.debug(f"Generate frame for {times[i]}")
            for c in combinedCoordinates:
                print(times[i])
                path = f"../../../images/maps/travel-us/tiles/{times[i][0]}/{times[i][0]}_{c.x}_{c.y}.png"

                xPlacement = (c.x - xStart) * 256
                yPlacement = (c.y - yStart) * 256

                if exists(path):
                    img = PILImage.open(path)
                    img = img.convert("RGBA")
                    imgsToGenerate[i].paste(img, (xPlacement, yPlacement))
            
            # Don't render it with an alpha channel
            imgsToGenerate[i].save(f"../../../images/maps/travel-us/temp/{times[i][0]}.png")
            framesToComposite.append(f"../../../images/maps/travel-us/temp/{times[i][0]}.png") # Store the path so we can composite it using WAND and PIL

            # Remove the tileset as we don't need it anymore!
            if exists(f'../../../images/maps/travel-us/tiles/{times[i][0]}'):
                rmtree(f'../../../images/maps/travel-us/tiles/{times[i][0]}')

    # Composite images for the i2
    imgsProcessed = 0 
    for img in framesToComposite:
        imgsProcessed += 1
        l.debug("Attempting to composite " + img)
        l.info(f"Processing radar frame {imgsProcessed} / 36")

        # Crop the radar images something that the i2 will actually take
        img_raw = wandImage(filename=img)
        img_raw.crop(upperLeftX, upperLeftY, width = int(lowerRightX - upperLeftX), height = int(lowerRightY - upperLeftY))
        img_raw.save(filename=img)
        
        # Resize using PIL
        imgPIL = PILImage.open(img)
        imgPIL = imgPIL.resize((boundaries.OGImgW, boundaries.OGImgH), 0)
        imgPIL.save(img)

        convertPaletteToWXPro(img)

        finished.append(img)

    commands = []

    l.info("Downloaded and saved Regional Radar frames!")



# print(getTime(1665880800))


if __name__ == "__main__":
    asyncio.run(makeRadarImages())
