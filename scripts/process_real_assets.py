from PIL import Image, ImageOps
import os

# Paths
input_path = "/Users/bruno2025/.gemini/antigravity/brain/bc4bedcf-b7b8-4f4a-bb4f-5611e1355c7a/uploaded_image_1766458579896.png"
output_dir = "chrome_store_assets"
os.makedirs(output_dir, exist_ok=True)

try:
    img = Image.open(input_path).convert("RGB")
    width, height = img.size
    print(f"Original Image Size: {width}x{height}")

    # 1. SCREENSHOT (1280x800)
    # The uploaded image is likely a full browser window.
    # We want to fill 1280x800 without distorting too much.
    # If the user's screen is wider, we crop center. If taller, we crop top.
    
    target_ratio = 1280 / 800
    img_ratio = width / height

    screenshot = ImageOps.fit(img, (1280, 800), method=Image.Resampling.LANCZOS, centering=(0.5, 0)) # Anchor to top-center
    screenshot.save(f"{output_dir}/real_screenshot_1280x800.png")
    print("Generated: real_screenshot_1280x800.png")

    # 2. SMALL PROMO TILE (440x280)
    # Focus on the "Derivative Calculator AI" header part.
    # Assuming top-left or top-center contains the branding.
    # Let's crop the top-center part where the logo likely is.
    
    # Crop a 16:9ish area from the top first
    header_area = img.crop((0, 0, width, int(height * 0.6)))
    small_promo = ImageOps.fit(header_area, (440, 280), method=Image.Resampling.LANCZOS, centering=(0.5, 0.3))
    small_promo.save(f"{output_dir}/real_small_promo_440x280.png")
    print("Generated: real_small_promo_440x280.png")

    # 3. MARQUEE PROMO TILE (1400x560)
    # Similar to small promo but wider.
    marquee_promo = ImageOps.fit(header_area, (1400, 560), method=Image.Resampling.LANCZOS, centering=(0.5, 0.3))
    marquee_promo.save(f"{output_dir}/real_marquee_promo_1400x560.png")
    print("Generated: real_marquee_promo_1400x560.png")

except Exception as e:
    print(f"Error processing images: {e}")
