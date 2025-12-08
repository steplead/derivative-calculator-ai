from PIL import Image
import os

def remove_background(input_path, output_path, color_to_remove='white', threshold=200):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check for White Background
            if color_to_remove == 'white':
                if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                    newData.append((255, 255, 255, 0))  # Transparent
                else:
                    newData.append(item)
            # Check for Black Background (for the dark mode logo generated with black bg)
            elif color_to_remove == 'black':
                if item[0] < (255 - threshold) and item[1] < (255 - threshold) and item[2] < (255 - threshold):
                    newData.append((0, 0, 0, 0))  # Transparent
                else:
                    newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Saved transparent image to {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# Process Light Mode Logo (White BG)
remove_background(
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-light.png',
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-light.png',
    color_to_remove='white'
)

# Process Dark Mode Logo (Black BG - assuming generation used black background for contrast)
# Only run this if the file exists.
dark_logo_path = '/Users/bruno2025/.gemini/antigravity/brain/bc4bedcf-b7b8-4f4a-bb4f-5611e1355c7a/geometric_tech_wordmark_white_text_1765115759234.png'
if os.path.exists(dark_logo_path):
     remove_background(
        dark_logo_path,
        '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-dark.png',
        color_to_remove='black',
        threshold=200 # Adjust threshold for black? 50 might be better?
    )
