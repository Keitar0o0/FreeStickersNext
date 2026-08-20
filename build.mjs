// Build the plugin into a single bundled JS file (the way Vendetta/Revenge
// loaders expect it), using Bun's bundler.
import { build } from "bun";
import { createHash } from "node:crypto";
import { rm, readFile, writeFile } from "node:fs/promises";

const watch = process.argv.includes("--watch");

// Public base URL of the published plugin, e.g. https://<user>.github.io/FreeStickersNext
// (needed to emit dist/source.json; dist/ is served as the site root)
const baseArg = process.argv.find((arg) => arg.startsWith("--base="));
const baseUrl = baseArg
  ? baseArg.slice("--base=".length)
  : process.env.PLUGIN_BASE_URL;

// Vendetta evaluates plugin bundles as `vendetta => ${bundle}`, injecting a
// single `vendetta` global. Two adaptations are needed:
// 1. Rewrite `@vendetta/*` imports into destructures of that global, so the
//    bundle has no ESM `import` (a SyntaxError inside the loader's arrow fn).
// 2. Bun's ESM output ends in `export { ... }`, which is also invalid inside a
//    function body — rewrite that block into a `return` and wrap in an IIFE
//    that evaluates to the module object (what the loader reads back).
const vendettaGlobals = {
  name: "vendetta-globals",
  setup(build) {
    build.onLoad({ filter: /\.(ts|tsx|js)$/ }, async (args) => {
      if (args.path.endsWith(".d.ts")) return;
      const source = await readFile(args.path, "utf8");
      const contents = source.replace(
        /import\s+(.*?)\s+from\s+["'](@vendetta\/[^"']+)["']/g,
        (_m, bindings, mod) => {
          const g = `vendetta.${mod.slice("@vendetta/".length).split("/").join(".")}`;
          if (bindings.startsWith("*")) return `const ${bindings.replace("* as ", "")} = ${g};`;
          if (bindings.startsWith("{")) return `const ${bindings} = ${g};`;
          return `const ${bindings} = ${g}.default ?? ${g};`;
        },
      );
      return { contents, loader: args.path.endsWith(".tsx") ? "tsx" : args.path.endsWith(".ts") ? "ts" : "js" };
    });
  },
};

// Turn Bun's ESM output (`var x = ...; export { ... };`) into
// `(() => { ...; return { name: local, ... }; })()`, a valid expression for
// the loader. The export names double as the plugin's public API.
function toVendettaBundle(code) {
  const m = code.match(/export\s*\{([\s\S]*?)\};?\s*$/);
  if (!m) throw new Error("bundle has no trailing export block — nothing to return");
  const entries = m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [local, , name] = entry.split(/\s+/);
      return `${name || local}: ${local}`;
    });
  return `(()=>{${code.slice(0, m.index)}return{${entries.join(",")}};})()`;
}

await rm("dist", { recursive: true, force: true });

const publish = {
  name: "vendetta-publish",
  setup(build) {
    build.onEnd(async () => {
      const bundlePath = "dist/index.js";
      await writeFile(bundlePath, toVendettaBundle(await readFile(bundlePath, "utf8")));

      // Publish metadata: Vendetta fetches `manifest.json` + `index.js` from one
      // directory, so dist/ doubles as the plugin. Skip in watch (dev-only).
      if (watch) return;
      const manifest = {
        ...JSON.parse(await readFile("manifest.json", "utf-8")),
        main: "index.js",
        hash: createHash("sha256").update(await readFile(bundlePath)).digest("hex"),
      };
      await writeFile("dist/manifest.json", JSON.stringify(manifest, null, 2));

      // Marketplace entry (`--base=<url>` or PLUGIN_BASE_URL), for adding dist/
      // as a plugin source in the client.
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
    });
  },
};

const result = await build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  naming: "index.js",
  bundle: true,
  minify: true,
  sourcemap: false,
  target: "browser",
  format: "esm",
  jsx: { runtime: "classic", development: false },
  plugins: [vendettaGlobals, publish],
  watch,
});

if (result.outputs) {
  for (const out of result.outputs) console.log(`built: ${out.path} (${out.size} bytes)`);
}

console.log("FreeStickersNext built ✓");
