import sys, glob
from PIL import Image
pat, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3])
files = sorted(glob.glob(pat))
ims = [Image.open(f) for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols - 1) * 8, rows * h + (rows - 1) * 8), (255, 0, 255))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * (w + 8), (i // cols) * (h + 8)))
sheet.save(out)
print(files)
