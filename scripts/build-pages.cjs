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
// A browser can safely receive only a Supabase publishable key or legacy anon JWT.
// Reject opaque values and JWTs with service_role or other privileged roles.
function isPublicSupabaseKey(value) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.role === 'anon';
  } catch { return false; }
}
if (!isPublicSupabaseKey(key)) {
  throw new Error('SUPABASE_PUBLISHABLE_KEY harus sb_publishable_... atau legacy anon JWT. Jangan gunakan secret/service_role.');
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
// Cloudflare Pages reads _headers from the output root.
if (fs.existsSync(path.join(root, '_headers')))
  fs.copyFileSync(path.join(root, '_headers'), path.join(output, '_headers'));
for (const folder of ["assets", "css", "js"]) {
  const source = path.join(root, folder);
  if (!fs.existsSync(source)) continue;
  fs.cpSync(source, path.join(output, folder), {
    recursive: true,
    filter: (item) =>
      !["supabase-config.js", "supabase-config.example.js"].includes(path.basename(item)) &&
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
