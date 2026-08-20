import { findByName, findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Forms, General } from "@vendetta/ui/components";

import { DEFAULT_STICKER_SIZE, SAMPLE_STICKER_ID, STICKER_SIZES, stickerMediaUrl } from "../constants";

const { Stack, TableRadioGroup, TableRadioRow, TableSwitchRow, TableRowGroup } = findByProps("TableRow", "TableRowGroup");
const { ScrollView, Image } = General;
const HelpMessage = findByName("HelpMessage");

// Settings defaults (evaluated once when the module is imported, i.e. at
// plugin load — same pattern as the original FreeStickers).
storage.hyperlink ??= true;
storage.ignoreNitro ??= false;
storage.customHyperLinkString ??= "";
storage.localEncode ??= true;
storage.stickerSize ??= DEFAULT_STICKER_SIZE;

export default function Settings() {
  useProxy(storage);

  const size = storage.stickerSize ?? DEFAULT_STICKER_SIZE;
  // The sample sticker is a format_type 4 (GIF) sticker; the preview uses the
  // exact link format the plugin sends (animated, at the chosen size).
  const sampleUrl = stickerMediaUrl(SAMPLE_STICKER_ID, "gif", size);
  // Cap the on-screen size so huge selections don't blow up the layout.
  const previewSize = Math.min(size, 256);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
      <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
        <TableRowGroup title="General">
          <TableSwitchRow
            label="Hyperlink stickers"
            value={storage.hyperlink}
            onValueChange={v => (storage.hyperlink = v)}
          />
          <TableSwitchRow
            label="Ignore Nitro"
            subLabel="Force FreeStickersNext even when you have Nitro"
            value={storage.ignoreNitro}
            onValueChange={v => (storage.ignoreNitro = v)}
          />
          <Forms.FormInput
            title="Custom hyperlink text"
            placeholder="Leave empty to use the sticker's name"
            value={storage.customHyperLinkString}
            onChange={v => (storage.customHyperLinkString = v)}
          />
        </TableRowGroup>

        <TableRowGroup title="Animated Stickers">
          <TableSwitchRow
            label="Convert APNG stickers to GIF"
            subLabel="Encoded on-device (no third-party service) and attached to your message draft"
            value={storage.localEncode}
            onValueChange={v => (storage.localEncode = v)}
          />
        </TableRowGroup>

        <TableRadioGroup
          title="Sticker Size"
          value={size.toString()}
          onChange={v => (storage.stickerSize = parseInt(v))}
        >
          {STICKER_SIZES.map(size => (
            <TableRadioRow
              label={size.toString()}
              subLabel={size === DEFAULT_STICKER_SIZE ? "Default" : null}
              key={size.toString()}
              value={size.toString()}
            />
          ))}
        </TableRadioGroup>

        <TableRowGroup title="Preview">
          <Image
            source={{ uri: sampleUrl }}
            style={{ width: previewSize, height: previewSize, borderRadius: 8, alignSelf: "center" }}
          />
        </TableRowGroup>

        <HelpMessage messageType={0}>
          {
            "Stickers are sent as plain links (or as attachments for animated APNG stickers). GIF stickers are served animated by Discord's own media proxy."
          }
        </HelpMessage>
      </Stack>
    </ScrollView>
  );
}