import { findByProps, findByStoreName } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { showToast } from "@vendetta/ui/toasts";

import { encodeAPNGToGIF } from "../apng/toGif";
import { FORMAT_APNG, FORMAT_GIF, FORMAT_LOTTIE } from "../constants";
import { attachStickerGif } from "../upload";
import { buildStickerURL, hasAttachmentPermission, hasEmbedPermission, isStickerAvailable, linkify } from "../utils";

const MessageModule: any = findByProps("sendMessage", "receiveMessage");
// Anchor the interception on the function we patch (Freemoji's pattern):
// findByProps guarantees the module carries `sendStickers`, so the hook
// actually fires. The old anchor (the sendMessage module) silently no-ops if
// the client moved sendStickers to its own module. Link sends below still go
// through MessageModule.sendMessage.
const SendStickersModule: any = findByProps("sendStickers") ?? MessageModule;
const { getStickerById } = findByStoreName("StickersStore");

function sendStickerAsLink(channelId: string, sticker: any, extra: any) {
  const url = buildStickerURL(sticker);
  MessageModule.sendMessage(channelId, { content: linkify(sticker.name ?? String(sticker.id), url) }, null, extra);
}

function confirmLinkSend(): Promise<boolean> {
  return new Promise(resolve => {
    try {
      showConfirmationAlert({
        title: "缺少嵌入链接权限",
        content: "当前频道会把贴纸或表情显示为普通链接，仍要发送吗",
        confirmText: "继续发送",
        cancelText: "取消",
        isDismissable: false,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    } catch (e) {
      console.warn("[FreeStickersNext] embed permission prompt failed:", e);
      resolve(true);
    }
  });
}

export default () => SendStickersModule && instead("sendStickers", SendStickersModule, (args, orig) => {
  const [channelId, stickerIds, , extra] = args;
  const stickers: any[] = (stickerIds ?? [])
    .map((id: string) => getStickerById(id))
    .filter(Boolean);

  const toModify = stickers.filter((s: any) => !isStickerAvailable(s, channelId));
  if (!toModify.length) return orig(...args);

  // Stickers that ARE usable still go through natively; only the locked ones
  // are rewritten below (multi-sticker sends from the picker keep working).
  const usable = stickers.filter((s: any) => isStickerAvailable(s, channelId));
  if (usable.length) {
    try {
      Promise.resolve(orig(channelId, usable.map((s: any) => s.id), args[2], extra))
        .catch(e => console.error("[FreeStickersNext] native send of usable stickers failed:", e));
    } catch (e) {
      console.error("[FreeStickersNext] native send of usable stickers failed:", e);
    }
  }

  (async () => {
    let linkPermission: Promise<boolean> | null = null;
    const sendLink = async (sticker: any) => {
      if (!hasEmbedPermission(channelId)) linkPermission ??= confirmLinkSend();
      if (linkPermission && !await linkPermission) return;
      sendStickerAsLink(channelId, sticker, extra);
    };

    for (const sticker of toModify) {
      const url = buildStickerURL(sticker);

      switch (sticker.format_type) {
        case FORMAT_GIF:
          // GIF stickers are served natively animated by Discord's media proxy —
          // plain CDN link, zero conversion, no third party.
          await sendLink(sticker);
          break;

        case FORMAT_APNG: {
          let attemptedUpload = false;
          if (storage.localEncode && hasAttachmentPermission(channelId)) {
            attemptedUpload = true;
            showToast("FreeStickersNext: 正在转换动画贴纸");
            try {
              const response = await fetch(url);
              if (!response.ok) throw new Error(`APNG fetch failed: ${response.status}`);

              const gif = encodeAPNGToGIF(await response.arrayBuffer());
              if (gif && await attachStickerGif(channelId, sticker.id, gif.bytes)) {
                showToast("FreeStickersNext: GIF 已附加，发送消息即可");
                break;
              }
            } catch (e) {
              console.error("[FreeStickersNext] APNG fetch/encode failed:", e);
            }
          } else if (storage.localEncode) {
            showToast("FreeStickersNext: 当前频道缺少附件权限，改发静态贴纸");
          }

          if (attemptedUpload) showToast("FreeStickersNext: GIF 附加失败，改发静态贴纸");
          await sendLink(sticker);
          break;
        }

        case FORMAT_LOTTIE:
          // Lottie stickers only exist as .json on Discord's CDN — there is no
          // static PNG or GIF route (verified), so there is nothing to send.
          // Sending the old .png link would produce a broken 404 message.
          showToast("FreeStickersNext: Lottie 动画贴纸暂不支持发送");
          break;

        default: // PNG and unknown formats
          await sendLink(sticker);
      }
    }
  })().catch(e => console.error("[FreeStickersNext] sticker rewrite failed:", e));
});
