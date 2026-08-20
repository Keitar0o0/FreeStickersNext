import { findByProps } from "@vendetta/metro";

import { bytesToDataURI } from "./apng/toGif";

interface LocalFile {
  uri: string;
  name: string;
  mime_type: string;
  size?: number;
}

let uploader: ((...args: any[]) => unknown) | null | undefined;

function getUploader(): ((...args: any[]) => unknown) | null {
  if (uploader !== undefined) return uploader;
  try {
    const mod: any = findByProps("uploadLocalFiles");
    uploader = typeof mod === "function" ? mod : (mod?.uploadLocalFiles ?? null);
  } catch (e) {
    console.error("[FreeStickersNext] Could not find uploadLocalFiles:", e);
    uploader = null;
  }
  return uploader;
}

function tryCall(fn: () => unknown): boolean {
  try {
    const res = fn() as any;
    if (res && typeof res?.catch === "function") {
      res.catch((e: unknown) => console.debug("[FreeStickersNext] upload promise rejected:", e));
    }
    return true;
  } catch (e) {
    console.debug("[FreeStickersNext] upload attempt failed:", e);
    return false;
  }
}

/**
 * Attach an encoded GIF to the current message draft — the user presses send
 * again to deliver it (same UX as Vencord's FakeNitro).
 *
 * VERIFY ON DEVICE: `uploadLocalFiles`'s exact signature differs between client
 * builds, so we probe the shapes seen in the wild and bail out with `false` on
 * failure — the caller then falls back to a static PNG link. If none of the
 * attempts attach on your client, log the console messages and adjust the
 * probe order here.
 */
export async function attachStickerGif(
  channelId: string,
  stickerId: string,
  bytes: Uint8Array,
): Promise<boolean> {
  const fn = getUploader();
  if (!fn) return false;

  const file: LocalFile = {
    // RN's networking layer handles `data:` URIs natively (RCTDataRequestHandler).
    uri: bytesToDataURI(bytes, "image/gif"),
    name: `${stickerId}.gif`,
    mime_type: "image/gif",
    size: bytes.byteLength,
  };

  const success = fn.length >= 2
    ? // files-first (documented Vendetta pattern), then draft-first (the shape
      // uploadLocalFiles patch touches: args[0].parsedMessage)
      tryCall(() => fn([file], channelId)) || tryCall(() => fn({ parsedMessage: { content: "" }, channelId }, [file]))
    : tryCall(() => fn([file])) || tryCall(() => fn(file));

  if (!success) {
    console.warn("[FreeStickersNext] uploadLocalFiles failed on all attempted shapes — falling back to a static link.");
  }
  return success;
}
