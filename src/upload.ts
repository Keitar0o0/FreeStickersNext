import { findByProps, findByStoreName } from "@vendetta/metro";

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
const { getChannel } = findByStoreName("ChannelStore");

function getPromptToUpload(): ((files: LocalFile[], channel: any, draftType: number) => unknown) | null {
  const mod: any = findByProps("promptToUpload");
  if (typeof mod?.promptToUpload === "function") return mod.promptToUpload.bind(mod);
  return null;
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
): Promise<void> {
  const promptToUpload = getPromptToUpload();
  const channel = getChannel?.(channelId);
  if (!promptToUpload) throw new Error("promptToUpload 不可用");
  if (!channel) throw new Error("当前频道不可用");
  if (!FileManager?.writeFile) throw new Error("FileManager 不可用");

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

    await Promise.resolve(promptToUpload([file], channel, 0));

    // Keep the file available while it remains attached to the draft
    setTimeout(() => removeCachedFile(relativePath), 30 * 60 * 1000);
  } catch (e) {
    removeCachedFile(relativePath);
    throw e;
  }
}
