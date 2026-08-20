import { findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

import { FORMAT_GIF, stickerMediaUrl } from "./constants";

const { getChannel } = findByStoreName("ChannelStore");
const { getCurrentUser } = findByStoreName("UserStore");

/**
 * Sticker availability heuristic (same as the original FreeStickers):
 *  - explicitly unavailable (guild lost its boost level) -> not usable
 *  - default/standard stickers (no guild) -> always usable
 *  - premium user (and not ignoring Nitro) -> everything usable
 *  - guild stickers -> only inside their own guild
 */
export function isStickerAvailable(sticker: any, channelId: string): boolean {
  if (sticker.available === false) return false;
  if (!sticker.guild_id) return true;
  if (!storage.ignoreNitro && getCurrentUser?.().premiumType !== null) return true;
  const channelGuildId = getChannel(channelId).guild_id;
  return sticker.guild_id === channelGuildId;
}

/**
 * Build the raw media URL for a sticker.
 * format_type 4 (GIF) stickers are only served as .gif through the media proxy;
 * PNG and APNG stickers are served as .png. Lottie has no image route at all.
 */
export function buildStickerURL(sticker: any): string {
  const ext = sticker.format_type === FORMAT_GIF ? "gif" : "png";
  return stickerMediaUrl(sticker.id, ext, storage.stickerSize ?? 160);
}

/** Custom hyperlink text: leave empty to use the sticker/emoji name. */
export function buildLinkText(name?: string): string {
  const custom = typeof storage.customHyperLinkString === "string"
    ? storage.customHyperLinkString.trim()
    : "";
  return custom || name || "";
}

/** Wrap a name + URL as a markdown link, or return the URL raw when hyperlinks are off. */
export function linkify(name: string, url: string): string {
  if (!storage.hyperlink) return url;
  return `[${buildLinkText(name)}](${url})`;
}
