import subprocess, sys, re, statistics as st
# Prints "left right base top W H" of the building footprint.
# base  = topmost row of the bottom block of near-uniform rows (the flat plaza), i.e. the building's base.
# left/right = columns that are non-sky (r > 0.95*b) in the band just above the base.
# top = highest non-sky row in the centre columns (dome apex / statue).
path = sys.argv[1]
W, H = map(int, subprocess.check_output(['magick','identify','-format','%w %h',path]).split())
s = 4; w, h = W//s, H//s
txt = subprocess.check_output(['magick', path, '-resize', f'{w}x{h}!', '-depth', '8', 'txt:-']).decode()
rgb = {}
for m in re.finditer(r'^(\d+),(\d+): \((\d+),(\d+),(\d+)', txt, re.M):
    x,y,r,g,b = map(int, m.groups()); rgb[(x,y)] = (r,g,b)
nonsky = lambda p: p[0] > 0.95*p[2]
def rowstd(y): return st.pstdev([sum(rgb[(x,y)])/3 for x in range(w)])
base = h-1
for y in range(h-1, 0, -1):
    if rowstd(y) > 6: base = y+1; break
y0, y1 = int(base - h*0.12), base
cols = [x for x in range(w) if sum(nonsky(rgb[(x,y)]) for y in range(y0,y1))/(y1-y0) > 0.3]
left, right = cols[0], cols[-1]+1
top = min(y for y in range(0,base) for x in range(w//2-2, w//2+3) if nonsky(rgb[(x,y)]))
print(left*s, right*s, base*s, top*s, W, H)
