#!/bin/zsh
# compose-wide.sh — out/wide-capitol.webp + out/wide-reichstag.webp (1536x1536), buildings smaller with
# sky to the sides. Layers, bottom to top:
#   1. out/wide-plate.webp — model-made EMPTY plate (sky + plaza, no building), shared by both images
#   2. Capitol only: the model's wing-end pavilions from out/wide-extension-capitol.webp, because the
#      original render's wings are cut at its frame edge (OVERLAP px kept under each wing edge)
#   3. the ORIGINAL sky-*.webp render, scaled to the zoom-out footprint, with its sky removed by a
#      top-down skyline mask (skyline-mask.py) — dome glass, windows and statue are kept
set -eu
cd "$(dirname "$0")/out"
S=1536; T=$(mktemp -d); PY=../skyline-mask.py
BASE=${BASE:-1476}                 # plate's plaza top (measured)
CL=250; CR=1279; CTOP=1088         # Capitol footprint in the 1536 zoom-out (measured)
OVERLAP=${OVERLAP:-56}
magick wide-plate.webp -resize ${S}x${S}! $T/plate.png

# ---------- Capitol
CS=$(echo "(($CR-$CL) - 2*$OVERLAP) / 1536" | bc -l)
CW=$(printf %.0f $(echo "1536*$CS" | bc -l)); CH=$(printf %.0f $(echo "1024*$CS" | bc -l))
CB=$(printf %.0f $(echo "1009*$CS" | bc -l))
CX=$(( (CL+CR)/2 - CW/2 )); CY=$(( BASE - CB ))
magick sky-capitol.webp -resize ${CW}x${CH}! $T/co.png
python3 $PY $T/co.png $T/cm.pgm $CB 45 >/dev/null
magick \( -size 28x${CH} gradient:black-white -rotate 90 -flop \) \( -size $((CW-56))x${CH} xc:white \) \( -size 28x${CH} gradient:black-white -rotate 90 \) +append $T/side.png
magick $T/cm.pgm $T/side.png -compose Darken -composite -blur 0x0.6 $T/cm.png
magick $T/co.png -alpha off $T/cm.png -compose CopyOpacity -composite $T/co-a.png
# wing-end stubs from the zoom-out, skyline-masked, shifted so its base (1484) meets BASE
magick wide-extension-capitol.webp -resize ${S}x${S}! -crop ${S}x1484+0+0 +repage $T/ext.png
python3 $PY $T/ext.png $T/em.pgm 1484 45 >/dev/null
SW=$((OVERLAP+36))
magick -size ${S}x1484 xc:black -fill white -draw "rectangle $((CL-24)),0 $((CL-24+SW)),1484" -draw "rectangle $((CR+24-SW)),0 $((CR+24)),1484" $T/stubwin.png
magick $T/em.pgm $T/stubwin.png -compose Darken -composite -blur 0x0.6 $T/em.png
magick $T/ext.png -alpha off $T/em.png -compose CopyOpacity -composite $T/ext-a.png
magick $T/plate.png $T/ext-a.png -geometry +0+$((BASE-1484)) -composite $T/co-a.png -geometry +${CX}+${CY} -composite -alpha off -quality 94 wide-capitol.webp

# ---------- Reichstag (ends inside its own frame: plate + original only)
RS=$(echo "($CR-$CL) / 1512" | bc -l)
RW=$(printf %.0f $(echo "1536*$RS" | bc -l)); RH=$(printf %.0f $(echo "1024*$RS" | bc -l))
RX=$(( (CL+CR)/2 - RW/2 )); RY=$(( BASE - RH ))
magick sky-reichstag.webp -resize ${RW}x${RH}! $T/ro.png
python3 $PY $T/ro.png $T/rm.pgm $RH 45 >/dev/null
magick $T/rm.pgm -blur 0x0.6 $T/rm.png
magick $T/ro.png -alpha off $T/rm.png -compose CopyOpacity -composite $T/ro-a.png
magick $T/plate.png $T/ro-a.png -geometry +${RX}+${RY} -composite -alpha off -quality 94 wide-reichstag.webp
echo "capitol ${CW}x${CH} at ${CX},${CY}; reichstag ${RW}x${RH} at ${RX},${RY}; base $BASE"
rm -rf $T; ls -la wide-capitol.webp wide-reichstag.webp
