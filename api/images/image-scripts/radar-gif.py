import requests
from PIL import Image
import os
import tempfile
import shutil

API_KEY = 'ffceedd2d76153109a6648d57eccd1bd'
BASE_URL = 'https://rnwtr.minnwx.com/api/maps'
TIMESTAMP_URL = f'{BASE_URL}/timestamps/radar-us?apiKey={API_KEY}'

response = requests.get(TIMESTAMP_URL)
response.raise_for_status()
timestamps = response.json()

base_map_path = '../map-scripts/resources/streamtwc-basemap.png'
borders_path = '../map-scripts/resources/streamtwc-borders.png'
output_dir = '../../../images/weather'
output_path = os.path.join(output_dir, 'conus-radar-loop-nomap.gif')

os.makedirs(output_dir, exist_ok=True)

print('Loading base layers...')
base_map = Image.open(base_map_path).convert('RGBA')
borders = Image.open(borders_path).convert('RGBA')
borders = borders.resize(base_map.size, Image.Resampling.LANCZOS)

base_composite = Image.alpha_composite(base_map, borders)

del base_map, borders

temp_dir = tempfile.mkdtemp()
frame_paths = []
durations = []

print(f'Processing {len(timestamps)} radar frames...')

for idx, ts in enumerate(timestamps):
    image_path = f'../../../images/maps/radar-us/{ts}.tiff'
    if not os.path.exists(image_path):
        print(f'⚠️  Warning: file {image_path} not found, skipping.')
        continue

    print(f'[{idx+1}/{len(timestamps)}] Processing {ts}...')

    with Image.open(image_path) as radar_img:
        radar_resized = radar_img.convert('RGBA').resize(
            base_composite.size, 
            Image.Resampling.LANCZOS
        )
        
        composite = Image.alpha_composite(base_composite.copy(), radar_resized)
        
        frame = composite #.convert('P', palette=Image.ADAPTIVE, colors=128)
        
        frame_path = os.path.join(temp_dir, f'frame_{idx:03d}.png')
        frame.save(frame_path, format='PNG', optimize=True)
        
        frame_paths.append(frame_path)
        durations.append(150)
        
        del radar_resized, composite, frame

del base_composite

if frame_paths:
    durations[-1] = 1750

    print(f'🧩 Assembling GIF with {len(frame_paths)} frames...')

    loaded_frames = []
    for path in frame_paths:
        img = Image.open(path)
        img.load()
        loaded_frames.append(img)
    
    loaded_frames[0].save(
        output_path,
        save_all=True,
        append_images=loaded_frames[1:],
        duration=durations,
        loop=0,
        disposal=2,
        optimize=False
    )
    
    for img in loaded_frames:
        img.close()

    print(f'GIF created successfully: {output_path}')

    try:
        shutil.rmtree(temp_dir)
        print(f'Cleaned up temporary files')
    except Exception as e:
        print(f'Could not delete temp directory {temp_dir}: {e}')
else:
    print("No valid radar frames found. GIF not created.")
