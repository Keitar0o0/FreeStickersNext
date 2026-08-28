import { findByStoreName } from "@vendetta/metro";

const { getToken } = findByStoreName("AuthenticationStore");

export async function sendStickerGif(
  channelId: string,
  stickerId: string,
  bytes: Uint8Array,
): Promise<void> {
  const token = getToken?.();
  if (!token) throw new Error("AuthenticationStore 不可用");

  const filename = `${stickerId}.gif`;
  const form = new FormData();
  form.append("payload_json", JSON.stringify({
    attachments: [{ id: 0, filename }],
  }));
  form.append("files[0]", new Blob([bytes as BlobPart], { type: "image/gif" }), filename);

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
}
