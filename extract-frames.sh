#!/usr/bin/env bash
# Usage:   ./extract-frames.sh your-video.mp4 [fps] [width]
# Example: ./extract-frames.sh flow-video.mp4 24 1280
#
# Splits the video into numbered WebP images in ./frames/ (smaller than JPG).
# Then set  frames.count  in script.js to the number printed at the end.

set -e
VIDEO="${1:?Give the video file, e.g. ./extract-frames.sh flow-video.mp4}"
FPS="${2:-24}"        # 24 = smooth scrubbing. Use 15 for a lighter site.
WIDTH="${3:-1280}"    # 1280 suits a 720p source

command -v ffmpeg >/dev/null || { echo "ffmpeg not found - install it first (see README)."; exit 1; }

rm -rf frames && mkdir frames
ffmpeg -i "$VIDEO" -vf "fps=${FPS},scale=${WIDTH}:-2" -c:v libwebp -quality 78 frames/frame_%04d.webp

COUNT=$(ls frames | wc -l | tr -d ' ')
echo ""
echo "Done. Created $COUNT frames."
echo ">>> In script.js set   count: $COUNT"
