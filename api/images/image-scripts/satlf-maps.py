from PIL import Image
from pathlib import Path

# Define input and output directories
TRAVEL_DIR = Path("../../../images/maps/travel-us")
THUNDER_DIR = Path("../../../images/maps/thunderfcst-us")
OUTPUT_DIR = Path("../../../images/weather")

# Make sure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def get_latest_png(directory: Path) -> Path:
    """Return the most recently modified .png file in the given directory."""
    png_files = list(directory.glob("*.png"))
    if not png_files:
        raise FileNotFoundError(f"No PNG files found in {directory}")
    return max(png_files, key=lambda f: f.stat().st_mtime)

def process_image(input_path: Path, output_path: Path):
    """Resize and paste the image into the base canvas."""
    image = Image.open(input_path)
    resized_image = image.resize((3346, 1502))
    base_image = Image.new("RGBA", (8751, 3475), (0, 0, 0, 0))
    base_image.paste(resized_image, (2714, 711))
    base_image.save(output_path)
    print(f"Image processing complete. Saved as '{output_path}'")

def dl_travel():
    input_path = get_latest_png(TRAVEL_DIR)
    output_path = OUTPUT_DIR / "prod_travel_weather_8.png"
    process_image(input_path, output_path)

def dl_tstm():
    input_path = get_latest_png(THUNDER_DIR)
    output_path = OUTPUT_DIR / "prod_thunderstorm_forecast_8.png"
    process_image(input_path, output_path)

if __name__ == "__main__":
    dl_travel()
    dl_tstm()
