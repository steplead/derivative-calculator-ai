from PIL import Image, ImageOps
import os

# Paths
files = [
    ("/Users/bruno2025/.gemini/antigravity/brain/bc4bedcf-b7b8-4f4a-bb4f-5611e1355c7a/uploaded_image_0_1766458632847.png", "real_integral_1280x800.png"),
    ("/Users/bruno2025/.gemini/antigravity/brain/bc4bedcf-b7b8-4f4a-bb4f-5611e1355c7a/uploaded_image_1_1766458632847.png", "real_limit_1280x800.png"),
    ("/Users/bruno2025/.gemini/antigravity/brain/bc4bedcf-b7b8-4f4a-bb4f-5611e1355c7a/uploaded_image_2_1766458632847.png", "real_matrix_1280x800.png")
]
output_dir = "chrome_store_assets"
os.makedirs(output_dir, exist_ok=True)

for input_path, output_name in files:
    try:
        img = Image.open(input_path).convert("RGB")
        # Resize/Crop to 1280x800
        # Use top-center anchoring to keep the header visible
        screenshot = ImageOps.fit(img, (1280, 800), method=Image.Resampling.LANCZOS, centering=(0.5, 0))
        screenshot.save(os.path.join(output_dir, output_name))
        print(f"Generated: {output_name}")
    except Exception as e:
        print(f"Error processing {output_name}: {e}")
