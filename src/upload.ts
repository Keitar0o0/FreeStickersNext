import { findByProps } from "@vendetta/metro";

import { bytesToBase64 } from "./apng/toGif";

interface LocalFile {
  uri: string;
  name: string;
  type: string;
  mime_type: string;
  size: number;
}

const nativeModules = (globalThis as any).nativeModuleProxy;
const FileManager = nativeModules?.DCDFileManager ?? nativeModules?.RTNFileManager;

function getUploader(): ((...args: any[]) => unknown) | null {
  try {
    const mod: any = findByProps("uploadLocalFiles");
    if (typeof mod === "function") return mod;
    if (typeof mod?.uploadLocalFiles === "function") return mod.uploadLocalFiles.bind(mod);
  } catch (e) {
    console.warn("[FreeStickersNext] uploadLocalFiles lookup failed:", e);
  }
  return null;
}

async function callUploader(fn: (...args: any[]) => unknown, channelId: string, file: LocalFile): Promise<void> {
  const attempts = fn.length >= 2
    ? [
      () => fn([file], channelId),
      () => fn({ parsedMessage: { content: "" }, channelId }, [file]),
    ]
    : [
      () => fn([file]),
      () => fn(file),
    ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      await Promise.resolve(attempt());
      return;
    } catch (e) {
      lastError = e;
      console.debug("[FreeStickersNext] upload signature rejected:", e);
    }
  }

  throw lastError ?? new Error("uploadLocalFiles rejected all supported signatures");
}

function removeCachedFile(relativePath: string) {
  try {
    Promise.resolve(FileManager?.removeFile?.("cache", relativePath))
      .catch(e => console.debug("[FreeStickersNext] cache cleanup failed:", e));
  } catch (e) {
    console.debug("[FreeStickersNext] cache cleanup failed:", e);
  }
}

export async function attachStickerGif(
  channelId: string,
  stickerId: string,
  bytes: Uint8Array,
): Promise<boolean> {
  const uploader = getUploader();
  if (!uploader || !FileManager?.writeFile) return false;

  const relativePath = `freestickers-next/${stickerId}-${Date.now()}.gif`;

  try {
    const path = await FileManager.writeFile("cache", relativePath, bytesToBase64(bytes), "base64");
    const file: LocalFile = {
      uri: String(path).startsWith("file://") ? String(path) : `file://${path}`,
      name: `${stickerId}.gif`,
      type: "image/gif",
      mime_type: "image/gif",
      size: bytes.byteLength,
    };

    await callUploader(uploader, channelId, file);

    // Keep the file available while it remains attached to the draft
    setTimeout(() => removeCachedFile(relativePath), 30 * 60 * 1000);
    return true;
  } catch (e) {
    console.warn("[FreeStickersNext] GIF attachment failed:", e);
    removeCachedFile(relativePath);
    return false;
  }
}
