// Minimal type surface of the vendored gifenc encoder (src/apng/gifenc.js).
// Pure-JS GIF encoder operating on raw RGBA arrays (no canvas/DOM).
export type PaletteFormat = "rgb565" | "rgba4444" | "rgb444";

export interface QuantizeOptions {
  format?: PaletteFormat;
  clearAlpha?: boolean;
  clearAlphaColor?: number;
  clearAlphaThreshold?: number;
  oneBitAlpha?: boolean | number;
}

export interface WriteFrameOptions {
  transparent?: boolean;
  transparentIndex?: number;
  /** frame delay in milliseconds */
  delay?: number;
  /** first frame's palette is required when `auto` is enabled */
  palette?: number[][];
  repeat?: number;
  colorDepth?: number;
  dispose?: number;
}

export interface GIFWriter {
  writeFrame(index: Uint8Array, width: number, height: number, options?: WriteFrameOptions): void;
  finish(): void;
  bytes(): Uint8Array;
  bytesView(): Uint8Array;
}

declare function GIFEncoder(options?: { auto?: boolean; repeat?: number; colorDepth?: number; dispose?: number }): GIFWriter;
declare function quantize(
  rgba: Uint8Array | Uint8ClampedArray,
  maxColors: number,
  options?: QuantizeOptions,
): number[][];
declare function applyPalette(
  rgba: Uint8Array | Uint8ClampedArray,
  palette: number[][],
  format?: PaletteFormat,
): Uint8Array;

declare const pkg: {
  GIFEncoder: typeof GIFEncoder;
  quantize: typeof quantize;
  applyPalette: typeof applyPalette;
  default: typeof GIFEncoder;
};

export default pkg;
