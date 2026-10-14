#!/bin/zsh
# compose-square.sh <capitol|reichstag> [tag]
# Builds out/sky-<building>-square.webp (1536x1536) from:
#   - out/sky-extension.webp — the model's upward extension; ONLY its top band of sky is used
#   - out/sky-<building>.webp — the original 1536x1024 render, pasted pixel-identical at the bottom
# The plate is colour-matched to the original's top 160 rows, and the original fades in over those
# same 160 rows, so the seam sits in empty sky. Both buildings get the same plate = same added sky.
set -eu
B=$1; TAG=${2:-}
cd "$(dirname "$0")/out"
W=1536; OH=1024; BAND=160; TOP=$((W-OH))            # 512 rows of new sky
T=$(mktemp -d)
magick ${PREFIX:-sky}-$B${TAG:+-$TAG}.webp $T/orig.png
magick ${PREFIX:-sky}-extension${TAG:+-$TAG}.webp -resize ${W}x${W} -crop ${W}x$((TOP+BAND))+0+0 +repage $T/plate.png
# per-channel gain so the plate's bottom band matches the original's top band
for c in r g b; do
  o=$(magick $T/orig.png  -crop ${W}x${BAND}+0+0     +repage -format "%[fx:mean.$c]" info:)
  p=$(magick $T/plate.png -crop ${W}x${BAND}+0+${TOP} +repage -format "%[fx:mean.$c]" info:)
  eval "G$c=$(echo "$o / $p" | bc -l)"
done
echo "$B gains r=$Gr g=$Gg b=$Gb"
magick $T/plate.png -channel R -evaluate multiply $Gr -channel G -evaluate multiply $Gg -channel B -evaluate multiply $Gb +channel $T/plate-m.png
# alpha for the original: 0 → 1 over the first BAND rows (smoothstep-ish), 1 below
magick \( -size ${W}x${BAND} gradient:black-white -sigmoidal-contrast 4,50% \) \( -size ${W}x$((OH-BAND)) xc:white \) -append $T/mask.png
magick $T/orig.png $T/mask.png -alpha off -compose CopyOpacity -composite $T/orig-a.png
magick -size ${W}x${W} xc:none $T/plate-m.png -geometry +0+0 -composite $T/orig-a.png -geometry +0+${TOP} -composite -alpha off -quality 94 ${PREFIX:-sky}-$B-square${TAG:+-$TAG}.webp
rm -rf $T; ls -la ${PREFIX:-sky}-$B-square${TAG:+-$TAG}.webp
