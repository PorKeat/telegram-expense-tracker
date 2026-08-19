from PIL import Image, ImageDraw

img_path = "/Users/alexkgm/.gemini/antigravity/brain/1861348b-0eb8-4f04-b835-a94388a879ac/spendly_icon_gold_1787121287443.jpg"
img = Image.open(img_path)

width, height = img.size
crop_size = 700
left = (width - crop_size) / 2
top = (height - crop_size) / 2
right = (width + crop_size) / 2
bottom = (height + crop_size) / 2

img_cropped = img.crop((left, top, right, bottom))
img_resized = img_cropped.resize((512, 512), Image.Resampling.LANCZOS)

img_resized.save("public/icon.png", format="PNG")

mask = Image.new('L', (512, 512), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle([(0, 0), (512, 512)], radius=110, fill=255)

img_resized.putalpha(mask)
img_resized.save("public/apple-icon.png", format="PNG")

favicon = img_resized.resize((64, 64), Image.Resampling.LANCZOS)
favicon.save("public/favicon.ico", format="ICO")
print("Cropped and saved icons to public/")
