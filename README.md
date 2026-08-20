# FreeStickersNext

Use Discord stickers without Nitro.

## Features

- **PNG / GIF stickers** — sent as links served by Discord's **own** media proxy
  (`media.discordapp.net`). GIF stickers (format_type 4) are animated right in
  chat, with zero conversion.
  emoji.
- **APNG stickers** — **encoded to GIF locally** (`upng-js` decoder + `gifenc`
  encoder, both pure JS; no DOM canvas needed under React Native), then attached
  to your message draft. No third-party service, no external hosting, nothing
  leaves Discord.
- **Custom hyperlink text** — Leave the setting empty to use
  the sticker's name, or type your own link label.
- **Size preview** — the settings page renders a sample sticker at the
  configured size, using the exact URL the plugin would send.
- Removed the legacy `canUseStickersEverywhere` fallback (old clients).

## Settings

| Setting | Default | Notes |
| --- | --- | --- |
| Hyperlink stickers | on | wrap the URL in `[text](url)` |
| Ignore Nitro | off | force the rewrite even when you have Nitro |
| Custom hyperlink text | empty | empty = use the sticker's name |
| Convert APNG stickers to GIF | on | local encoding, attached as GIF |
| Sticker Size | 160 | 16 … 1024 |

## Known limitations

- **Lottie stickers (format_type 3)** are not sent: Discord only exposes them as
  `.json` (no PNG/GIF route), so a "link" would be a broken 404 message. A toast
  explains this when you try to send one.
- **`uploadLocalFiles` attachment signature**: the exact call shape differs
  between client builds. `src/upload.ts` probes the known shapes and falls back
  to a static PNG link on failure. **Verify on-device** once and adjust the
  probe order if needed (watch the console debug logs).
- APNG conversion runs on the JS thread; very large stickers may take a moment
  (a "converting…" toast is shown).

## Credits

- [FreeStickers](https://github.com/aliernfrog/vd-plugins/tree/main/plugins/FreeStickers)
- [freemoji](https://github.com/Rico040/bunny-plugins/tree/gh-pages/freemoji)
- [upng-js](https://github.com/photopea/UPNG.js)
- [gifenc](https://github.com/mattdesl/gifenc)
