from PIL import Image, ImageDraw

# Create 1200x630 background (dark emerald)
bg = Image.new('RGB', (1200, 630), '#0b110f')

# Load cropped icon
icon = Image.open('public/icon.png').convert('RGBA')

# Resize icon to fit nicely
icon = icon.resize((400, 400), Image.Resampling.LANCZOS)

# Paste icon into center of background
offset = ((1200 - 400) // 2, (630 - 400) // 2)

# Make a rounded mask for the icon
mask = Image.new('L', (400, 400), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle([(0, 0), (400, 400)], radius=80, fill=255)

bg.paste(icon, offset, mask)

bg.save('public/og-image.jpg', quality=90)
print("Created Open Graph image")
