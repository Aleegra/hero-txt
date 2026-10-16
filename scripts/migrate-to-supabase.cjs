
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

// Load .env without requiring an additional package.
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const ROOT = process.cwd();
const CATEGORIES_FILE = path.join(ROOT, "data", "categories.json");
const PRODUCTS_DIR = path.join(ROOT, "data", "products");
const DRY_RUN = !process.argv.includes("--apply");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function collectProductFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) return collectProductFiles(fullPath);
    return item.isFile() && item.name.endsWith(".json") ? [fullPath] : [];
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const categories = readJson(CATEGORIES_FILE);
  const productFiles = collectProductFiles(PRODUCTS_DIR);
  const products = productFiles.map(readJson);

  assert(Array.isArray(categories), "categories.json must contain an array");
  assert(products.length > 0, "No product JSON files found");

  const categoryIds = new Set();
  for (const category of categories) {
    assert(category.id && category.name, "Category missing id or name");
    assert(!categoryIds.has(category.id), `Duplicate category id: ${category.id}`);
    categoryIds.add(category.id);
  }

  const productIds = new Set();
  for (const product of products) {
    assert(product.id && product.name, "Product missing id or name");
    assert(!productIds.has(product.id), `Duplicate product id: ${product.id}`);
    productIds.add(product.id);
    assert(
      Array.isArray(product.history),
      `Product ${product.id} has no history array`
    );
    if (product.category && !categoryIds.has(product.category)) {
      throw new Error(
        `Unknown category "${product.category}" in product ${product.id}`
      );
    }
  }

  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "APPLY"}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Products: ${products.length}`);
  console.log(
    `History versions: ${products.reduce((n, p) => n + p.history.length, 0)}`
  );

  if (DRY_RUN) {
    console.log("Validation passed. No database changes were made.");
    console.log("Review the counts, then run with --apply to import.");
    return;
  }

  // Sync categories by slug and preserve their existing UUIDs.
  const categoryUuidBySlug = new Map();

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const row = {
      name: category.name,
      slug: category.id,
      sort_order: i
    };

    const { data: existing, error: lookupError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category.id)
      .maybeSingle();

    if (lookupError) throw lookupError;

    let saved;
    if (existing) {
      const result = await supabase
        .from("categories")
        .update(row)
        .eq("id", existing.id)
        .select("id")
        .single();
      if (result.error) throw result.error;
      saved = result.data;
    } else {
      const result = await supabase
        .from("categories")
        .insert(row)
        .select("id")
        .single();
      if (result.error) throw result.error;
      saved = result.data;
    }

    categoryUuidBySlug.set(category.id, saved.id);
  }

  let importedProducts = 0;
  let importedVersions = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const latest = product.history[0] || {};
    const categoryUuid = product.category
      ? categoryUuidBySlug.get(product.category)
      : null;

    const entryRow = {
      source_id: product.id,
      company_name: product.name,
      slug: product.id,
      website_url: product.url || null,
      headline: latest.headline || null,
      subheadline: latest.subheadline || null,
      category_id: categoryUuid || null,
      fingerprint: product.fingerprint || null,
      sort_order: i,
      status: "published"
    };

    const { data: existing, error: lookupError } = await supabase
      .from("hero_entries")
      .select("id")
      .eq("source_id", product.id)
      .maybeSingle();

    if (lookupError) throw lookupError;

    let entry;
    if (existing) {
      const result = await supabase
        .from("hero_entries")
        .update(entryRow)
        .eq("id", existing.id)
        .select("id")
        .single();
      if (result.error) throw result.error;
      entry = result.data;
    } else {
      const result = await supabase
        .from("hero_entries")
        .insert(entryRow)
        .select("id")
        .single();
      if (result.error) throw result.error;
      entry = result.data;
    }

    // Replace this entry's version rows to make repeated imports consistent.
    const { error: deleteError } = await supabase
      .from("hero_versions")
      .delete()
      .eq("entry_id", entry.id);

    if (deleteError) throw deleteError;

    if (product.history.length > 0) {
      const versionRows = product.history.map((version) => ({
        entry_id: entry.id,
        version_date: version.date || null,
        headline: version.headline || null,
        subheadline: version.subheadline || null,
        source_screenshot_path: version.screenshot || null,
        screenshot_url: null,
        fingerprint: product.fingerprint || null
      }));

      const { error: insertError } = await supabase
        .from("hero_versions")
        .insert(versionRows);

      if (insertError) throw insertError;
      importedVersions += versionRows.length;
    }

    importedProducts++;
    if (importedProducts % 10 === 0 || importedProducts === products.length) {
      console.log(`Processed ${importedProducts}/${products.length} products`);
    }
  }

  console.log("Import completed.");
  console.log(`Categories synced: ${categories.length}`);
  console.log(`Products synced: ${importedProducts}`);
  console.log(`Versions synced: ${importedVersions}`);
}

main().catch((error) => {
  console.error("Migration failed:", error.message || error);
  process.exitCode = 1;
});
