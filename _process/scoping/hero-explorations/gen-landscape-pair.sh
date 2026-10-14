#!/bin/zsh
# Round 7 — square 1:1 pair straight from the model, no compositing. Building small and centred low,
# big sky. Capitol first; Reichstag generated with the Capitol image as its match reference.
# Usage: gen-square-pair.sh <capitol|reichstag> [tag]
set -u
B=$1; TAG=${2:-}
DIR=/Users/claudioccm/_files/_ccmdesign/clients/bfna/bfna-website-migration-2/_process/scoping/hero-explorations
OUT=$DIR/out; NAME="ls-$B${TAG:+-$TAG}"
CAPITOL="the United States Capitol in Washington DC, west front, architecturally accurate: the cast-iron dome with its colonnaded drum and the Statue of Freedom on top, the central portico with its triangular pediment, the two symmetric wings with their end pavilions fully visible"
REICHSTAG="the Reichstag building in Berlin, west front facing Platz der Republik, architecturally accurate: the four corner towers, the central portico with six columns, triangular pediment and the carved inscription DEM DEUTSCHEN VOLKE, and Norman Foster's glass dome centred behind and above the portico"
FRAME="Composition: straight-on front elevation, camera dead centre on the building's axis of symmetry, long lens so verticals are parallel. The building is SMALL in the frame: it spans only the central 55% of the width (from about 22% to 78%), the dome exactly centred horizontally, and it sits at the very bottom of the frame on a thin strip of flat paved plaza that runs edge to edge; the top of the building's dome is no higher than 58% of the way down from the top. Everything above and beside the building is open sky."
SKY="Sky: large, clear, calm. A smooth soft blue gradient, deeper blue at the top, paler near the horizon, with five or six small sparse white cumulus clouds scattered far apart across the whole sky, none touching the building. No dramatic clouds, no sunset colour, no haze."
LOOK="Style: minimalist photorealistic architectural photograph. Soft frontal late-morning daylight, gentle shadows, natural stone colour slightly desaturated, clean and quiet. ABSOLUTELY NO people, cars, flags, flagpoles, trees, grass, lampposts, fences, birds or aircraft. No text other than the carved pediment inscription."
case $B in
  capitol)
    REFS=(refs2/capitol-front-a.jpg refs2/capitol-front-b.jpg)
    SUBJECT="Subject: $CAPITOL.";;
  reichstag)
    SRC=$OUT/ls-capitol${TAG:+-$TAG}.webp
    [[ -f $SRC ]] || { echo "missing $SRC"; exit 1; }
    magick $SRC $OUT/.sq-ref.png
    REFS=(out/.sq-ref.png refs2/reichstag-front-a.jpg refs2/reichstag-front-b.jpg)
    SUBJECT="Subject: $REICHSTAG.
The FIRST attached image is a photograph of a different building (the US Capitol). Match it EXACTLY in camera position, lens, horizon height, the building's width in the frame, how low it sits, the plaza strip, the light direction, the colour grade, and above all THE SKY: reproduce the same sky, same gradient, same clouds in the same places. Only the building changes. The other attached images are for the Reichstag's architecture only.";;
esac
PROMPT="Generate ONE landscape image, 1536x1024.

$SUBJECT

$FRAME

$SKY

$LOOK

Attached reference photos are for architectural accuracy only (ignore their people, flags, lawns, skies and framing) unless stated otherwise above.

Use the image generation tool. Then copy the generated PNG to $OUT/$NAME.png using a shell command and reply with only the final path."
cd $DIR
codex exec -s workspace-write -C $DIR -i ${REFS[@]} --skip-git-repo-check "$PROMPT" < /dev/null > $OUT/$NAME.stdout 2>&1
echo "exit=$? $NAME"; rm -f $OUT/.sq-ref.png
[[ -f $OUT/$NAME.png ]] && magick $OUT/$NAME.png -quality 94 $OUT/$NAME.webp && rm -f $OUT/$NAME.png $OUT/$NAME.stdout && ls -la $OUT/$NAME.webp
