#!/usr/bin/env python3
"""skyline-mask.py <image> <out.pgm> [base_row]

Writes a building mask for a straight-on render with open sky above: for every column, the mask is
black from the top down to the first 'solid' pixel (stone, glass frame, bronze) and white from there
down to base_row (default: the bottom). Everything inside the silhouette — sky-coloured windows, the
glass dome — is therefore kept; only the sky above the roofline is dropped. Clouds are ignored
because 'solid' means warm (r-b > 10) or dark (lum < 110), and clouds are neither.
No PIL: pixels come from `magick … txt:-`, the mask goes out as binary PGM.
"""
import re, subprocess, sys

src, dst = sys.argv[1], sys.argv[2]
W, H = map(int, subprocess.check_output(['magick', 'identify', '-format', '%w %h', src]).split())
base = int(sys.argv[3]) if len(sys.argv) > 3 else H
txt = subprocess.check_output(['magick', src, '-depth', '8', 'txt:-']).decode()
solid = bytearray(W * H)
for m in re.finditer(r'^(\d+),(\d+): \((\d+),(\d+),(\d+)', txt, re.M):
    x, y, r, g, b = map(int, m.groups())
    if r - b > 10 or (r + g + b) < 330:
        solid[y * W + x] = 1
PERSIST = 4
CLOSE = int(sys.argv[4]) if len(sys.argv) > 4 else 45   # px: concavities narrower than this get filled
start = [base] * W
for x in range(W):
    run = 0
    for y in range(base):
        if solid[y * W + x]:
            run += 1
            if run >= PERSIST: start[x] = y - PERSIST + 1; break
        else:
            run = 0
# morphological closing of the skyline: rolling min (raise) then rolling max (restore outline) —
# fills the glass between dome ribs, keeps spires and the statue at their own width
r = CLOSE // 2
lo = [min(start[max(0, x - r):x + r + 1]) for x in range(W)]
start = [max(lo[max(0, x - r):x + r + 1]) for x in range(W)]
mask = bytearray(W * H)
for x in range(W):
    for y in range(start[x], base):
        mask[y * W + x] = 255
with open(dst, 'wb') as f:
    f.write(b'P5\n%d %d\n255\n' % (W, H)); f.write(mask)
print(f'{dst}: {W}x{H}, base {base}')
