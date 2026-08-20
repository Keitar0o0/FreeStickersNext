import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";

const NitroModule: any = findByProps("canUseAnimatedEmojis");

// NOTE: the original FreeStickers fell back to the legacy
// `canUseStickersEverywhere` name when `canUseCustomStickersEverywhere` was
// missing. That legacy check no longer exists in current clients, so the
// fallback was dropped — the current name is always used now.
export default () => instead("canUseCustomStickersEverywhere", NitroModule, () => true);