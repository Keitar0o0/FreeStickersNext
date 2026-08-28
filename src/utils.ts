import { findByStoreName } from "@vendetta/metro";
import { constants } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";

import { FORMAT_GIF, stickerMediaUrl } from "./constants";

const { getChannel } = findByStoreName("ChannelStore");
const { getCurrentUser } = findByStoreName("UserStore");
const { getSelfMember } = findByStoreName("GuildMemberStore");
const PermissionStore = findByStoreName("PermissionStore");
const { Permissions } = constants;

function hasNitro(): boolean {
  return !storage.ignoreNitro && getCurrentUser?.()?.premiumType != null;
}

export function hasPermission(channelId: string, permission: any): boolean {
  const channel = getChannel?.(channelId);
  if (!channel) return false;
  if (channel.isPrivate?.() || channel.guild_id == null) return true;
  if (!PermissionStore?.can || permission == null) return true;

  try {
    return PermissionStore.can(permission, channel);
  } catch (e) {
    console.warn("[FreeStickersNext] Permission check failed:", e);
    return true;
  }
}

export const hasEmbedPermission = (channelId: string) =>
  hasPermission(channelId, Permissions?.EMBED_LINKS);

export const hasAttachmentPermission = (channelId: string) =>
  hasPermission(channelId, Permissions?.ATTACH_FILES);

/**
 * Keep native delivery when Discord already allows the sticker in this channel
 */
export function isStickerAvailable(sticker: any, channelId: string): boolean {
  if (sticker.available === false) return false;
  if (!sticker.guild_id) return true;
  if (sticker.guild_id === getChannel?.(channelId)?.guild_id) return true;
  return hasNitro() && hasPermission(channelId, Permissions?.USE_EXTERNAL_STICKERS);
}

export function isEmojiAvailable(emoji: any, channelId: string): boolean {
  if (emoji.type === 0) return true;
  if (emoji.available === false) return false;

  const guildId = emoji.guildId ?? emoji.guild_id;
  const isCurrentGuild = guildId != null && guildId === getChannel?.(channelId)?.guild_id;
  const memberRoles = emoji.managed && guildId ? getSelfMember?.(guildId)?.roles ?? [] : [];
  const hasManagedRole = emoji.roles?.some?.((role: string) => memberRoles.includes(role)) ?? false;

  if (hasNitro() || hasManagedRole) {
    return isCurrentGuild || hasPermission(channelId, Permissions?.USE_EXTERNAL_EMOJIS);
  }

  return isCurrentGuild && !emoji.animated;
}

/**
 * Build the raw media URL for a sticker.
 * format_type 4 (GIF) stickers are only served as .gif through the media proxy;
 * PNG and APNG stickers are served as .png. Lottie has no image route at all.
 */
export function buildStickerURL(sticker: any): string {
  const ext = sticker.format_type === FORMAT_GIF ? "gif" : "png";
  const url = new URL(stickerMediaUrl(sticker.id, ext, storage.stickerSize ?? 160));
  url.searchParams.set("name", sticker.name ?? String(sticker.id));
  url.searchParams.set("lossless", "true");
  return url.toString();
}

/** Wrap a name + URL as a markdown link, or return the URL raw when hyperlinks are off. */
export function linkify(name: string, url: string): string {
  if (!storage.hyperlink) return url;
  const custom = typeof storage.customHyperLinkString === "string"
    ? storage.customHyperLinkString.trim()
    : "";
  return `[${custom || name || ""}](${url})`;
}

export function getWordBoundary(content: string, offset: number): string {
  return !content[offset] || /\s/.test(content[offset]) ? "" : " ";
}
