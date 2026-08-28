<div align="center">

# FreeStickersNext

Use Discord stickers and custom emojis **without Nitro**

[English](README.md) · [中文](README.zh_CN.md)

</div>

## Features

- **Custom emojis** — unlocked, restricted static/animated emojis are rewritten to Discord CDN links.
- **PNG / GIF stickers** — sent as hyperlinks.
- **APNG stickers** — **encoded to GIF locally** (`upng-js` decoder + `gifenc` encoder), then sent directly to Discord as an attachment.

Content type handling:

| Content | Handling |
| --- | --- |
| Stickers usable in the current channel | passed through to Discord's native send logic |
| PNG stickers / GIF stickers | sent as a `media.discordapp.net` link |
| APNG stickers | converted to GIF on-device and sent as an attachment; falls back to a static PNG link on failure |
| Lottie stickers | toast notification, not sent |
| Emojis usable in the current channel | kept as-is |
| Restricted static/animated emojis | rewritten to a Discord CDN link |
| Boost-locked stickers | marked sendable in the sticker picker |

## Installation

The plugin is built for [Revenge](https://github.com/revenge-mod) loaders that support plugins.

**Via plugin source (recommended)** — add the GitHub Pages source in the plugin browser:

```
https://Keitar0o0.github.io/FreeStickersNext
```

**Manual** — build the plugin yourself (see below) and load `dist/index.js` from the plugin browser, or host `dist/` (it contains `index.js` + `manifest.json` with a hash, i.e. a complete plugin).

## Known limitations

- **Lottie stickers (format_type 3)** are not sent: Discord only exposes them as `.json` (no PNG/GIF route), so a link would be a broken 404 message. A toast explains this when you try to send one.
- **APNG delivery** — `src/upload.ts` resolves Revenge's TurboModule or legacy file bridge, writes the GIF to the native cache, and sends it to Discord as a multipart attachment. If Discord rejects the upload, it falls back to a static PNG link.
- **APNG conversion runs on the JS thread**; very large stickers may take a moment (a "converting…" toast is shown).
- **Embed permission** — links render as plain text in channels without the *Embed Links* permission; a confirmation prompt asks before sending in that case.

## Building from source

Requirements: [Bun](https://bun.sh)

```sh
bun install        # only devDependencies; APNG/GIF code is bundled in src/apng
bun run build      # bundle to dist/index.js
bun run watch      # rebuild on change
bun run typecheck  # tsc --noEmit
```

Build output:

| File | Purpose |
| --- | --- |
| `dist/index.js` | single-file plugin bundle loaded by Vendetta/Revenge |
| `dist/manifest.json` | release manifest, contains the bundle hash |
| `dist/source.json` | plugin source index (only when built with a base URL) |

## Credits

- [Revenge](https://github.com/revenge-mod) —— Plugin Loader
- [FreeStickers](https://github.com/aliernfrog/vd-plugins/tree/main/plugins/FreeStickers) — original sticker plugin
- [freemoji](https://github.com/Rico040/bunny-plugins/tree/gh-pages/freemoji) — emoji unlock & CDN rewrite
- [upng-js](https://github.com/photopea/UPNG.js) — APNG decoder
- [gifenc](https://github.com/mattdesl/gifenc) — GIF encoder

## License

[GPL-3.0](LICENSE)
