from PIL import Image

def create_ico(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path)
        img.save(output_path, format='ICO', sizes=[(32, 32)])
        print(f"Saved ICO to {output_path}")

    except Exception as e:
        print(f"Error processing {input_path}: {e}")

create_ico(
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/favicon-sq.png',
    '/Users/bruno2025/Documents/iProjects/DerivativeCalculatorAI/public/favicon.ico'
)
