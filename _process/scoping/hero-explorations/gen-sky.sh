#!/bin/zsh
# Round 3 — minimalist "big sky" pairs. Dome centred, building low in the frame, open sky above.
# Usage: gen-sky.sh <diptych|capitol|reichstag> [tag]
#   diptych   — one 1024x1536 image, two stacked panels (top Capitol, bottom Reichstag). Locks the pair.
#   capitol   — single 1536x1024 landscape of the Capitol.
#   reichstag — single 1536x1024 landscape of the Reichstag, given out/sky-capitol[-tag].webp as the
#               look/framing reference so the second run matches the first.
set -u
MODE=$1; TAG=${2:-}
DIR=/Users/claudioccm/_files/_ccmdesign/clients/bfna/bfna-website-migration-2/_process/scoping/hero-explorations
OUT=$DIR/out; mkdir -p $OUT
NAME="sky-$MODE${TAG:+-$TAG}"

CAPITOL="the United States Capitol in Washington DC, west front, architecturally accurate: the cast-iron dome with its colonnaded drum and the Statue of Freedom on top, the central portico with its triangular pediment, the two symmetric wings"
REICHSTAG="the Reichstag building in Berlin, west front facing Platz der Republik, architecturally accurate: the four corner towers, the central portico with six columns, triangular pediment and the carved inscription DEM DEUTSCHEN VOLKE, and Norman Foster's glass dome centred behind and above the portico"

FRAME="Composition, identical for both buildings: straight-on front elevation, camera dead centre on the building's axis of symmetry, long lens so verticals are parallel and there is no keystone distortion. THE DOME IS EXACTLY CENTRED HORIZONTALLY at 50% of the width. The building sits LOW in the frame: the whole building occupies only the bottom 40% of the image height; the dome's apex is at 60% from the top at the highest; the top of the entrance steps is at 96%, and the frame crops just below that so almost no ground is visible. The central portico's pediment spans 40% to 60% of the width. Everything above the building, the top 60% of the image, is open empty sky."

SKY="Sky: large, clear, calm. A smooth soft blue gradient, deeper blue at the top, paler near the horizon, with only three or four small sparse white cumulus clouds scattered far apart, none touching or overlapping the dome or towers. No dramatic clouds, no sunset colour, no haze."

LOOK="Style: minimalist photorealistic architectural photograph. Soft frontal late-morning daylight, gentle shadows, natural stone colour slightly desaturated, clean and quiet. ABSOLUTELY NO people, cars, flags, flagpoles, trees, grass, lampposts, fences, scaffolding, cranes, birds or aircraft. No text other than the carved pediment inscription."

case $MODE in
  diptych)
    REFS=(refs2/capitol-front-a.jpg refs2/capitol-front-b.jpg refs2/reichstag-front-a.jpg refs2/reichstag-front-b.jpg)
    SIZE="portrait 1024x1536, made of TWO panels stacked vertically with a thin 24px white gutter between them"
    SUBJECT="TOP panel: $CAPITOL.
BOTTOM panel: $REICHSTAG.
Both panels must share exactly the same camera, framing, light, colour grade and the same sky, so one can be overlaid on the other and only the building changes.";;
  capitol)
    REFS=(refs2/capitol-front-a.jpg refs2/capitol-front-b.jpg)
    SIZE="landscape 1536x1024, a single photograph"
    SUBJECT="Subject: $CAPITOL.";;
  reichstag)
    SRC=$OUT/sky-capitol${TAG:+-$TAG}.webp
    [[ -f $SRC ]] || { echo "missing $SRC — run 'gen-sky.sh capitol $TAG' first"; exit 1; }
    magick $SRC $OUT/.sky-capitol-ref.png
    REFS=(out/.sky-capitol-ref.png refs2/reichstag-front-a.jpg refs2/reichstag-front-b.jpg)
    SIZE="landscape 1536x1024, a single photograph"
    SUBJECT="Subject: $REICHSTAG.
The FIRST attached image is a photograph of a different building (the US Capitol). Match it exactly in camera position, lens, horizon height, how low the building sits in the frame, the building's width in the frame, the light direction, the colour grade, and above all THE SKY: reproduce the same sky, same gradient, same clouds in the same places. Only the building changes. The other attached images are for the Reichstag's architecture only.";;
esac

PROMPT="Generate ONE image, $SIZE.

$SUBJECT

$FRAME

$SKY

$LOOK

Attached reference photos are for architectural accuracy only (ignore their people, flags, lawns, skies and framing) unless stated otherwise above.

Use the image generation tool. Then copy the generated PNG to $OUT/$NAME.png using a shell command and reply with only the final path."

cd $DIR
codex exec -s workspace-write -C $DIR -i ${REFS[@]} --skip-git-repo-check -o $OUT/$NAME.log "$PROMPT" < /dev/null > $OUT/$NAME.stdout 2>&1
echo "exit=$? $NAME"
[[ -f $OUT/$NAME.png ]] && magick $OUT/$NAME.png -quality 92 $OUT/$NAME.webp && rm -f $OUT/$NAME.png $OUT/$NAME.log $OUT/$NAME.stdout && ls -la $OUT/$NAME.webp
