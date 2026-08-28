import { findByProps, findByStoreName } from "@vendetta/metro";
import { before, instead } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";

import { DEFAULT_EMOJI_SIZE, emojiMediaUrl } from "../constants";
import { getWordBoundary, isEmojiAvailable, linkify } from "../utils";

const { getCustomEmojiById } = findByStoreName("EmojiStore");

// Anchors are the properties we patch (Freemoji's working pattern):
// findByProps guarantees the returned module carries them, so the hooks land on
// real functions. A renamed/removed symbol yields undefined and the hook is
// skipped — silent no-op, never a crash.
const EmojiPermission: any = findByProps("canUseEmojisEverywhere");
const MessageModule: any = findByProps("sendMessage", "receiveMessage");
const EditMessageModule: any = findByProps("editMessage");

// Global regex works for both the .match pre-check and matchAll (rewrite).
const EMOJI_RE = /<a?:(\w+):(\d+)>/g;

/** Rewrite foreign-guild or animated emojis to CDN image links (Freemoji logic). */
function rewriteEmojis(content: string, channelId: string): string {
  const size = storage.emojiSize ?? DEFAULT_EMOJI_SIZE;
  return content.replace(EMOJI_RE, (match, name, id, offset, original) => {
    if (original[offset - 1] === "\\") return match;

    const emoji = getCustomEmojiById(id);
    if (!emoji || isEmojiAvailable(emoji, channelId)) return match;

    const link = linkify(name, emojiMediaUrl(id, name, emoji.animated, size));
    return `${getWordBoundary(original, offset - 1)}${link}${getWordBoundary(original, offset + match.length)}`;
  });
}

/**
 * Mutate a message in place. Clearing invalidEmojis matters: the client blocks
 * sends carrying emojis the user can't use, and the URL rewrite no longer needs
 * that flag.
 */
function mutateMessage(msg: any, channelId: string) {
  if (typeof msg?.content !== "string") return;

  const content = rewriteEmojis(msg.content, channelId);
  if (content === msg.content) return;

  msg.content = content;
  if ("invalidEmojis" in msg) msg.invalidEmojis = [];
}

export default () => {
  const unpatches = [
    // Unlock custom + animated emojis everywhere for non-Nitro users.
    typeof EmojiPermission?.canUseEmojisEverywhere === "function" && instead("canUseEmojisEverywhere", EmojiPermission, () => true),
    typeof EmojiPermission?.canUseAnimatedEmojis === "function" && instead("canUseAnimatedEmojis", EmojiPermission, () => true),
    // Rewrite at the text send entry point.
    typeof MessageModule?.sendMessage === "function" && before("sendMessage", MessageModule, args => mutateMessage(args[1], args[0])),
    typeof EditMessageModule?.editMessage === "function" && before("editMessage", EditMessageModule, args => {
      const message = args.find(arg => typeof arg?.content === "string");
      if (message) mutateMessage(message, args[0]);
    }),
  ].filter(Boolean);

  return () => unpatches.forEach((unpatch) => unpatch?.());
};
