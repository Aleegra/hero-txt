
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = process.cwd();
const SHOTS_DIR = path.join(ROOT, "shots");
const PRODUCTS_DIR = path.join(ROOT, "data", "products");
const BUCKET = "hero-screenshots";
const APPLY = process.argv.includes("--apply");

function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) throw new Error(".env not found");

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function collectFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) return collectFiles(full);
    return item.isFile() ? [full] : [];
  });
}

function collectJsonFiles(dir) {
  return collectFiles(dir).filter((file) => file.endsWith(".json"));
}

async function main() {
  loadEnv();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase credentials in .env");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false }
  });

  const products = collectJsonFiles(PRODUCTS_DIR).map(readJson);
  const screenshotPaths = new Set();

  for (const product of products) {
    for (const version of product.history || []) {
      if (version.screenshot) {
        screenshotPaths.add(version.screenshot.replace(/\\/g, "/"));
      }
    }
  }

  const files = collectFiles(SHOTS_DIR);
  const fileByRelativePath = new Map(
    files.map((file) => [
      path.relative(ROOT, file).replace(/\\/g, "/"),
      file
    ])
  );

  const missing = [...screenshotPaths].filter(
    (p) => !fileByRelativePath.has(p)
  );

  if (missing.length) {
    throw new Error(`Missing ${missing.length} screenshot file(s)`);
  }

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`Unique screenshots: ${screenshotPaths.size}`);

  if (!APPLY) {
    console.log("Preflight passed. No uploads or database changes made.");
    console.log("Run with --apply to upload and update screenshot URLs.");
    return;
  }

  let uploaded = 0;
  let updated = 0;
  let failed = 0;

  for (const sourcePath of screenshotPaths) {
    try {
      const localFile = fileByRelativePath.get(sourcePath);
      const storagePath = path.relative(SHOTS_DIR, localFile)
        .replace(/\\/g, "/");

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fs.readFileSync(localFile), {
          contentType: "image/webp",
          upsert: true
        });

      if (uploadError) throw uploadError;
      uploaded++;

      const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const { data: rows, error: lookupError } = await supabase
        .from("hero_versions")
        .select("id")
        .eq("source_screenshot_path", sourcePath);

      if (lookupError) throw lookupError;

      for (const row of rows || []) {
        const { error: updateError } = await supabase
          .from("hero_versions")
          .update({ screenshot_url: data.publicUrl })
          .eq("id", row.id);

        if (updateError) throw updateError;
        updated++;
      }

      console.log(`Uploaded: ${storagePath}`);
    } catch (error) {
      failed++;
      console.error(`Failed: ${sourcePath}:`, error.message || error);
    }
  }

  console.log("\nUpload finished.");
  console.log(`Files uploaded: ${uploaded}`);
  console.log(`Version records updated: ${updated}`);
  console.log(`Failed files: ${failed}`);

  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Upload failed:", error.message || error);
  process.exitCode = 1;
});
