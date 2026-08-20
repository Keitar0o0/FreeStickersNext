// Minimal type surface of the vendored upng-js decoder (src/apng/upng.js).
// Only the parts used by src/apng/toGif.ts are declared.
export interface UPngFrame {
  rect: { x: number; y: number; width: number; height: number };
  /** frame duration in milliseconds */
  delay: number;
  /** 0 = NONE, 1 = BACKGROUND, 2 = PREVIOUS */
  dispose: 0 | 1 | 2;
  /** 0 = SOURCE, 1 = OVER */
  blend: 0 | 1;
  data: Uint8Array;
}

export interface UPngImage {
  width: number;
  height: number;
  depth: number;
  ctype: number;
  data: Uint8Array;
  tabs: Record<string, any>;
  frames: UPngFrame[];
}

declare const UPNG: {
  decode(buffer: ArrayBuffer | Uint8Array): UPngImage;
  /**
   * Returns one full-canvas, fully composited RGBA8 ArrayBuffer per frame
   * (APNG blend/dispose rules applied internally — no canvas/DOM required).
   */
  toRGBA8(img: UPngImage): ArrayBuffer[];
};

export default UPNG;
