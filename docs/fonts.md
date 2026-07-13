# Fonts

## `Genshin Heavy` — heading face

`static/fonts/genshin-heavy-latin.woff2` (~14 KB) is the face used for `h1`–`h3`
via `--font-heading` in `src/app.css`.

### Provenance

It is a Latin-only subset of the Simplified-Chinese UI font shipped inside the
Genshin Impact client:

```
GenshinImpact_Data/StreamingAssets/MiHoYoSDKRes/HttpServerResources/font/zh-cn.ttf
```

| Field     | Value                                            |
| --------- | ------------------------------------------------ |
| Family    | `SDK_SC_Web Heavy`                               |
| Copyright | © Beijing HanYi Keyin Information Technology Co. |
| Trademark | Trademark of HanYi                               |

### Licensing — read before reusing

**This is a proprietary commercial font from the HanYi foundry**, licensed to
HoYoverse for use in the game client and its account web views. We are not a
party to that licence. Self-hosting it here redistributes it to every visitor,
which the licence does not cover — this is a knowing trade-off for a fan
project, not a cleared one. If the site ever grows a commercial dimension, or if
HanYi or HoYoverse object, the fix is to swap `--font-heading` for an
open-licensed (OFL/Apache) face; nothing else in the codebase depends on it.

Do not add more faces from this source, and do not ship the full `zh-cn.ttf` —
it is 12 MB and ~33,000 of its glyphs are CJK that this English-only site never
renders.

### Regenerating the subset

Requires `fonttools` and `brotli` (`pip install fonttools brotli`). From the repo
root, with the game installed:

```bash
python3 -m fontTools.subset \
  "/mnt/c/Program Files/Genshin Impact/Genshin Impact game/GenshinImpact_Data/StreamingAssets/MiHoYoSDKRes/HttpServerResources/font/zh-cn.ttf" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2015,U+2018-201D,U+2026,U+00D7,U+2022" \
  --layout-features="kern,liga,calt" \
  --flavor=woff2 \
  --desubroutinize \
  --name-IDs="" \
  --output-file=static/fonts/genshin-heavy-latin.woff2
```

The unicode range covers every character in `src/lib/genshin/data/*.json`
(character and boss names) plus the static headings. If a future `genshin-db`
bump introduces a name with a character outside it — an accented letter, say —
that glyph falls back to the body font. Widen the range and re-subset.

### Weight

The file is a single static Heavy cut, but `@font-face` claims `font-weight: 400
900` so that callers asking for `650` (the card names) or `bold` map onto it
directly rather than getting a synthesised bold smeared over an already-heavy
face.
