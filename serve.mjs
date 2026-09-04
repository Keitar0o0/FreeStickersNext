import { readdir, realpath, stat } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { isAbsolute, relative, resolve, sep } from "node:path";

const root = await realpath(import.meta.dir);
const headers = { "Cache-Control": "no-store" };
const hidden = name => name.startsWith(".") || name.toLowerCase() === "node_modules";

export async function serveFile(request) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response("Method Not Allowed", { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url).pathname);
  } catch {
    return new Response("Bad Request", { status: 400, headers });
  }
  if (/[\\:\0]/.test(pathname) || pathname.split("/").some(hidden)) {
    return new Response("Forbidden", { status: 403, headers });
  }
  try {
    const path = await realpath(resolve(root, `.${pathname}`));
    const local = relative(root, path);
    if (isAbsolute(local) || local.split(sep).some(hidden)) {
      return new Response("Forbidden", { status: 403, headers });
    }
    if ((await stat(path)).isDirectory()) {
      const names = (await readdir(path)).filter(name => !hidden(name)).sort();
      return new Response(request.method === "HEAD" ? null : names.join("\n"), { headers });
    }
    return new Response(request.method === "HEAD" ? null : Bun.file(path), { headers });
  } catch (error) {
    if (!["ENOENT", "ENOTDIR", "EACCES", "EPERM"].includes(error.code)) console.error(error);
    return new Response("Not Found", { status: 404, headers });
  }
}

if (import.meta.main) {
  const port = Number(process.argv[2] ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port must be between 1 and 65535");
  const server = Bun.serve({ hostname: "0.0.0.0", port, fetch: serveFile });
  console.log(`Project: ${root}`);
  for (const address of Object.values(networkInterfaces()).flat()) {
    if (address?.family === "IPv4" && !address.internal) {
      console.log(`Files: http://${address.address}:${server.port}/`);
      console.log(`Plugin: http://${address.address}:${server.port}/dist/`);
    }
  }
  console.log(`Local: http://127.0.0.1:${server.port}/ — Ctrl+C to stop`);
}
