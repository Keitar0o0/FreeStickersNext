<div align="center">

# FreeStickersNext

**无需 Nitro** 使用 Discord 贴纸与自定义表情

[English](README.md) · [中文](README.zh_CN.md)

</div>

## 功能特性

- **自定义表情** — 解锁，受限制的静态/动画表情改写为 Discord CDN 链接。
- **PNG / GIF 贴纸** — 以超链接形式发送。
- **APNG 贴纸** — **端侧编码为 GIF**（`upng-js` 解码 + `gifenc` 编码），再作为附件直接发送给 Discord。

内容类型处理：

| 内容 | 处理方式 |
| --- | --- |
| 当前频道可用的贴纸 | 交给 Discord 原生发送逻辑 |
| PNG 贴纸 / GIF 贴纸 | 发送 `media.discordapp.net` 媒体链接 |
| APNG 贴纸 | 端侧转换为 GIF 并作为附件发送，异常时回退为静态 PNG 链接 |
| Lottie 贴纸 | 弹出提示，暂缓发送 |
| 当前频道可用的表情 | 保留原始表情文本 |
| 受限制的静态或动画表情 | 改写为 Discord CDN 链接 |
| Boost 等级限制的贴纸 | 在贴纸选择器中标记为可发送 |

## 安装

本插件使用 [Revenge](https://github.com/revenge-mod) 加载。

**插件源安装（推荐）** — 在插件浏览器中添加 GitHub Pages 源：

```
https://Keitar0o0.github.io/FreeStickersNext
```

**手动安装** — 自行构建（见下文），在插件浏览器中加载 `dist/index.js`；或自行托管 `dist/` 目录（内含 `index.js` 与带哈希的 `manifest.json`，即一个完整插件）。

## 已知限制

- **Lottie 贴纸（format_type 3）** 不会发送：Discord 只提供 `.json`（没有 PNG/GIF 路由），发送链接会产生 404 死链，尝试发送时会弹出 Toast 说明。
- **APNG 发送** — `src/upload.ts` 解析 Revenge 的 TurboModule 或旧版文件桥，将 GIF 写入原生缓存并以 multipart 附件直接发给 Discord；若 Discord 拒绝上传，则回退为静态 PNG 链接。
- **APNG 转换在 JS 线程执行** — 超大贴纸可能需要片刻（会显示「转换中…」Toast）。
- **嵌入链接权限** — 在没有 *Embed Links* 权限的频道中，链接以纯文本显示；发送前会弹出确认提示。

## 从源码构建

要求：[Bun](https://bun.sh)

```sh
bun install        # 仅声明 devDependencies；APNG/GIF 代码已内置在 src/apng
bun run build      # 打包到 dist/index.js
bun run watch      # 文件变更自动重建
bun run typecheck  # tsc --noEmit 类型检查
```

构建产物：

| 文件 | 用途 |
| --- | --- |
| `dist/index.js` | Vendetta/Revenge 加载的单文件插件包 |
| `dist/manifest.json` | 发布清单，包含构建产物哈希 |
| `dist/source.json` | 配置发布基址时生成的插件源索引 |

## 致谢

- [Revenge](https://github.com/revenge-mod) —— 插件加载
- [FreeStickers](https://github.com/aliernfrog/vd-plugins/tree/main/plugins/FreeStickers) — 原版贴纸插件
- [freemoji](https://github.com/Rico040/bunny-plugins/tree/gh-pages/freemoji) — 表情解锁与 CDN 改写
- [upng-js](https://github.com/photopea/UPNG.js) — APNG 解码器
- [gifenc](https://github.com/mattdesl/gifenc) — GIF 编码器

## 许可证

[GPL-3.0](LICENSE)
