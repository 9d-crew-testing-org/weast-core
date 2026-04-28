import requests
from PIL import Image
import os

# Constants
API_KEY = 'ffceedd2d76153109a6648d57eccd1bd'
BASE_URL = 'https://rnwtr.minnwx.com/api/maps'
TIMESTAMP_URL = f'{BASE_URL}/timestamps/radar-us?apiKey={API_KEY}'

# Fetch timestamps
response = requests.get(TIMESTAMP_URL)
response.raise_for_status()
timestamps = response.json()

# Load basemap and borders once
base_map = Image.open('../map-scripts/resources/streamtwc-basemap.png').convert('RGBA')
borders = Image.open('../map-scripts/resources/streamtwc-borders.png').convert('RGBA')
base_size = base_map.size
borders = borders.resize(base_size, Image.Resampling.LANCZOS)

# Output settings
output_dir = '../../../images/weather'
output_path = os.path.join(output_dir, 'conus-radar-loop-nomap.gif')
os.makedirs(output_dir, exist_ok=True)

frames = []
durations = []

for idx, ts in enumerate(timestamps):
    print(f'Downloading and modifying radar frame {ts} for GIF loop...')

    image_path = f'../../../images/maps/radar-us/{ts}.tiff'
    if not os.path.exists(image_path):
        print(f'⚠️ Warning: file {image_path} not found, skipping.')
        continue

    with Image.open(image_path) as image:
        image = image.convert('RGBA')

        # Optional cleanup step (currently disabled)
        # data = image.getdata()
        # new_data = [(255, 255, 255, 0) if (r < 50 and g < 50 and b < 50) else (r, g, b, a)
        #             for (r, g, b, a) in data]
        # image.putdata(new_data)

        # Resize to basemap size if needed
        image = image.resize(base_size, Image.Resampling.LANCZOS)

        # Composite with base map and borders
        #composite_image = Image.alpha_composite(base_map, image)
        #composite_image = Image.alpha_composite(composite_image, borders)

        # Convert to palette mode to reduce file size and memory
        frame = image

        # Save as temporary PNG but with `.temp` extension
        frame_temp_path = os.path.join(output_dir, f'frame_{idx:03d}.temp')
        frame.save(frame_temp_path, format='PNG', optimize=True)

        frames.append(frame_temp_path)
        durations.append(150)

# Create GIF from temp frames
if frames:
    durations[-1] = 1750  # make the final frame pause longer

    print(f'🧩 Assembling GIF with {len(frames)} frames...')

    # Open all frames for assembly
    first_frame = Image.open(frames[0])
    append_frames = [Image.open(f) for f in frames[1:]]

    first_frame.save(
        output_path,
        save_all=True,
        append_images=append_frames,
        duration=durations,
        loop=0,
        disposal=2,
        optimize=True
    )

    print(f'✅ GIF created successfully: {output_path}')

    # Clean up temp files
    for f in frames:
        try:
            os.remove(f)
        except Exception as e:
            print(f'⚠️ Could not delete temp file {f}: {e}')

else:
    print("⚠️ No valid images found to create GIF.")
