import { findByStoreName } from "@vendetta/metro";

import { bytesToBase64 } from "./apng/toGif";

interface LocalFile {
  uri: string;
  name: string;
  type: string;
}

const nativeModules = (globalThis as any).nativeModuleProxy;
const FileManager = nativeModules?.DCDFileManager ?? nativeModules?.RTNFileManager;
const { getToken } = findByStoreName("AuthenticationStore");

function removeCachedFile(relativePath: string) {
  try {
    Promise.resolve(FileManager?.removeFile?.("cache", relativePath))
      .catch(e => console.debug("[FreeStickersNext] cache cleanup failed:", e));
  } catch (e) {
    console.debug("[FreeStickersNext] cache cleanup failed:", e);
  }
}

export async function sendStickerGif(
  channelId: string,
  stickerId: string,
  bytes: Uint8Array,
): Promise<void> {
  const token = getToken?.();
  if (!token) throw new Error("AuthenticationStore 不可用");
  if (!FileManager?.writeFile) throw new Error("FileManager 不可用");

  const relativePath = `freestickers-next/${stickerId}-${Date.now()}.gif`;

  try {
    const path = await FileManager.writeFile("cache", relativePath, bytesToBase64(bytes), "base64");
    const file: LocalFile = {
      uri: String(path).startsWith("file://") ? String(path) : `file://${path}`,
      name: `${stickerId}.gif`,
      type: "image/gif",
    };

    const form = new FormData();
    form.append("payload_json", JSON.stringify({
      attachments: [{ id: 0, filename: file.name }],
    }));
    form.append("files[0]", file as any);

    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: token },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text();
      let detail = body;
      try {
        detail = JSON.parse(body)?.message ?? body;
      } catch {}
      throw new Error(`Discord HTTP ${response.status}: ${detail || response.statusText}`);
    }
  } finally {
    removeCachedFile(relativePath);
  }
}
