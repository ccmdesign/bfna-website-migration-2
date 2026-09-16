#!/bin/zsh
# Usage: split.sh <name>  — splits out/<name>.png|webp (vertical diptych) at the white gutter into
# out/<name>-capitol.webp (top) and out/<name>-reichstag.webp (bottom), trimming the gutter.
set -u
NAME=$1
cd "$(dirname "$0")/out"
SRC=$SRC; [[ -f $SRC ]] || SRC=$NAME.webp
H=$(magick identify -format '%h' $SRC); W=$(magick identify -format '%w' $SRC)
# mean luminance per row; gutter rows are near-white (>250 of 255)
ROWS=$(magick $SRC -colorspace Gray -scale "1x${H}!" -depth 8 txt:- | awk -F'[(),: ]+' 'NR>1{ if ($4>250) print $2 }')
TOP=$(echo "$ROWS" | awk 'NR==1'); BOT=$(echo "$ROWS" | tail -1)
if [[ -z $TOP ]]; then TOP=$((H/2-12)); BOT=$((H/2+12)); fi
magick $SRC -crop "${W}x${TOP}+0+0" +repage $NAME-capitol.webp
magick $SRC -crop "${W}x$((H-BOT-1))+0+$((BOT+1))" +repage $NAME-reichstag.webp
echo "$NAME gutter rows $TOP..$BOT -> capitol ${W}x${TOP}, reichstag ${W}x$((H-BOT-1))"
