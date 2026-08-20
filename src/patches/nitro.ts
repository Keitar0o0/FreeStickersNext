import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";

// Locate the module by the property we patch (Freemoji's pattern): findByProps
// guarantees the returned module carries that property, so `instead` lands on
// a real permission check. The original FreeStickers anchored on
// canUseAnimatedEmojis and patched a possibly-absent name — a silent no-op
// when emoji and sticker permissions live on different modules. Legacy name
// kept as a hedge for older clients.
const MODERN = "canUseCustomStickersEverywhere";
const LEGACY = "canUseStickersEverywhere";
const NitroModule: any = findByProps(MODERN) ?? findByProps(LEGACY);
const CHECK_NAME = NitroModule?.[MODERN] ? MODERN : LEGACY;

export default () => NitroModule && instead(CHECK_NAME, NitroModule, () => true);