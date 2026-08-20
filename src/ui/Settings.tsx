import { findByName, findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Forms, General } from "@vendetta/ui/components";

import { DEFAULT_EMOJI_SIZE, DEFAULT_STICKER_SIZE, EMOJI_SIZES, SAMPLE_EMOJI_ID, SAMPLE_STICKER_ID, STICKER_SIZES, emojiMediaUrl, stickerMediaUrl } from "../constants";

const { Stack, TableRadioGroup, TableRadioRow, TableSwitchRow, TableRowGroup } = findByProps("TableRow", "TableRowGroup");
const { ScrollView, Image, Text } = General;
const { FormRow, FormSection } = Forms;
const HelpMessage = findByName("HelpMessage");

// Settings defaults (evaluated once when the module is imported, i.e. at
// plugin load — same pattern as the original FreeStickers).
storage.hyperlink ??= true;
storage.ignoreNitro ??= false;
storage.customHyperLinkString ??= "";
storage.localEncode ??= true;
storage.stickerSize ??= DEFAULT_STICKER_SIZE;
storage.emojiSize ??= DEFAULT_EMOJI_SIZE;

export default function Settings() {
  useProxy(storage);
  // Inline picker accordion: the size rows expand under their row when opened
  // and collapse on selection (reliable — no bottom-sheet API required).
  const [openPicker, setOpenPicker] = React.useState(null);

  const size = storage.stickerSize ?? DEFAULT_STICKER_SIZE;
  const emojiSize = storage.emojiSize ?? DEFAULT_EMOJI_SIZE;
  // The sample sticker is a format_type 4 (GIF) sticker; the preview uses the
  // exact link format the plugin sends (animated, at the chosen size).
  const sampleUrl = stickerMediaUrl(SAMPLE_STICKER_ID, "gif", size);
  // Static emoji at the chosen size (same URL format the rewrite sends).
  const emojiSampleUrl = emojiMediaUrl(SAMPLE_EMOJI_ID, "sample", false, emojiSize);
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
        </TableRowGroup>

        <FormSection>
          <FormRow label="Custom hyperlink text" />
          <Forms.FormInput
            title=""
            placeholder="Leave empty to use the sticker's name"
            value={storage.customHyperLinkString}
            onChange={v => (storage.customHyperLinkString = v)}
            style={{ marginTop: -25, marginHorizontal: 12 }}
          />
        </FormSection>

        <TableRowGroup title="Animated Stickers">
          <TableSwitchRow
            label="Convert APNG stickers to GIF"
            subLabel="Encoded on-device (no third-party service) and attached to your message draft"
            value={storage.localEncode}
            onValueChange={v => (storage.localEncode = v)}
          />
        </TableRowGroup>

        <HelpMessage messageType={0}>
          {
            "Stickers are sent as plain links (or as attachments for animated APNG stickers). GIF stickers are served animated by Discord's own media proxy. Size only changes the source resolution — Discord renders link embeds at a fixed display size."
          }
        </HelpMessage>

        <FormRow
          label="Emoji Size"
          trailing={<Text style={{ opacity: 0.6 }}>{emojiSize}</Text>}
          arrow
          onPress={() => setOpenPicker(openPicker === "emoji" ? null : "emoji")}
        />
        {openPicker === "emoji" && (
          <TableRadioGroup
            title="Emoji Size"
            value={emojiSize.toString()}
            onChange={v => {
              storage.emojiSize = parseInt(v);
              setOpenPicker(null);
            }}
          >
            {EMOJI_SIZES.map(size => (
              <TableRadioRow
                label={size.toString()}
                subLabel={size === DEFAULT_EMOJI_SIZE ? "Default" : null}
                key={size.toString()}
                value={size.toString()}
              />
            ))}
          </TableRadioGroup>
        )}
        <TableRowGroup title="Emoji Preview">
          <Image
            source={{ uri: emojiSampleUrl }}
            style={{ width: emojiSize, height: emojiSize, borderRadius: 8, alignSelf: "center" }}
          />
        </TableRowGroup>

        <FormRow
          label="Sticker Size"
          trailing={<Text style={{ opacity: 0.6 }}>{size}</Text>}
          arrow
          onPress={() => setOpenPicker(openPicker === "sticker" ? null : "sticker")}
        />
        {openPicker === "sticker" && (
          <TableRadioGroup
            title="Sticker Size"
            value={size.toString()}
            onChange={v => {
              storage.stickerSize = parseInt(v);
              setOpenPicker(null);
            }}
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
        )}
        <TableRowGroup title="Preview">
          <Image
            source={{ uri: sampleUrl }}
            style={{ width: previewSize, height: previewSize, borderRadius: 8, alignSelf: "center" }}
          />
        </TableRowGroup>
      </Stack>
    </ScrollView>
  );
}