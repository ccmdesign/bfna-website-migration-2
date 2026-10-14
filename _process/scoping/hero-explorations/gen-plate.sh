#!/bin/zsh
# Empty plate: the zoomed-out Capitol scene with the building removed — sky + plaza only.
set -u
DIR=/Users/claudioccm/_files/_ccmdesign/clients/bfna/bfna-website-migration-2/_process/scoping/hero-explorations
OUT=$DIR/out; NAME="wide-plate${1:+-$1}"
magick $OUT/wide-extension-capitol.webp $OUT/.plate-ref.png
PROMPT="Generate ONE square image, 1024x1024.

Reproduce the attached photograph EXACTLY — same sky, same blue gradient, every cloud in the same place and shape, same flat paved plaza across the bottom with the same horizon line and the same light — but with the building completely removed, as if it had never been there: where the building stood there is only the continuation of the same sky gradient down to the plaza, and the plaza runs uninterrupted from edge to edge. Nothing else in the frame: no people, objects, trees, shadows, birds, aircraft or text.

Use the image generation tool. Then copy the generated PNG to $OUT/$NAME.png using a shell command and reply with only the final path."
cd $DIR
codex exec -s workspace-write -C $DIR -i out/.plate-ref.png --skip-git-repo-check "$PROMPT" < /dev/null > $OUT/$NAME.stdout 2>&1
echo "exit=$? $NAME"; rm -f $OUT/.plate-ref.png
[[ -f $OUT/$NAME.png ]] && magick $OUT/$NAME.png -quality 94 $OUT/$NAME.webp && rm -f $OUT/$NAME.png $OUT/$NAME.stdout && ls -la $OUT/$NAME.webp
