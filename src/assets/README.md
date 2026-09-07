# MeowMath visual assets

These SVG illustrations were created specifically for MeowMath. They are original vector artwork and do not include third-party images, fonts, or external asset dependencies.

| Asset | Intended use | Suggested alt text |
| --- | --- | --- |
| `mio-cat-architect.svg` | Welcome screen, mission headers, encouragement cards | "Mio, kucing arsitek MeowMath, membawa cetak biru bangun ruang." |
| `geometry-badge.svg` | Mission badge, mastery card, empty-state decoration | "Lencana bangun ruang tiga dimensi." |
| `meow-city-map.svg` | Kota Meow project screen and map-grid introduction | "Peta Kota Meow dengan bangunan bangun ruang dan petunjuk lokasi." |

## Accessibility and implementation notes

- Each SVG embeds a `title` and `desc` and is safe to use as an image. When an illustration is decorative only, use an empty alt attribute so it is not announced twice.
- The illustrations use simple SVG shapes, system font only where a label is present, and no external image or font files. They remain suitable for offline use.
- Core palette: deep navy `#21475B`, teal `#38A9A4`, orange `#F58A45`, yellow `#FFD24D`, and soft cream `#FFF8DB`.
- Keep a minimum 44 px interactive target around any control that uses these assets. The SVGs themselves do not encode button behavior.
