---
name: hyperframes-production
description: >-
  Programmatic HTML/CSS/GSAP video generation for EvaLine products and automated marketing.
  Renders MP4/WebM product tours, animated title cards, and TTS-synchronized video promos.
---

# HyperFrames Video Production (EvaBot & EvaLine)

Programmatic, deterministic video rendering from HTML, CSS, and GSAP animations using the `hyperframes` engine.

## Use Cases for EvaBot & EvaLine
1. **EvaLine Product Video Promos:** Generate automated video showcases for EVA foam products directly from `/var/www/evabot-backend/data/products.json` (auto-mats, tatami, sports flooring, orthopedic sheets).
2. **Synchronized Voiceover Videos:** Combine Edge-TTS Svetlana/Polina audio (`ru-RU-SvetlanaNeural`) with animated kinetic typography and slide transitions.
3. **Telegram & Web Video Cards:** Export 16:9 or 9:16 vertical MP4s for marketing channels and social media.

## Quick CLI Workflows

```bash
# 1. Initialize a new video composition
npx hyperframes init evaline-promo --non-interactive

# 2. Render directly to MP4 with FFmpeg
npx hyperframes render --output /var/www/evabot-backend/public/video/promo.mp4 --fps 24 --format mp4

# 3. Diagnose rendering environment
npx hyperframes doctor
```

## Production Guidelines & Resource Guardrails

1. **CPU & Memory Guardrail (No GPU Server):**
   - Our host is an 8-vCPU Intel Xeon server without discrete GPU.
   - **Do NOT leave `npx hyperframes preview` running in background**: It spawns `chrome-headless-shell` which uses software WebGL and consumes CPU.
   - Always run deterministic one-shot rendering: `npx hyperframes render ...` and verify process termination.

2. **Integration with EvaBot Voice Engine:**
   - Generate speech audio first:
     `python3 -m edge_tts --voice ru-RU-SvetlanaNeural --text "..." --write-media promo_audio.mp3`
   - Feed `promo_audio.mp3` as the audio track in `data-audio` attribute inside the composition HTML.
   - GSAP timeline markers match the audio cue points.

3. **Output Destinations:**
   - Save rendered deliverables to `/var/www/evabot-backend/public/media/` or attach to Telegram outbound messages.
