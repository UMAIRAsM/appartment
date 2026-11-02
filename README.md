# Altiora scroll-video website

## Folder layout
```
index.html
style.css
script.js
extract-frames.sh
frames/        <- created by the script (frame_0001.webp ...)
images/        <- your photos (see names below)
```

## Step 1 - Test the layout right now
Run a local server and open it. Without frames it shows a placeholder sky-to-tower animation, so you can check every section.
```
python3 -m http.server 8000
```
Open http://localhost:8000 (don't double-click index.html; images won't load that way).

## Step 2 - Split your Flow video into frames
1. Install ffmpeg: Windows `winget install ffmpeg`, Mac `brew install ffmpeg`.
2. Put your MP4 in this folder and run:
   ```
   ./extract-frames.sh flow-video.mp4 24 1280
   ```
   (Windows: use Git Bash, or run the ffmpeg line from the script by hand after making a `frames` folder.)
3. The script prints a frame count. Open `script.js` and set `count:` to that number.
4. Refresh the page. The loader now shows real progress and the video scrubs with scroll.

## Step 3 - Add your photos to images/
Any missing photo shows a coloured gradient, so nothing breaks.

Rooms: `room-drawing.jpg`, `room-lounge.jpg`, `room-bedroom.jpg`, `room-rooftop.jpg` (landscape 16:9, about 1920px wide)
Amenities: `amenity-gym.jpg`, `amenity-padel.jpg`, `amenity-cricket.jpg`, `amenity-pool.jpg`, `amenity-sauna.jpg`, `amenity-cinema.jpg`, `amenity-mall.jpg` (portrait 3:4, about 800px wide)

Compress them (squoosh.app) so each is under about 300 KB.

## Step 4 - Replace the text
- Floating cards, stats, slogan, room captions and amenity descriptions are all in `index.html`.
- Floating card timing: `data-from` / `data-to` (0 to 1 through the descent).
- Booking details: `CONFIG.whatsapp` at the top of `script.js` (country code, no +), plus the phone/email in the contact list.

## Tuning
- Descent feels too short or long: change `#descent{height:550vh}` in `style.css`.
- Rooms / amenities speed: `#rooms` and `#amenities` heights in `style.css`.
- Smoother or snappier video: `smoothing` in `script.js`.
- Amenity wave: `gap` (card spacing) and `amp` (wave width) in `updateAmenities`.
- Site loads slowly: re-run the script with fps 15 (fewer frames).

## Deploy
Upload the whole folder to Netlify, Vercel or Cloudflare Pages (drag and drop works).
