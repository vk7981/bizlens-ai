from PIL import Image
import os

def clean_solid_background():
    # Input is the first solid-background logo
    input_path = r"C:\Users\vaish\.gemini\antigravity\brain\68aed4bb-de5c-4606-b12a-0744f069816c\media__1784047095577.png"
    output_path = r"C:\Users\vaish\.gemini\antigravity\scratch\bizlens-ai\frontend\public\logo.png"
    
    if not os.path.exists(input_path):
        print("Solid logo source not found!")
        return
        
    im = Image.open(input_path).convert("RGBA")
    pixels = im.load()
    width, height = im.size
    
    # Target solid background color
    bg_r, bg_g, bg_b = 13, 18, 22
    
    # Thresholds for transition
    low_thresh = 5   # below this, completely transparent
    high_thresh = 40 # above this, completely opaque
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Calculate distance to background color
            dist = max(abs(r - bg_r), abs(g - bg_g), abs(b - bg_b))
            
            if dist <= low_thresh:
                # Fully transparent
                pixels[x, y] = (0, 0, 0, 0)
            elif dist >= high_thresh:
                # Keep original color and opacity
                pixels[x, y] = (r, g, b, a)
            else:
                # Smoothly interpolate alpha
                factor = (dist - low_thresh) / (high_thresh - low_thresh)
                new_alpha = int(255 * factor)
                # Keep color but scale the alpha channel
                pixels[x, y] = (r, g, b, new_alpha)
                
    im.save(output_path, "PNG")
    print("Success! Processed solid logo with smooth alpha glow interpolation.")

if __name__ == "__main__":
    clean_solid_background()
