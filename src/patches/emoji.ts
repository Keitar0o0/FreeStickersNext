import { findByProps, findByStoreName } from "@vendetta/metro";
import { before, instead } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";

import { DEFAULT_EMOJI_SIZE, emojiMediaUrl } from "../constants";
import { linkify } from "../utils";

const { getCustomEmojiById } = findByStoreName("EmojiStore");
const { getGuildId } = findByStoreName("SelectedGuildStore");
const { getCurrentUser } = findByStoreName("UserStore");

// Anchors are the properties we patch (Freemoji's working pattern):
// findByProps guarantees the returned module carries them, so the hooks land on
// real functions. A renamed/removed symbol yields undefined and the hook is
// skipped — silent no-op, never a crash.
const EmojiPermission: any = findByProps("canUseEmojisEverywhere");
const MessageModule: any = findByProps("sendMessage", "receiveMessage");

// Global regex works for both the .match pre-check and matchAll (rewrite).
const EMOJI_RE = /<a?:(\w+):(\d+)>/g;

/** Rewrite foreign-guild or animated emojis to CDN image links (Freemoji logic). */
function rewriteEmojis(content: string): string {
  const size = storage.emojiSize ?? DEFAULT_EMOJI_SIZE;
  let out = content;
  for (const m of content.matchAll(EMOJI_RE)) {
    const emoji = getCustomEmojiById(m[2]);
    if (!emoji || (emoji.guildId === getGuildId() && !emoji.animated)) continue;
    out = out.replace(m[0], linkify(m[1], emojiMediaUrl(m[2], m[1], emoji.animated, size)));
  }
  return out;
}

/**
 * Mutate a message in place. Clearing invalidEmojis matters: the client blocks
 * sends carrying emojis the user can't use, and the URL rewrite no longer needs
 * that flag.
 */
function mutateMessage(msg: any) {
  if (typeof msg?.content !== "string" || !msg.content.match(EMOJI_RE)) return;
  // Nitro users send natively; rewrite only without Nitro (or when forced).
  if (!storage.ignoreNitro && getCurrentUser?.()?.premiumType !== null) return;
  msg.content = rewriteEmojis(msg.content);
  msg.invalidEmojis = [];
}

export default () => {
  const unpatches = [
    // Unlock custom + animated emojis everywhere for non-Nitro users.
    EmojiPermission && instead("canUseEmojisEverywhere", EmojiPermission, () => true),
    EmojiPermission && instead("canUseAnimatedEmojis", EmojiPermission, () => true),
    // Rewrite at the text send entry point.
    before("sendMessage", MessageModule, (args) => mutateMessage(args[1])),
  ].filter(Boolean);

  return () => unpatches.forEach((unpatch) => unpatch?.());
};
