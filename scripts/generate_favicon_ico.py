#!/usr/bin/env python3
"""
Generate favicon.ico from the PNG logo
"""
from PIL import Image

# Load the square PNG
img = Image.open('app/icon.png')

# Ensure it's in RGBA mode
if img.mode != 'RGBA':
    img = img.convert('RGBA')

# Resize to common favicon sizes and save as .ico
# Standard sizes: 16x16, 32x32, 48x48
sizes = [(16, 16), (32, 32), (48, 48)]
img.save('app/favicon.ico', format='ICO', sizes=sizes)

print("✅ Generated app/favicon.ico with sizes: 16x16, 32x32, 48x48")
