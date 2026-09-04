import { expect, test } from "bun:test";
import { serveFile } from "../serve.mjs";

test("LAN server serves current files and confines requests to public project paths", async () => {
  const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: serveFile });
  try {
    const response = await fetch(new URL("package.json", server.url));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe(await Bun.file(new URL("../package.json", import.meta.url)).text());
    const listing = await fetch(server.url).then(response => response.text());
    expect(listing).toContain("package.json");
    expect(listing).not.toContain(".git");
    expect(listing).not.toContain("node_modules");
    for (const path of ["/.git/config", "/node_modules/typescript/package.json", "/%2e%2e%5cpackage.json", "/package.json:stream"]) {
      expect((await fetch(new URL(path, server.url))).status).toBe(403);
    }
    expect((await fetch(new URL("/%ZZ", server.url))).status).toBe(400);
    expect((await fetch(new URL("/missing-file", server.url))).status).toBe(404);
    expect((await fetch(server.url, { method: "POST" })).status).toBe(405);
    expect(await fetch(new URL("package.json", server.url), { method: "HEAD" }).then(response => response.text())).toBe("");
  } finally {
    await server.stop(true);
  }
});
