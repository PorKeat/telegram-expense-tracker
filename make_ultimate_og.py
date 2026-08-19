from PIL import Image, ImageDraw, ImageFont, ImageFilter

bg_path = "/Users/alexkgm/.gemini/antigravity/brain/1861348b-0eb8-4f04-b835-a94388a879ac/og_background_emerald_1787123210420.jpg"
icon_path = "public/icon.png"

# Load background (which is 1024x1024 because of DALL-E) and crop/resize to 1200x630
bg = Image.open(bg_path).convert('RGBA')
# crop center 1024x537 to get 16:9, then resize to 1200x630
bg = bg.crop((0, (1024-537)//2, 1024, 1024 - (1024-537)//2))
bg = bg.resize((1200, 630), Image.Resampling.LANCZOS)

# Add a dark overlay to make text pop
overlay = Image.new('RGBA', (1200, 630), (0, 0, 0, 140))
bg = Image.alpha_composite(bg, overlay)

# Load Icon
icon = Image.open(icon_path).convert('RGBA')
icon = icon.resize((300, 300), Image.Resampling.LANCZOS)

# Round icon
mask = Image.new('L', (300, 300), 0)
draw_mask = ImageDraw.Draw(mask)
draw_mask.rounded_rectangle([(0, 0), (300, 300)], radius=60, fill=255)
icon.putalpha(mask)

# Paste icon on left
bg.paste(icon, (120, 165), mask)

# Draw Text
draw = ImageDraw.Draw(bg)

try:
    font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 110, index=1) # Bold
    font_subtitle = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 45, index=0) # Regular
except:
    font_title = ImageFont.load_default()
    font_subtitle = ImageFont.load_default()

draw.text((480, 220), "Spendly", font=font_title, fill=(255, 255, 255, 255))
draw.text((480, 345), "Track expenses seamlessly", font=font_subtitle, fill=(160, 210, 190, 255))
draw.text((480, 405), "inside Telegram.", font=font_subtitle, fill=(160, 210, 190, 255))

final_bg = bg.convert('RGB')
final_bg.save('public/og-image.jpg', quality=95)
print("Created stunning OG image!")
