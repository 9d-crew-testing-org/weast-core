import requests
from PIL import Image, ImageSequence
import os

# Constants
API_KEY = 'ffceedd2d76153109a6648d57eccd1bd'
BASE_URL = 'https://rnwtr.minnwx.com/api/maps'
TIMESTAMP_URL = f'{BASE_URL}/timestamps/nowtemps-us?apiKey={API_KEY}'

# Fetch timestamps
response = requests.get(TIMESTAMP_URL)
response.raise_for_status()
timestamps = response.json()

# Load basemap and borders once
base_map = Image.open('../map-scripts/resources/streamtwc-basemap.png').convert('RGBA')
borders = Image.open('../map-scripts/resources/streamtwc-borders.png').convert('RGBA')
base_size = base_map.size
borders = borders.resize(base_size, Image.Resampling.LANCZOS)

images = []
durations = []

for ts in timestamps:
    print(f'Downloading and modifying radar frame {ts} for GIF loop...')

    image_path = f'../../../images/maps/nowtemps-us/{ts}.png'
    if not os.path.exists(image_path):
        print(f'Warning: file {image_path} not found, skipping.')
        continue

    image = Image.open(image_path).convert('RGBA')

    # Remove black (or near-black) pixels
    data = image.getdata()
    #new_data = [(255, 255, 255, 0) if (r < 50 and g < 50 and b < 50) else (r, g, b, a)
    #            for (r, g, b, a) in data]
    #image.putdata(new_data)

    # Resize to base map size
    image = image.resize(base_size, Image.Resampling.LANCZOS)

    # Composite images
    composite_image = Image.alpha_composite(base_map, image)
    composite_image = Image.alpha_composite(composite_image, borders)

    images.append(composite_image)

# Create GIF if we have images
if images:
    output_path = '../../../images/weather/conus-temperature-loop.gif'

    # Define durations — 200ms for all, 3000ms for last frame
    durations = [150] * (len(images) - 1) + [1750]

    images[0].save(
        output_path,
        save_all=True,
        append_images=images[1:],
        duration=durations,
        loop=0,
        disposal=2
    )
    print("GIF created successfully!")

else:
    print("No valid images found to create GIF.")
