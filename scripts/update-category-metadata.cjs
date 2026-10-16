
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

const root = path.resolve(__dirname, '..');

// Read the local .env file without adding another dependency.
const envFile = fs.readFileSync(path.join(root, '.env'), 'utf8');
for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (!match || match[1] in process.env) continue;

  let value = match[2];
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[match[1]] = value;
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

const supabase = createClient(url, key);
const categories = JSON.parse(
  fs.readFileSync(path.join(root, 'data/categories.json'), 'utf8')
);

async function main() {
  let updated = 0;

  for (const category of categories) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        group: category.group,
        blurb: category.blurb,
        color: category.color,
        short: category.short,
      })
      .eq('slug', category.id)
      .select('id');

    if (error) {
      throw new Error(`Failed to update ${category.id}: ${error.message}`);
    }

    if (!data || data.length !== 1) {
      throw new Error(
        `Expected one category for slug "${category.id}", got ${data?.length ?? 0}`
      );
    }

    updated++;
    console.log(`Updated: ${category.id}`);
  }

  console.log(`Finished: ${updated} categories updated.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
