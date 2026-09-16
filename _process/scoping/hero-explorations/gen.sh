#!/bin/zsh
# Usage: gen.sh <view: front|dome|perspective> <style: clay|photo>
# Generates one vertical diptych (top: US Capitol, bottom: Reichstag) with GPT Image 2 via codex exec.
set -u
VIEW=$1; STYLE=$2
DIR=/Users/claudioccm/_files/_ccmdesign/clients/bfna/bfna-website-migration-2/_process/scoping/hero-explorations
OUT=$DIR/out; mkdir -p $OUT
NAME="${VIEW}-${STYLE}"

case $VIEW in
  front) CAM="Camera: straight-on front elevation, dead centre on the building's axis of symmetry, eye level slightly below the main cornice, horizon line at exactly 62% of the panel height from the top, long lens (about 85mm equivalent) so verticals stay parallel. The building fills about 90% of the panel width. Ground line at 78% of the panel height. Dome apex at 8% of the panel height."
         REFS=(refs/capitol-front.webp refs/reichstag-front.png);;
  dome)  CAM="Camera: tight crop on the dome only, from the ground looking up at about 35 degrees, dome centred, apex at 6% of the panel height, drum base at 85% of the panel height, the dome filling about 80% of the panel width, medium lens. Nothing but sky around the dome."
         REFS=(refs/capitol-front.webp refs/reichstag-dome.jpg);;
  portico) CAM="Camera: straight-on front elevation, dead centre on the building's axis of symmetry, eye level slightly below the main cornice, long lens (about 85mm equivalent) so verticals stay parallel. REGISTRATION IS ON THE CENTRAL PORTICO, not on the building: in both panels the triangular pediment's apex sits at exactly 42% of the panel height from the top, the pediment's base (the entablature line) at 50%, the pediment spans from 36% to 64% of the panel width, the bases of the portico columns sit at 76% of the panel height, and the top of the entry steps at 78%. Scale each building so its pediment lands exactly there; let the dome, towers, wings and ground fall wherever that scale puts them, even if the wings run off the panel edges. Horizon at the column bases."
         REFS=(refs/capitol-front.webp refs/reichstag-front.png);;
  perspective) CAM="Camera: three-quarter view from the front-left, about 30 degrees off axis, camera elevated slightly (about 12 metres), medium lens (35mm equivalent), horizon at 55% of panel height, nearest corner of the building at 20% from the left edge, dome apex at 10% of panel height, ground line at 80% of panel height."
         REFS=(refs/capitol-oblique.jpg refs/reichstag-front.png);;
esac

case $STYLE in
  clay)  LOOK="Style: matte white clay / plaster 3D render, one single uniform material, soft studio lighting from the upper left, gentle ambient occlusion, pale warm-grey seamless studio background, no sky, no people, no cars, no flags, no vegetation, no text except the carved pediment inscription on the Reichstag. Clean, calm, premium, like a scale architectural model.";;
  photo) LOOK="Style: photorealistic architectural photograph, bright overcast even light with soft shadows, clean pale sky, no people, no cars, no flags on the poles, no vegetation, colour graded slightly desaturated and cool, tack sharp.";;
esac

PROMPT="Generate ONE image, portrait 1024x1536, made of TWO panels stacked vertically with a thin 24px white gutter between them.

TOP panel: the United States Capitol in Washington DC, west front, architecturally accurate: the cast-iron dome with its drum of columns and the Statue of Freedom on top, the central portico, the two symmetric wings.
BOTTOM panel: the Reichstag building in Berlin, west front facing Platz der Republik, architecturally accurate: the four corner towers, the central portico with columns and the carved inscription DEM DEUTSCHEN VOLKE, and Norman Foster's glass dome behind and above the portico.

The two panels MUST share exactly the same camera, focal length, framing and lighting so the silhouettes line up when overlaid: $CAM Apply that identical framing to both buildings even though their proportions differ; scale each building so the landmarks land on those percentages.

$LOOK

Reference photos are attached for architectural accuracy only, not for framing or style.

Use the image generation tool. Then copy the generated PNG to $OUT/$NAME.png using a shell command and reply with only the final path."

cd $DIR
codex exec -s workspace-write -C $DIR -i ${REFS[@]} --skip-git-repo-check -o $OUT/$NAME.log "$PROMPT" > $OUT/$NAME.stdout 2>&1
echo "exit=$? $NAME"
[[ -f $OUT/$NAME.png ]] && magick $OUT/$NAME.png -quality 92 $OUT/$NAME.webp && rm $OUT/$NAME.png && ls -la $OUT/$NAME.webp
