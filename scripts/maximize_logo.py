from PIL import Image
import os

def crop_transparent(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        # Get bounding box of non-zero alpha pixels
        bbox = img.getbbox()
        
        if bbox:
            print(f"  Found bounding box: {bbox}")
            cropped = img.crop(bbox)
            cropped.save(output_path, "PNG")
            print(f"  Saved cropped image to {output_path}")
        else:
            print("  Image is completely transparent!")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# Process Light Logo
crop_transparent(
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-light.png',
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-light.png'
)

# Process Dark Logo
crop_transparent(
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-dark.png',
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-dark.png'
)
