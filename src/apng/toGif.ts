import UPNG from "./upng";
import gifenc from "./gifenc";

const { GIFEncoder, quantize, applyPalette } = gifenc;

export interface EncodedGif {
  /** Full GIF file bytes (ready to be uploaded as an image/gif attachment). */
  bytes: Uint8Array;
}

/**
 * Re-encode an APNG (the bytes Discord returns for `.png` sticker URLs of
 * format_type 2) into an animated GIF, entirely on-device.
 *
 * Pipeline:
 *   1. UPNG.decode -> frame metadata (delay / size)
 *   2. UPNG.toRGBA8 -> one fully-composited RGBA8 buffer per frame
 *      (UPNG handles APNG blend/dispose internally, so no canvas is needed —
 *      critical, since Vendetta/Revenge is React Native and has no DOM canvas)
 *   3. gifenc -> quantize/applyPalette (rgba4444 keeps the alpha channel) and
 *      write every frame with its delay; fully-transparent pixels become the
 *      GIF's transparent index instead of muddy black.
 */
export function encodeAPNGToGIF(buffer: ArrayBuffer): EncodedGif | null {
  try {
    const img = UPNG.decode(buffer);
    if (!img || !img.frames?.length) return null;

    const frameBuffers = UPNG.toRGBA8(img);
    const { width, height } = img;

    const gif = GIFEncoder();

    for (let i = 0; i < frameBuffers.length; i++) {
      const rgba = new Uint8Array(frameBuffers[i]);

      const palette = quantize(rgba, 256, { format: "rgba4444" });
      const index = applyPalette(rgba, palette, "rgba4444");

      // Transparent index is per-frame: each frame's palette is quantized
      // independently, so frame 0's transparent index doesn't map to a
      // transparent entry in later frames' palettes.
      const transparentIndex = palette.findIndex((c: number[]) => c[3] === 0);

      const delay = img.frames[i]?.delay ?? 100;
      gif.writeFrame(index, width, height, {
        palette,
        delay: Math.max(10, delay),
        transparent: transparentIndex >= 0,
        transparentIndex,
      });
    }

    gif.finish();

    const bytes = gif.bytes();
    if (!bytes?.byteLength) return null;

    return { bytes };
  } catch (e) {
    console.error("[FreeStickersNext] APNG→GIF conversion failed:", e);
    return null;
  }
}

// Self-contained base64 encoder (avoids relying on `btoa`, which is not
// guaranteed on every RN/Hermes runtime).
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function bytesToDataURI(bytes: Uint8Array, mime = "image/gif"): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += i + 1 < bytes.length ? B64[((b & 15) << 2) | ((c ?? 0) >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[c & 63] : "=";
  }
  return `data:${mime};base64,${out}`;
}