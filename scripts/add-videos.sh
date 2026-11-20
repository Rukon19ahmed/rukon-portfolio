#!/usr/bin/env bash
# add-videos.sh  (Mac / Linux / Git Bash)
#
# Compresses every video in /raw/ for the web and makes posters.
#   - H.264 MP4, CRF 26, max 1080p, AAC audio, +faststart  ->  /videos/<name>.mp4
#   - Poster from 1 second in (JPG + small WebP)            ->  /posters/<name>.jpg / .webp
#   - Warns if a video is over 90 MB (GitHub blocks files over 100 MB)
#   - Prints a ready-to-paste entry for data/videos.json
#
# Usage (from the portfolio folder):
#   bash scripts/add-videos.sh
#   bash scripts/add-videos.sh --force     # redo files that already exist
#
# Needs ffmpeg:  brew install ffmpeg   (Mac)   |   sudo apt install ffmpeg   (Linux)

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/raw"
VIDEOS="$ROOT/videos"
POSTERS="$ROOT/posters"
LIMIT_MB=90
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg was not found. Install it first (brew install ffmpeg / sudo apt install ffmpeg)."
  exit 1
fi
HAS_PROBE=0
command -v ffprobe >/dev/null 2>&1 && HAS_PROBE=1

mkdir -p "$RAW" "$VIDEOS" "$POSTERS"

SCALE="scale='if(gte(iw,ih),-2,min(1080,iw))':'if(gte(iw,ih),min(1080,ih),-2)'"
POSTER_SCALE="scale='if(gte(iw,ih),min(1280,iw),min(720,iw))':-2"

shopt -s nullglob nocaseglob
FILES=("$RAW"/*.mp4 "$RAW"/*.mov "$RAW"/*.m4v "$RAW"/*.mkv "$RAW"/*.webm "$RAW"/*.avi)
shopt -u nocaseglob

if [ ${#FILES[@]} -eq 0 ]; then
  echo "No videos found in $RAW. Put your original files there and run this again."
  exit 0
fi

BIG=()
SNIPPETS=()
YEAR="$(date +%Y)"

for f in "${FILES[@]}"; do
  base="$(basename "$f")"
  name="${base%.*}"
  slug="$(echo "$name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
  out="$VIDEOS/$slug.mp4"
  jpg="$POSTERS/$slug.jpg"
  webp="$POSTERS/$slug.webp"

  echo ""
  echo "== $base  ->  videos/$slug.mp4"

  if [ -f "$out" ] && [ $FORCE -eq 0 ]; then
    echo "   video already exists, skipping (use --force to redo)"
  else
    if ! ffmpeg -hide_banner -loglevel error -stats -y -i "$f" \
        -map 0:v:0 -map '0:a:0?' \
        -c:v libx264 -preset slow -crf 26 -profile:v high -pix_fmt yuv420p -vf "$SCALE" \
        -c:a aac -b:a 160k -ac 2 \
        -movflags +faststart "$out"; then
      echo "   ffmpeg failed on $base"
      continue
    fi
  fi

  if [ -f "$jpg" ] && [ -f "$webp" ] && [ $FORCE -eq 0 ]; then
    echo "   posters already exist, skipping"
  else
    ffmpeg -hide_banner -loglevel error -y -ss 1 -i "$out" -frames:v 1 -vf "$POSTER_SCALE" -q:v 3 "$jpg"
    if [ ! -s "$jpg" ]; then
      # Clip shorter than 1 second: use the first frame.
      ffmpeg -hide_banner -loglevel error -y -i "$out" -frames:v 1 -vf "$POSTER_SCALE" -q:v 3 "$jpg"
    fi
    ffmpeg -hide_banner -loglevel error -y -i "$jpg" -c:v libwebp -quality 80 "$webp"
    echo "   posters/$slug.jpg + posters/$slug.webp"
  fi

  bytes=$(wc -c < "$out" | tr -d ' ')
  size_mb=$(awk "BEGIN { printf \"%.1f\", $bytes / 1048576 }")
  echo "   size: $size_mb MB"
  if awk "BEGIN { exit !($bytes / 1048576 > $LIMIT_MB) }"; then
    echo "   WARNING: over $LIMIT_MB MB. GitHub blocks files over 100 MB. Trim it, or re-run with a higher CRF."
    BIG+=("videos/$slug.mp4 ($size_mb MB)")
  fi

  vertical=false
  if [ $HAS_PROBE -eq 1 ]; then
    dims="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$out")"
    w="${dims%%,*}"; h="${dims##*,}"
    [ "${h:-0}" -gt "${w:-0}" ] 2>/dev/null && vertical=true
  fi
  title="$(echo "$slug" | sed -E 's/-/ /g; s/\b(.)/\u\1/g')"

  SNIPPETS+=("  {
    \"id\": \"$slug\",
    \"title\": \"$title\",
    \"tagline\": \"\",
    \"description\": \"One line about this video.\",
    \"category\": \"Short Films\",
    \"tools\": [\"Tool one\", \"Tool two\"],
    \"file\": \"videos/$slug.mp4\",
    \"poster\": \"posters/$slug.webp\",
    \"featured\": false,
    \"vertical\": $vertical,
    \"year\": \"$YEAR\",
    \"client\": \"Personal project\",
    \"role\": \"\",
    \"brief\": \"\",
    \"idea\": \"\",
    \"process\": [],
    \"results\": { \"stats\": [], \"link\": \"\", \"linkLabel\": \"See the original post\" },
    \"behindTheScenes\": { \"intro\": \"\", \"items\": [] }
  }")
done

echo ""
echo "Done. Copy the entries you need into data/videos.json (keep the commas between entries):"
for i in "${!SNIPPETS[@]}"; do
  if [ "$i" -gt 0 ]; then echo ","; fi
  echo "${SNIPPETS[$i]}"
done

if [ ${#BIG[@]} -gt 0 ]; then
  echo ""
  echo "These files are over $LIMIT_MB MB:"
  for b in "${BIG[@]}"; do echo "  - $b"; done
fi
