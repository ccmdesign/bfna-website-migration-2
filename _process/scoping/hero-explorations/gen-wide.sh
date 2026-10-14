#!/bin/zsh
# Round 6 — zoom out: sky to the sides, building smaller. The model only supplies surroundings;
# compose-wide.sh pastes the original render (scaled) back over the middle.
# Usage: gen-wide.sh <capitol|reichstag> [tag]
set -u
B=$1; TAG=${2:-}
DIR=/Users/claudioccm/_files/_ccmdesign/clients/bfna/bfna-website-migration-2/_process/scoping/hero-explorations
OUT=$DIR/out; NAME="wide-extension-$B${TAG:+-$TAG}"
magick $OUT/sky-$B-square.webp $OUT/.wide-ref-$B.png
PROMPT="Generate ONE square image, 1024x1024.

The attached photograph shows a building filling the full width of its frame. Produce the SAME scene photographed from farther away, so the building is smaller and there is open space around it: the building, unchanged in every detail, now spans only the central 60% of the width (from 20% to 80%), still centred, still sitting at the very bottom of the frame with the same tiny strip of plaza under it. The ends of the building's two wings are now fully inside the frame, with open sky beyond them on both sides. The flat paved plaza continues to both edges. Everything else is the same clear sky: the same smooth blue gradient, the same clouds in the same positions relative to the building, plus two or three more small sparse cumulus clouds in the new sky areas at the sides. Same light, same colour grade. No people, cars, flags, trees, lampposts, birds, aircraft, or added text.

Use the image generation tool. Then copy the generated PNG to $OUT/$NAME.png using a shell command and reply with only the final path."
cd $DIR
codex exec -s workspace-write -C $DIR -i out/.wide-ref-$B.png --skip-git-repo-check "$PROMPT" < /dev/null > $OUT/$NAME.stdout 2>&1
echo "exit=$? $NAME"; rm -f $OUT/.wide-ref-$B.png
[[ -f $OUT/$NAME.png ]] && magick $OUT/$NAME.png -quality 94 $OUT/$NAME.webp && rm -f $OUT/$NAME.png $OUT/$NAME.stdout && ls -la $OUT/$NAME.webp
