from PIL import Image
import numpy as np

def check_img(path):
    try:
        img = Image.open(path)
        print(f"Path: {path}")
        print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
        
        data = np.array(img)
        if len(data.shape) == 3 and data.shape[2] == 4: # RGBA
            alpha = data[:, :, 3]
            print(f"Min Alpha: {alpha.min()}, Max Alpha: {alpha.max()}")
            print(f"Mean Alpha: {alpha.mean()}")
            
            # Check center pixel
            cx, cy = img.size[0] // 2, img.size[1] // 2
            print(f"Center Pixel {cx},{cy}: {img.getpixel((cx, cy))}")
            
            # Scan left 270px for darkest pixel
            min_lum = 255
            darkest_pixel = None
            darkest_pos = None

            for x in range(min(270, img.size[0])):
                for y in range(img.size[1]):
                    px = img.getpixel((x, y))
                    if px[3] > 200: # Ignore transparent
                        r, g, b = px[0], px[1], px[2]
                        lum = 0.299*r + 0.587*g + 0.114*b
                        if lum < min_lum:
                            min_lum = lum
                            darkest_pixel = px
                            darkest_pos = (x, y)
                            
            print(f"Darkest Pixel at {darkest_pos}: {darkest_pixel} (Lum: {min_lum})")
        else:
            print("Not RGBA")
            
    except Exception as e:
        print(f"Error: {e}")

check_img('public/favicon-sq.png')
