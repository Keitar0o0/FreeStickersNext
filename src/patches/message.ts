import { findByProps, findByStoreName } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";

import { encodeAPNGToGIF } from "../apng/toGif";
import { FORMAT_APNG, FORMAT_GIF, FORMAT_LOTTIE } from "../constants";
import { attachStickerGif } from "../upload";
import { buildStickerURL, isStickerAvailable, linkify } from "../utils";

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
  MessageModule.sendMessage(channelId, { content: linkify(sticker, url) }, null, extra);
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
      orig(channelId, usable.map((s: any) => s.id), args[2], extra);
    } catch (e) {
      console.error("[FreeStickersNext] native send of usable stickers failed:", e);
    }
  }

  (async () => {
    for (const sticker of toModify) {
      const url = buildStickerURL(sticker);

      switch (sticker.format_type) {
        case FORMAT_GIF:
          // GIF stickers are served natively animated by Discord's media proxy —
          // plain CDN link, zero conversion, no third party.
          sendStickerAsLink(channelId, sticker, extra);
          break;

        case FORMAT_APNG: {
          if (storage.localEncode) {
            try {
              const res = await fetch(url);
              if (res.ok) {
                const gif = encodeAPNGToGIF(await res.arrayBuffer());
                if (gif && (await attachStickerGif(channelId, sticker.id, gif.bytes))) {
                  showToast("FreeStickersNext: 动画贴纸已转为 GIF,发送消息即可");
                  break; // attached to the draft — user presses send again
                }
              }
            } catch (e) {
              console.error("[FreeStickersNext] APNG fetch/encode failed:", e);
            }
          }
          // encoding or attachment failed → fall back to the static PNG link
          sendStickerAsLink(channelId, sticker, extra);
          break;
        }

        case FORMAT_LOTTIE:
          // Lottie stickers only exist as .json on Discord's CDN — there is no
          // static PNG or GIF route (verified), so there is nothing to send.
          // Sending the old .png link would produce a broken 404 message.
          showToast("FreeStickersNext: Lottie 动画贴纸暂不支持发送");
          break;

        default: // PNG and unknown formats
          sendStickerAsLink(channelId, sticker, extra);
      }
    }
  })();
});
