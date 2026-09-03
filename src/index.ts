import boostsPatch from "./patches/boosts";
import emojiPatch from "./patches/emoji";
import nitroPatch from "./patches/nitro";
import messagePatch from "./patches/message";
import Settings from "./ui/Settings";

let patches: (() => void)[] | null = null;

export const onLoad = () => {
  // Re-entrant loads (plugin re-enable / hot reload) first clean up.
  if (patches) onUnload();
  patches = [
    boostsPatch(),
    nitroPatch(),
    messagePatch(),
    emojiPatch(),
  ];
};

export const onUnload = () => patches?.forEach?.(unpatch => unpatch?.());

export const settings = Settings;
