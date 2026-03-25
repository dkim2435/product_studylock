# Ambience Sound System

## Overview

Users mix sounds via sliders, or AI auto-sets based on weather/time conditions.

## Sound Library

| Category | Sounds |
|----------|--------|
| Nature | Rain, thunder, wind, birds, waves |
| Indoor | Cafe noise, fireplace, clock, AC hum |
| Work | Keyboard typing, pencil writing, page turning |

## Sound Sources

- Royalty-free sounds only
- Sources: Freesound.org, Pixabay Audio (CC0 license)
- Each sound must be loop-ready

## UI

```
🌧 Rain       ━━━━━━━○━━━  70%
☕ Cafe        ━━━○━━━━━━  30%
🔥 Fireplace  ○━━━━━━━━━   0%
⌨️ Keyboard   ━━━━━○━━━━  50%
```

- Independent sliders per sound
- Preset buttons: [ 😴 Sleepy ] [ 🎯 Focus ] [ 😌 Relax ]

## Playback Behavior

- All categories auto-advance to the next track when the current one ends
- Cabin: plays in strict order (1→2→3→4→1...)
- Others (Lofi, Rain, Ocean, Birds, Fire): shuffle to a random next track
- Skip forward (▶▶) and skip backward (◀◀) always available

## Tech

- Howler.js — browser audio playback, volume control
- Web Audio API — analyser for visualizer, crossfade if needed

## AI Integration (Weather Auto-Sync)

- MCP server calls weather API
- Atmosphere Agent (CrewAI) receives weather data → decides sound mix
- Raining outside → rain sound auto ON
- Nighttime → cricket sounds added
- Agents only run when conditions change (cost optimization)

---

## 한국어 요약

슬라이더로 사운드 믹스 조절. AI가 날씨/시간에 따라 자동 세팅. 비 오면 빗소리 자동 ON.
