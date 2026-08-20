export const STICKER_SIZES = [16, 32, 64, 128, 160, 256, 512, 1024] as const;
export const DEFAULT_STICKER_SIZE = 160;

// Discord Sticker format_type values
export const FORMAT_PNG = 1;
export const FORMAT_APNG = 2;
export const FORMAT_LOTTIE = 3;
export const FORMAT_GIF = 4;

// Sticker used for the settings size preview. This is a format_type 4 (GIF)
// sticker, served animated by Discord's own media proxy (verified working).
// Swap it for a sticker of your own if it ever stops resolving.
export const SAMPLE_STICKER_ID = "1216467563744198836";

// All stickers are reachable through Discord's media proxy; GIF stickers are
// ONLY reachable there (the CDN 404s on .gif).
export const stickerMediaUrl = (id: string | number, ext: string, size: number) =>
  `https://media.discordapp.net/stickers/${id}.${ext}?size=${size}`;