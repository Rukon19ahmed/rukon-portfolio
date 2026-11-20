# Md Rukon Kholifa — Portfolio

Plain HTML, CSS and JavaScript. No framework, no npm, no build step.
All your text lives in `data/site.json`. All your videos live in `data/videos.json`.

> **Rule for placeholders:** anything written in `[square brackets]` is a placeholder. Replace it with your real info (and remove the brackets). Empty `""` values are hidden on the site.

---

## Preview on your computer

Browsers block reading `data/*.json` from a double-clicked file, so run a tiny local server.

1. Open a terminal in this folder (`C:\Users\mdruk\Videos\AI PORTFOLI`).
2. Run:
   ```bash
   python -m http.server 8000
   ```
3. Open **http://localhost:8000** in your browser.
4. Press `Ctrl + C` in the terminal to stop it.

Tip: if a change doesn't show, press `Ctrl + F5` to hard-refresh.

---

## Folder map

```
index.html            Home page
work.html             Case-study page (work.html?id=project-id)
data/site.json        Your name, bio, email, WhatsApp, socials, stats, services, availability
data/videos.json      Every project (order = order on the site, best first)
data/testimonials.json  Real client quotes (empty = section hidden)
videos/               Compressed MP4s (showreel.mp4 is the hero)
posters/              Poster images (.webp used on site, .jpg backup)
bts/                  Behind-the-scenes images for case studies
raw/                  Your original big files. NOT uploaded to GitHub.
scripts/              add-videos.ps1 (Windows) and add-videos.sh (Mac/Linux)
assets/css, assets/js Design and code
og-image.jpg          Share preview image (1200×630)
favicon.svg, *.png    "R" icon
render.yaml           Render hosting settings
```

---

## How to update my portfolio

### Add a new project (video)

1. Export your video and put the original file in the **`raw/`** folder.
   Use a simple name, e.g. `neon-city.mp4`. The name becomes the project id.
2. In a terminal in this folder, run:
   ```bash
   powershell -ExecutionPolicy Bypass -File scripts\add-videos.ps1
   ```
   (Mac/Linux: `bash scripts/add-videos.sh`)

   This makes `videos/neon-city.mp4` (web size, max 1080p) and `posters/neon-city.webp` + `.jpg`.
   It also detects if the video is vertical (9:16) and prints a ready-made block of text.
3. Open `data/videos.json`, paste the printed block where you want it in the list
   (**top = shown first**). Put a comma `,` between blocks.
4. Fill in the fields:

   | Field | What to write |
   |---|---|
   | `title` | Project name |
   | `tagline` | Optional short two-part line, e.g. "Real stories. Zero cameras." |
   | `description` | One line for the card |
   | `category` | e.g. `Short Films`, `Ads`, `Reels`. Filter buttons are made from these automatically |
   | `tools` | e.g. `["Seedance", "ElevenLabs"]` |
   | `featured` | `true` = big full-width tile on the home page (use for 1–3 projects only) |
   | `vertical` | `true` for 9:16 videos |
   | `hidden` | `true` = keep the project in the file but don't show it (e.g. video file not added yet). Delete the line or set `false` to show it |
   | `client` | Brand name, or `Personal project` |
   | `role` | What you did, e.g. "Director, editor, sound" |
   | `brief`, `idea` | 1–2 lines each (empty = hidden) |
   | `process` | Steps like Script → AI generation → Edit → Sound |
   | `results` | Real numbers only, plus `link` to the original post |
   | `behindTheScenes` | Before/after frames and prompt-to-final images (see below) |

5. Save, refresh the browser. Done.

Each project gets its own link to send to a client:
`https://YOUR-SITE.onrender.com/work.html?id=neon-city`

Options: `-Force` (Windows) / `--force` (Mac) re-does files that already exist.
If a video is over 90 MB the script warns you. GitHub blocks files over 100 MB, so trim it or raise the CRF (e.g. 28).

### Change the showreel (hero video)

Put your showreel in `raw/` named **`showreel.mp4`**, run the script. It replaces `videos/showreel.mp4` and `posters/showreel.webp` (use `-Force` if they already exist). Keep it 30–60 seconds, best shots only.

### Add behind-the-scenes images

1. Save images (WebP or JPG, around 1280px wide) in the `bts/` folder.
2. In that project's `behindTheScenes.items`, add one of these:
   ```json
   { "type": "compare", "before": "bts/neon-before.webp", "after": "bts/neon-after.webp",
     "beforeLabel": "Raw generation", "afterLabel": "Final", "caption": "What changed." }
   ```
   ```json
   { "type": "prompt", "prompt": "The prompt you used...", "image": "bts/neon-after.webp",
     "caption": "Prompt to final frame." }
   ```
   No items = the section is hidden.

### Change my bio, email, WhatsApp, socials

Open `data/site.json` and edit:
- `bio`, `heroLine` (the line under the hero), `role`
- `email` → the Email button
- `whatsapp` → your number with country code, digits only, e.g. `8801712345678`
- `socials.x`, `socials.instagram`, `socials.youtube` (empty `""` = hidden)

### Add a tool to the toolkit (with logo)

1. Save the logo (square PNG/JPG, at least 64×64, or an SVG) in `assets/logos/`.
2. In `data/site.json` → `toolkit`, add to the right group:
   ```json
   { "name": "Kling", "logo": "assets/logos/kling.png" }
   ```
   For a one-color SVG that should follow light/dark mode, add `"mono": true`.

### Toggle "Available for projects"

In `data/site.json` set `"available": true` or `"available": false`.
Edit `availableText` / `unavailableText` to change the wording.

### Results strip and collaborations

In `data/site.json`:
- `stats`: put **real** numbers only, e.g. `{ "value": "2.4M", "label": "Total views" }`. Delete any you don't have.
- `collaborations`: plain text names of programs and brands you've really worked with.
If both are empty `[]`, the whole section is hidden.

### Services and prices

`services` in `data/site.json`. To show a price, fill `startingFrom`, e.g. `"$300"` → shows "Starting from $300".

### Add a testimonial

Only real quotes, with permission. Open `data/testimonials.json` and write:
```json
[
  {
    "quote": "Rukon turned our launch idea into a film in four days.",
    "name": "Client Name",
    "role": "Founder, Brand",
    "link": "https://x.com/their-post"
  }
]
```
The section turns on automatically. Empty list `[]` = hidden.

### Waiting on files

- `the-maid-of-ashford-grand` and `men-dont-cry` (Instagram) are marked `"hidden": true` until you put
  `the-maid-of-ashford-grand.mp4` and `men-dont-cry.mp4` in `raw/` and run the script. Then remove the `"hidden": true` line.
- The hero currently plays a copy of *The Last Radio* as `showreel.mp4`. When your real showreel is ready, put it in `raw/showreel.mp4` and run the script with `-Force`.

---

## Before you deploy (checklist)

- [ ] Replace every `[placeholder]` in `data/site.json` and `data/videos.json`
- [ ] Replace sample videos and the showreel
- [ ] In `index.html` and `work.html`, replace `https://YOUR-SITE.onrender.com` with your real address (needed for the X/WhatsApp share preview image)
- [ ] Optional: make a nicer `og-image.jpg` (1200×630, e.g. a still from your best film with your name)

## Deploy to Render (free Static Site), when you're ready

1. Create a GitHub repo and push this folder (`raw/` is ignored automatically).
2. On render.com: **New → Blueprint**, pick the repo. It reads `render.yaml`
   (or **New → Static Site**: Build command = empty, Publish directory = `.`).
3. Every `git push` updates the site.

## Free visitor analytics (no cookie banner needed)

**Option A — GoatCounter (simplest)**
1. Sign up free at goatcounter.com and pick a code, e.g. `rukon`.
2. In `index.html` and `work.html`, find the commented analytics block in the `<head>`.
3. Remove the `<!--` and `-->` around the GoatCounter line, delete the Cloudflare line, and replace `YOUR-CODE` with your code.
4. Visit `https://rukon.goatcounter.com` to see your stats.

**Option B — Cloudflare Web Analytics**
1. Free Cloudflare account → Web Analytics → Add site → copy the token.
2. Uncomment the Cloudflare line instead and paste your token in place of `YOUR-CLOUDFLARE-TOKEN`.

## Notes

- The site opens in **dark mode**. Visitors can switch to light with the sun/moon button in the top bar, and their choice is remembered. To make light the default, change `t === 'light' ? 'light' : 'dark'` to `t === 'dark' ? 'dark' : 'light'` in the small script at the top of `index.html` and `work.html`.
- Link previews (X, WhatsApp) can't run JavaScript, so a shared project link shows the main site card, not that project's poster.
- Only the hero video autoplays. Grid videos load only on hover (desktop) or when opened.
- People with "reduce motion" turned on get no autoplay and no scroll animations.
- `python -m http.server` doesn't support seeking in long videos perfectly. Render does.
