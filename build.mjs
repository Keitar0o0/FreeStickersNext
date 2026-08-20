// Build the plugin into a single bundled JS file (the way Vendetta/Revenge
// loaders expect it), using Bun's bundler.
import { build } from "bun";
import { createHash } from "node:crypto";
import { rm, readFile, writeFile } from "node:fs/promises";

// Modules provided by the host app / loader — never bundle them.
const external = [
  "@vendetta",
  "@vendetta/*",
  "react",
  "react/jsx-runtime",
  "react-native",
  "@react-native/*",
];

const watch = process.argv.includes("--watch");

// Public base URL of the published plugin, e.g. https://<user>.github.io/FreeStickersNext
// (needed to emit dist/source.json; dist/ is served as the site root)
const baseArg = process.argv.find((arg) => arg.startsWith("--base="));
const baseUrl = baseArg
  ? baseArg.slice("--base=".length)
  : process.env.PLUGIN_BASE_URL;

await rm("dist", { recursive: true, force: true });

const result = await build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  naming: "index.js",
  bundle: true,
  minify: true,
  sourcemap: false,
  target: "browser",
  format: "esm",
  jsx: { runtime: "automatic", development: false },
  external,
  watch,
});

if (result.outputs) {
  for (const out of result.outputs) console.log(`built: ${out.path} (${out.size} bytes)`);
}

// Publish metadata: Vendetta fetches `manifest.json` + `index.js` from one
// directory, so dist/ doubles as the plugin. Skip in watch (dev-only).
if (!watch) {
  const manifest = {
    ...JSON.parse(await readFile("manifest.json", "utf-8")),
    main: "index.js",
    hash: createHash("sha256").update(await readFile("dist/index.js")).digest("hex"),
  };
  await writeFile("dist/manifest.json", JSON.stringify(manifest, null, 2));

  // Marketplace entry (`--base=<url>` or PLUGIN_BASE_URL), for adding dist/ as
  // a plugin source in the client.
  if (baseUrl) {
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    const file = `${baseUrl.replace(/\/+$/, "")}/index.js`;
    const source = {
      plugins: [
        {
          name: manifest.name,
          description: manifest.description,
          authors: manifest.authors,
          hash: manifest.hash,
          file,
          version: pkg.version,
        },
      ],
    };
    await writeFile("dist/source.json", JSON.stringify(source, null, 2));
    console.log(`source.json → ${file}`);
  }
}

console.log("FreeStickersNext built ✓");