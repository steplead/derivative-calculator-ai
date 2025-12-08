from PIL import Image

def make_square(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        print(f"Original dimensions: {width}x{height}")

        # Determine the size of the square canvas
        # It should be the maximum of width or height, plus some padding if desired?
        # User said "original dimension ratio", usually means don't stretch.
        # But for a favicon, we want a square.
        
        max_dim = max(width, height)
        # Create a new WHITE square image
        new_img = Image.new("RGBA", (max_dim, max_dim), (255, 255, 255, 255))
        
        # Calculate position to center the image
        x = (max_dim - width) // 2
        y = (max_dim - height) // 2
        
        # Paste the original image into the center
        new_img.paste(img, (x, y))
        
        new_img.save(output_path, "PNG")
        print(f"Saved square icon to {output_path} ({max_dim}x{max_dim})")

    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# Run on the current icon (which is the cropped 'd')
make_square(
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/icon.png',
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/favicon-sq.png'
)
