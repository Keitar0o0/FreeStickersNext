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
        <TableRowGroup title={t("通用", "General")}>
          <TableSwitchRow
            label={t("以超链接发送贴纸", "Hyperlink stickers")}
            value={storage.hyperlink}
            onValueChange={v => (storage.hyperlink = v)}
          />
          <TableSwitchRow
            label={t("忽略 Nitro", "Ignore Nitro")}
            subLabel={t("即使拥有 Nitro，也使用 FreeStickersNext 发送", "Force FreeStickersNext even when you have Nitro")}
            value={storage.ignoreNitro}
            onValueChange={v => (storage.ignoreNitro = v)}
          />
        </TableRowGroup>

        <FormSection>
          <Forms.FormInput
            title={t("自定义超链接文本", "CUSTOM HYPERLINK TEXT")}
            placeholder={t("留空时使用贴纸名称", "Leave empty to use the sticker's name")}
            value={storage.customHyperLinkString}
            onChange={v => (storage.customHyperLinkString = v)}
            style={{ marginHorizontal: 12 }}
          />
        </FormSection>

        <TableRowGroup title={t("动画贴纸", "Animated Stickers")}>
          <TableSwitchRow
            label={t("将 APNG 贴纸转换为 GIF", "Convert APNG stickers to GIF")}
            subLabel={t("在设备上编码并直接发送到 Discord", "Encoded on-device and sent directly to Discord")}
            value={storage.localEncode}
            onValueChange={v => (storage.localEncode = v)}
          />
        </TableRowGroup>

        <HelpMessage messageType={0}>
          {t(
            "贴纸以链接形式发送，APNG 动画贴纸可转换为 GIF 后直接上传。GIF 贴纸由 Discord 媒体代理提供动画。尺寸设置仅调整原图分辨率，Discord 中的链接预览采用固定显示尺寸",
            "Stickers are sent as plain links (or direct GIF uploads for animated APNG stickers). GIF stickers are served animated by Discord's own media proxy. Size only changes the source resolution — Discord renders link embeds at a fixed display size."
          )}
        </HelpMessage>

        <FormRow
          label={t("表情尺寸", "Emoji Size")}
          trailing={<FormText style={{ opacity: 0.6 }}>{emojiSize}</FormText>}
          arrow
          onPress={() => setOpenPicker(openPicker === "emoji" ? null : "emoji")}
        />
        {openPicker === "emoji" && (
          <TableRadioGroup
            title={t("表情尺寸", "Emoji Size")}
            value={emojiSize.toString()}
            onChange={v => {
              storage.emojiSize = parseInt(v);
              setOpenPicker(null);
            }}
          >
            {EMOJI_SIZES.map(size => (
              <TableRadioRow
                label={size.toString()}
                subLabel={size === DEFAULT_EMOJI_SIZE ? t("默认", "Default") : null}
                key={size.toString()}
                value={size.toString()}
              />
            ))}
          </TableRadioGroup>
        )}
        <TableRowGroup title={t("表情预览", "Emoji Preview")}>
          <Image
            source={{ uri: emojiSampleUrl }}
            style={{ width: emojiSize, height: emojiSize, borderRadius: 8, alignSelf: "center" }}
          />
        </TableRowGroup>

        <FormRow
          label={t("贴纸尺寸", "Sticker Size")}
          trailing={<FormText style={{ opacity: 0.6 }}>{size}</FormText>}
          arrow
          onPress={() => setOpenPicker(openPicker === "sticker" ? null : "sticker")}
        />
        {openPicker === "sticker" && (
          <TableRadioGroup
            title={t("贴纸尺寸", "Sticker Size")}
            value={size.toString()}
            onChange={v => {
              storage.stickerSize = parseInt(v);
              setOpenPicker(null);
            }}
          >
            {STICKER_SIZES.map(size => (
              <TableRadioRow
                label={size.toString()}
                subLabel={size === DEFAULT_STICKER_SIZE ? t("默认", "Default") : null}
                key={size.toString()}
                value={size.toString()}
              />
            ))}
          </TableRadioGroup>
        )}
        <TableRowGroup title={t("贴纸预览", "Preview")}>
          <Image
            source={{ uri: sampleUrl }}
            style={{ width: previewSize, height: previewSize, borderRadius: 8, alignSelf: "center" }}
          />
        </TableRowGroup>
      </Stack>
    </ScrollView>
  );
}
