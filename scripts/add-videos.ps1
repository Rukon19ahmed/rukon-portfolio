<#
  add-videos.ps1  (Windows)

  Compresses every video in /raw/ for the web and makes posters.
    - H.264 MP4, CRF 26, max 1080p, AAC audio, +faststart  ->  /videos/<name>.mp4
    - Poster from 1 second in (JPG + small WebP)            ->  /posters/<name>.jpg / .webp
    - Warns if a video is over 90 MB (GitHub blocks files over 100 MB)
    - Prints a ready-to-paste entry for data/videos.json

  Usage (from the portfolio folder):
    powershell -ExecutionPolicy Bypass -File scripts\add-videos.ps1
    powershell -ExecutionPolicy Bypass -File scripts\add-videos.ps1 -Force   # redo files that already exist

  Needs ffmpeg:  winget install Gyan.FFmpeg
#>
param([switch]$Force)

$ErrorActionPreference = 'Continue'
$root    = Split-Path -Parent $PSScriptRoot
$raw     = Join-Path $root 'raw'
$videos  = Join-Path $root 'videos'
$posters = Join-Path $root 'posters'
$limitMB = 90

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Host 'ffmpeg was not found. Install it with:  winget install Gyan.FFmpeg  (then open a new terminal)' -ForegroundColor Red
  exit 1
}
$hasProbe = [bool](Get-Command ffprobe -ErrorAction SilentlyContinue)

foreach ($dir in @($raw, $videos, $posters)) {
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
}

$exts  = @('.mp4', '.mov', '.m4v', '.mkv', '.webm', '.avi')
$files = @(Get-ChildItem -Path $raw -File | Where-Object { $exts -contains $_.Extension.ToLower() })

if ($files.Count -eq 0) {
  Write-Host "No videos found in $raw. Put your original files there and run this again." -ForegroundColor Yellow
  exit 0
}

# Max 1080p: landscape keeps height <= 1080, vertical keeps width <= 1080. Never upscales.
$scale       = "scale='if(gte(iw,ih),-2,min(1080,iw))':'if(gte(iw,ih),min(1080,ih),-2)'"
# Posters: 1280px wide for landscape, 720px wide for vertical. Small and fast.
$posterScale = "scale='if(gte(iw,ih),min(1280,iw),min(720,iw))':-2"

$big = @()
$snippets = @()

foreach ($f in $files) {
  $slug = ($f.BaseName.ToLower() -replace '[^a-z0-9]+', '-').Trim('-')
  $out  = Join-Path $videos "$slug.mp4"
  $jpg  = Join-Path $posters "$slug.jpg"
  $webp = Join-Path $posters "$slug.webp"

  Write-Host ""
  Write-Host "== $($f.Name)  ->  videos/$slug.mp4" -ForegroundColor Cyan

  if ((Test-Path $out) -and -not $Force) {
    Write-Host '   video already exists, skipping (use -Force to redo)'
  } else {
    & ffmpeg -hide_banner -loglevel error -stats -y -i $f.FullName `
      -map 0:v:0 -map '0:a:0?' `
      -c:v libx264 -preset slow -crf 26 -profile:v high -pix_fmt yuv420p -vf $scale `
      -c:a aac -b:a 160k -ac 2 `
      -movflags +faststart $out
    if ($LASTEXITCODE -ne 0) { Write-Host "   ffmpeg failed on $($f.Name)" -ForegroundColor Red; continue }
  }

  if ((Test-Path $jpg) -and (Test-Path $webp) -and -not $Force) {
    Write-Host '   posters already exist, skipping'
  } else {
    & ffmpeg -hide_banner -loglevel error -y -ss 1 -i $out -frames:v 1 -vf $posterScale -q:v 3 $jpg
    if (-not (Test-Path $jpg) -or (Get-Item $jpg).Length -eq 0) {
      # Clip shorter than 1 second: use the first frame.
      & ffmpeg -hide_banner -loglevel error -y -i $out -frames:v 1 -vf $posterScale -q:v 3 $jpg
    }
    & ffmpeg -hide_banner -loglevel error -y -i $jpg -c:v libwebp -quality 80 $webp
    Write-Host "   posters/$slug.jpg + posters/$slug.webp"
  }

  $sizeMB = [math]::Round((Get-Item $out).Length / 1MB, 1)
  Write-Host "   size: $sizeMB MB"
  if ($sizeMB -gt $limitMB) {
    Write-Host "   WARNING: over $limitMB MB. GitHub blocks files over 100 MB. Trim it, or re-run with a higher CRF." -ForegroundColor Yellow
    $big += "videos/$slug.mp4 ($sizeMB MB)"
  }

  $vertical = 'false'
  if ($hasProbe) {
    $dims = (& ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 $out) -split ','
    if ($dims.Count -ge 2 -and [int]$dims[1] -gt [int]$dims[0]) { $vertical = 'true' }
  }
  $title = (Get-Culture).TextInfo.ToTitleCase(($slug -replace '-', ' '))
  $snippets += @"
  {
    "id": "$slug",
    "title": "$title",
    "tagline": "",
    "description": "One line about this video.",
    "category": "Short Films",
    "tools": ["Tool one", "Tool two"],
    "file": "videos/$slug.mp4",
    "poster": "posters/$slug.webp",
    "featured": false,
    "vertical": $vertical,
    "year": "$((Get-Date).Year)",
    "client": "Personal project",
    "role": "",
    "brief": "",
    "idea": "",
    "process": [],
    "results": { "stats": [], "link": "", "linkLabel": "See the original post" },
    "behindTheScenes": { "intro": "", "items": [] }
  }
"@
}

Write-Host ""
Write-Host "Done. Copy the entries you need into data/videos.json (keep the commas between entries):" -ForegroundColor Green
Write-Host ($snippets -join ",`n")

if ($big.Count -gt 0) {
  Write-Host ""
  Write-Host "These files are over $limitMB MB:" -ForegroundColor Yellow
  $big | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}
