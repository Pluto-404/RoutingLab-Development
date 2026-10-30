"use strict";
// Cloudflare Pages build for RoutingLab (static HTML/CSS/JS).
// Only static public assets are deployed. Never copy .env, git history, or SQL migrations.
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const output = path.join(root, "dist");
const url = (process.env.SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_PUBLISHABLE_KEY || "").trim();
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  throw new Error("SUPABASE_URL harus berupa https://PROJECT_REF.supabase.co");
}
if (
  !key ||
  /YOUR_|PLACEHOLDER/i.test(key) ||
  /^(sb_secret_|eyJ.*service_role)/i.test(key)
) {
  throw new Error(
    "SUPABASE_PUBLISHABLE_KEY harus publishable/anon key, bukan secret/service_role.",
  );
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const htmlFiles = fs
  .readdirSync(root)
  .filter(
    (file) =>
      file.endsWith(".html") && fs.statSync(path.join(root, file)).isFile(),
  );
for (const file of htmlFiles)
  fs.copyFileSync(path.join(root, file), path.join(output, file));
for (const folder of ["assets", "css", "js"]) {
  const source = path.join(root, folder);
  if (!fs.existsSync(source)) continue;
  fs.cpSync(source, path.join(output, folder), {
    recursive: true,
    filter: (item) =>
      path.basename(item) !== "supabase-config.js" &&
      !path.basename(item).startsWith(".env"),
  });
}
fs.mkdirSync(path.join(output, "js"), { recursive: true });
fs.writeFileSync(
  path.join(output, "js", "supabase-config.js"),
  "window.ROUTINGLAB_SUPABASE = " +
    JSON.stringify(
      { url: url.replace(/\/$/, ""), publishableKey: key },
      null,
      2,
    ) +
    ";\n",
);
console.log(
  `RoutingLab Pages build selesai: ${htmlFiles.length} HTML + css/js/assets -> dist/`,
);
