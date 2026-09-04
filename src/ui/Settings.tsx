import { findByName, findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Forms, General } from "@vendetta/ui/components";

import { DEFAULT_EMOJI_SIZE, DEFAULT_STICKER_SIZE, EMOJI_SIZES, SAMPLE_EMOJI_ID, SAMPLE_STICKER_ID, STICKER_SIZES, emojiMediaUrl, stickerMediaUrl } from "../constants";
import { t } from "../i18n";

const { Stack, TableRadioGroup, TableRadioRow, TableSwitchRow, TableRowGroup } = findByProps("TableRow", "TableRowGroup");
const { ScrollView, Image } = General;
const { FormRow, FormSection, FormText } = Forms;
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
        <TableRowGroup title={t("settings.general")}>
          <TableSwitchRow
            label={t("settings.hyperlink")}
            value={storage.hyperlink}
            onValueChange={v => (storage.hyperlink = v)}
          />
          <TableSwitchRow
            label={t("settings.ignoreNitro")}
            subLabel={t("settings.ignoreNitroDescription")}
            value={storage.ignoreNitro}
            onValueChange={v => (storage.ignoreNitro = v)}
          />
        </TableRowGroup>

        <FormSection>
          <Forms.FormInput
            title={t("settings.customHyperlinkText")}
            placeholder={t("settings.customHyperlinkPlaceholder")}
            value={storage.customHyperLinkString}
            onChange={v => (storage.customHyperLinkString = v)}
            style={{ marginHorizontal: 12 }}
          />
        </FormSection>

        <TableRowGroup title={t("settings.animatedStickers")}>
          <TableSwitchRow
            label={t("settings.convertApng")}
            subLabel={t("settings.convertApngDescription")}
            value={storage.localEncode}
            onValueChange={v => (storage.localEncode = v)}
          />
        </TableRowGroup>

        <HelpMessage messageType={0}>
          {t("settings.deliveryHelp")}
        </HelpMessage>

        <FormRow
          label={t("settings.emojiSize")}
          trailing={<FormText style={{ opacity: 0.6 }}>{emojiSize}</FormText>}
          arrow
          onPress={() => setOpenPicker(openPicker === "emoji" ? null : "emoji")}
        />
        {openPicker === "emoji" && (
          <TableRadioGroup
            title={t("settings.emojiSize")}
            value={emojiSize.toString()}
            onChange={v => {
              storage.emojiSize = parseInt(v);
              setOpenPicker(null);
            }}
          >
            {EMOJI_SIZES.map(size => (
              <TableRadioRow
                label={size.toString()}
                subLabel={size === DEFAULT_EMOJI_SIZE ? t("common.default") : null}
                key={size.toString()}
                value={size.toString()}
              />
            ))}
          </TableRadioGroup>
        )}
        <TableRowGroup title={t("settings.emojiPreview")}>
          <Image
            source={{ uri: emojiSampleUrl }}
            style={{ width: emojiSize, height: emojiSize, borderRadius: 8, alignSelf: "center" }}
          />
        </TableRowGroup>

        <FormRow
          label={t("settings.stickerSize")}
          trailing={<FormText style={{ opacity: 0.6 }}>{size}</FormText>}
          arrow
          onPress={() => setOpenPicker(openPicker === "sticker" ? null : "sticker")}
        />
        {openPicker === "sticker" && (
          <TableRadioGroup
            title={t("settings.stickerSize")}
            value={size.toString()}
            onChange={v => {
              storage.stickerSize = parseInt(v);
              setOpenPicker(null);
            }}
          >
            {STICKER_SIZES.map(size => (
              <TableRadioRow
                label={size.toString()}
                subLabel={size === DEFAULT_STICKER_SIZE ? t("common.default") : null}
                key={size.toString()}
                value={size.toString()}
              />
            ))}
          </TableRadioGroup>
        )}
        <TableRowGroup title={t("settings.stickerPreview")}>
          <Image
            source={{ uri: sampleUrl }}
            style={{ width: previewSize, height: previewSize, borderRadius: 8, alignSelf: "center" }}
          />
        </TableRowGroup>
      </Stack>
    </ScrollView>
  );
}
