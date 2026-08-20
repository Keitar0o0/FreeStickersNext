import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";

const StickerUtils: any = findByProps("getStickerSendability");
const SENDABLE = StickerUtils.StickerSendability.SENDABLE ?? 0;

export default () => {
  const patches = [
    // Makes boost-locked stickers actually send on tap
    instead("getStickerSendability", StickerUtils, () => SENDABLE),
    // Makes boost-locked stickers appear fully opaque in the sticker picker
    instead("isSendableSticker", StickerUtils, () => true),
  ];

  return () => patches.forEach(p => p?.());
};