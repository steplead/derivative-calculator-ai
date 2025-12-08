from PIL import Image
import os

def remove_white_background(input_path, output_path, threshold=200):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check if pixel is white-ish (using threshold)
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                newData.append((255, 255, 255, 0))  # Transparent
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Saved transparent image to {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# Process Logo
remove_white_background(
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo.png',
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-transparent.png'
)

# Process Icon
remove_white_background(
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/icon.png',
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/icon-transparent.png'
)
