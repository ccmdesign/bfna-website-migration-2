#!/bin/zsh
# Round 5 — square (1:1) versions of the big-sky pair. The buildings are NOT regenerated:
#   1. the model extends out/${PREFIX:-sky}-capitol.webp upward to a 1024x1024 canvas (new sky only matters);
#   2. compose-square.sh takes just the top band of that result as a sky plate and composites the
#      ORIGINAL 1536x1024 renders over the bottom, feathered in the sky, for both buildings.
# Usage: gen-square.sh [tag]
set -u
TAG=${1:-}
DIR=/Users/claudioccm/_files/_ccmdesign/clients/bfna/bfna-website-migration-2/_process/scoping/hero-explorations
OUT=$DIR/out; NAME="${PREFIX:-sky}-extension${TAG:+-$TAG}"
magick $OUT/${PREFIX:-sky}-capitol.webp $OUT/.sq-ref.png
PROMPT="Generate ONE square image, 1024x1024.

Extend the attached photograph UPWARD to a square canvas. Keep the existing picture exactly as it is, scaled to fill the full width and sitting flush at the BOTTOM of the square (it occupies the bottom two thirds). Fill the new top third with more of the same sky: continue the same smooth blue gradient, getting gradually deeper blue toward the top, and add only two or three small, sparse white cumulus clouds, far apart, in the same soft style and light as the clouds already in the picture. No haze, no birds, no aircraft, no sun, no vignette, no other changes.

Use the image generation tool. Then copy the generated PNG to $OUT/$NAME.png using a shell command and reply with only the final path."
cd $DIR
codex exec -s workspace-write -C $DIR -i out/.sq-ref.png --skip-git-repo-check "$PROMPT" < /dev/null > $OUT/$NAME.stdout 2>&1
echo "exit=$? $NAME"; rm -f $OUT/.sq-ref.png
[[ -f $OUT/$NAME.png ]] && magick $OUT/$NAME.png -quality 94 $OUT/$NAME.webp && rm -f $OUT/$NAME.png $OUT/$NAME.stdout && ls -la $OUT/$NAME.webp
