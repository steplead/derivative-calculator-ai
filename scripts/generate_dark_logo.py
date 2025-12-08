from PIL import Image, ImageOps

def create_dark_mode_logo(input_path, output_path, split_x_hint=230):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # Split the image into Icon (Left) and Text (Right)
        # We previously found the gap was around x=212. 
        # Detailed scan showed gap between 135 and 529, strictly transparent at 212.
        # Let's use 230 to be safe and clear of the icon's glow.
        
        split_x = split_x_hint
        
        # 1. Icon Part (Keep Original Colors)
        icon_part = img.crop((0, 0, split_x, height))
        
        # 2. Text Part (Invert Colors: Black -> White)
        text_part = img.crop((split_x, 0, width, height))
        
        # To invert properly while keeping transparency:
        # We need to invert the RGB channels but KEEP the Alpha channel.
        r, g, b, a = text_part.split()
        rgb_image = Image.merge('RGB', (r, g, b))
        inverted_rgb = ImageOps.invert(rgb_image)
        r2, g2, b2 = inverted_rgb.split()
        
        # Recombine with original alpha
        inverted_text_part = Image.merge('RGBA', (r2, g2, b2, a))
        
        # 3. Stitch them back together
        new_img = Image.new('RGBA', (width, height))
        new_img.paste(icon_part, (0, 0))
        new_img.paste(inverted_text_part, (split_x, 0))
        
        new_img.save(output_path, "PNG")
        print(f"Saved hybrid dark logo to {output_path}")

    except Exception as e:
        print(f"Error processing {input_path}: {e}")

create_dark_mode_logo(
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-light.png',
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/logo-dark-v2.png'
)
