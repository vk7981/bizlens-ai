from PIL import Image
import os

def make_logo_transparent():
    logo_path = r"C:\Users\vaish\.gemini\antigravity\scratch\bizlens-ai\frontend\public\logo.png"
    if not os.path.exists(logo_path):
        print("Logo not found!")
        return
        
    im = Image.open(logo_path).convert("RGBA")
    pixels = im.load()
    width, height = im.size
    
    # Target grid colors
    # C1 ~ (64, 64, 64)
    # C2 ~ (104, 104, 104)
    
    removed_count = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Check if the pixel is neutral gray and matches the checkerboard range
            is_gray = max(r, g, b) - min(r, g, b) <= 12
            
            # Check if it falls within the dark checkerboard or light checkerboard bands
            is_c1 = (45 <= r <= 78) and (45 <= g <= 78) and (45 <= b <= 78)
            is_c2 = (88 <= r <= 120) and (88 <= g <= 120) and (88 <= b <= 120)
            
            if is_gray and (is_c1 or is_c2):
                pixels[x, y] = (0, 0, 0, 0)
                removed_count += 1
                
    im.save(logo_path, "PNG")
    print(f"Success! Cleaned background. Removed {removed_count} grid pixels.")

if __name__ == "__main__":
    make_logo_transparent()
