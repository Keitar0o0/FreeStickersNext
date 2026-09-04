import { findByStoreName } from "@vendetta/metro";

import { t } from "./i18n";

interface FileManager {
  writeFile(storage: "cache", path: string, data: string, encoding: "base64"): Promise<string>;
  removeFile?(storage: "cache", path: string): Promise<unknown>;
}

interface LocalFile {
  uri: string;
  name: string;
  type: string;
}

const runtime = globalThis as any;

function getFileManager(): FileManager | undefined {
  for (const name of ["NativeFileModule", "RTNFileManager", "DCDFileManager"]) {
    const module = runtime.__turboModuleProxy?.(name) ?? runtime.nativeModuleProxy?.[name];
    if (module?.writeFile) return module;
  }
}

const FileManager = getFileManager();
const { getToken } = findByStoreName("AuthenticationStore");

function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | ((b ?? 0) >> 4)];
    output += i + 1 < bytes.length ? alphabet[((b & 15) << 2) | ((c ?? 0) >> 6)] : "=";
    output += i + 2 < bytes.length ? alphabet[c & 63] : "=";
  }
  return output;
}

function removeCachedFile(path: string) {
  try {
    Promise.resolve(FileManager?.removeFile?.("cache", path))
      .catch(error => console.debug("[FreeStickersNext] cache cleanup failed:", error));
  } catch (error) {
    console.debug("[FreeStickersNext] cache cleanup failed:", error);
  }
}

export async function sendStickerGif(
  channelId: string,
  stickerId: string,
  bytes: Uint8Array,
): Promise<void> {
  const token = getToken?.();
  if (!token) throw new Error(t("error.authenticationUnavailable"));
  if (!FileManager) throw new Error(t("error.fileModuleUnavailable"));

  const filename = `${stickerId}.gif`;
  const relativePath = `freestickers-next/${stickerId}-${Date.now()}.gif`;

  try {
    const path = await FileManager.writeFile("cache", relativePath, bytesToBase64(bytes), "base64");
    const file: LocalFile = {
      uri: String(path).startsWith("file://") ? String(path) : `file://${path}`,
      name: filename,
      type: "image/gif",
    };
    const form = new FormData();
    form.append("payload_json", JSON.stringify({
      attachments: [{ id: 0, filename }],
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
