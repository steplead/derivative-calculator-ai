from PIL import Image
import os

def extract_icon(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()

        # 1. Find the gap between the Icon and the Text
        # We assume the image is already cropped tight (so x=0 is the start of the icon)
        # We start scanning from x=10 (to skip the initial part of the icon)
        # We look for a column that is completely transparent
        
        split_x = width  # Default to width if no split found
        
        # Heuristic: Start from 1/5 of the width, scan until 1/2 of width
        start_scan = int(height * 0.5) # The icon is roughly square, so it should be around 'height' pixels wide.
        end_scan = int(width * 0.6)

        print(f"Scanning for gap between x={start_scan} and x={end_scan}...")

        for x in range(start_scan, end_scan):
            is_column_transparent = True
            for y in range(height):
                _, _, _, alpha = pixels[x, y]
                if alpha > 0:
                    is_column_transparent = False
                    break
            
            if is_column_transparent:
                print(f"Found transparent gap at x={x}")
                split_x = x
                break

        # Crop the icon
        icon_img = img.crop((0, 0, split_x, height))
        
        # Now trim the crop to ensure it's tight
        bbox = icon_img.getbbox()
        if bbox:
            icon_img = icon_img.crop(bbox)

        icon_img.save(output_path, "PNG")
        print(f"Saved extracted icon to {output_path}")

    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# Extract from logo-light.png (we use light because the 'd' has colors that work on white, 
# but for favicon we want the one that works on most backgrounds. 
# actually the user asked for 'this d', pointing to the one in the upload which is the gradient one.
# logo-light.png has the colored gradient 'd' and black text. logo-dark has colored 'd' and white text.
# The 'd' part is likely identical.
extract_icon(
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-light.png',
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/icon.png'
)
