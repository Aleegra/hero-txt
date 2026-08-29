// One-off: parse the legacy flat README.md into data/products/*.json,
// assign the new category taxonomy, and seed products that were never tracked.
// Safe to re-run: existing history entries are preserved and merged by date.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'products');

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// productId -> category id (see data/categories.json)
const CATEGORY = {
  akash: 'ai-cloud',
  akeyless: 'security',
  armo: 'security',
  axiom: 'observability',
  'cast-ai': 'k8s-finops',
  chainguard: 'security',
  chronosphere: 'observability',
  circleci: 'cicd',
  cloudsmith: 'cicd',
  codefresh: 'cicd',
  coder: 'agent-runtime',
  controlplane: 'security',
  coralogix: 'observability',
  cortex: 'platform-eng',
  devcycle: 'cicd',
  diagrid: 'platform-eng',
  digitalocean: 'cloud-network',
  docker: 'cicd',
  doit: 'k8s-finops',
  env0: 'platform-eng',
  'giant-swarm': 'platform-eng',
  harness: 'cicd',
  'incident-io': 'observability',
  isovalent: 'cloud-network',
  jetbrains: 'dev-work-tools',
  komodor: 'k8s-finops',
  kubecost: 'k8s-finops',
  loft: 'platform-eng',
  'logz-io': 'observability',
  lumigo: 'observability',
  mirantis: 'cloud-network',
  nops: 'k8s-finops',
  neo4j: 'agent-memory',
  'octopus-deploy': 'cicd',
  opensearch: 'observability',
  portworx: 'k8s-finops',
  scaleway: 'cloud-network',
  scaleops: 'k8s-finops',
  snyk: 'security',
  'solo-io': 'cloud-network',
  spacelift: 'platform-eng',
  steadybit: 'observability',
  traefik: 'cloud-network',
  upbound: 'platform-eng',
  upwind: 'security',
  wiz: 'security',
  zesty: 'k8s-finops',
  shopify: 'dev-work-tools',
};

// The legacy README had a copy-paste error: komodor pointed at coder.com.
const URL_FIXES = { komodor: 'https://komodor.com/' };

// Products with no history yet — the capture pipeline fills these in.
const SEEDS = [
  ['Fireworks AI', 'https://fireworks.ai/', 'inference'],
  ['Modal', 'https://modal.com/', 'inference'],
  ['Baseten', 'https://www.baseten.co/', 'inference'],
  ['DeepInfra', 'https://deepinfra.com/', 'inference'],
  ['Inferact', 'https://inferact.ai/', 'inference'],
  ['RadixArk', 'https://www.radixark.com/', 'inference'],
  ['OpenRouter', 'https://openrouter.ai/', 'inference'],

  ['Nebius', 'https://nebius.com/', 'ai-cloud'],
  ['CoreWeave', 'https://coreweave.com/', 'ai-cloud'],
  ['GMI Cloud', 'https://www.gmicloud.ai/', 'ai-cloud'],
  ['Together AI', 'https://www.together.ai/', 'ai-cloud'],
  ['SkyPilot', 'https://skypilot.ai/', 'ai-cloud'],

  ['E2B', 'https://e2b.dev/', 'agent-runtime'],
  ['Daytona', 'https://www.daytona.io/', 'agent-runtime'],
  ['Runta', 'https://runta.com/', 'agent-runtime'],

  ['Raft', 'https://raft.build/', 'agent-harness'],
  ['DeepSeek Harness', 'https://deepseek.com/harness/en/', 'agent-harness'],
  ['LangChain', 'https://www.langchain.com/', 'agent-harness'],
  ['Dify', 'https://dify.ai/', 'agent-harness'],
  ['Composio', 'https://composio.dev/', 'agent-harness'],

  ['Cursor', 'https://cursor.com/', 'coding-agents'],
  ['Replit', 'https://replit.com/', 'coding-agents'],
  ['Lovable', 'https://lovable.dev/', 'coding-agents'],
  ['Vercel', 'https://vercel.com/', 'coding-agents'],

  ['mem0', 'https://mem0.ai/', 'agent-memory'],
  ['Evermind', 'https://evermind.ai/', 'agent-memory'],
  ['Cognee', 'https://www.cognee.ai/', 'agent-memory'],
  ['Letta', 'https://www.letta.com/', 'agent-memory'],
  ['Zep', 'https://www.getzep.com/', 'agent-memory'],

  ['Browser Use', 'https://browser-use.com/', 'browser-use'],
  ['Browserbase', 'https://www.browserbase.com/', 'browser-use'],
  ['Tinyfish', 'https://www.tinyfish.ai/', 'browser-use'],
  ['Firecrawl', 'https://www.firecrawl.dev/', 'browser-use'],

  ['Braintrust', 'https://www.braintrust.dev/', 'agent-eval'],
  ['Langfuse', 'https://langfuse.com/', 'agent-eval'],
  ['Arize AI', 'https://arize.com/', 'agent-eval'],
  ['LangSmith', 'https://www.langchain.com/langsmith', 'agent-eval'],

  ['Keycard', 'https://www.keycard.ai/', 'security'],

  ['Notion', 'https://www.notion.com/', 'dev-work-tools'],
];

function parseReadme() {
  const md = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const out = [];
  const re =
    /^### \[([^\]]+)\]\(([^)]+)\)\s*\n- \*\*Headline:\*\* (.*)\n- \*\*Sub-headline:\*\* (.*)\n- \*\*Update Date:\*\* (.*)$/gm;
  let m;
  while ((m = re.exec(md))) {
    const [, name, url, headline, sub, date] = m;
    const id = slug(name);
    out.push({
      id,
      name,
      url: URL_FIXES[id] ?? url,
      category: CATEGORY[id] ?? 'uncategorized',
      history: [
        {
          date: date.trim().replace(/\./g, '-').replace(/-(\d)(?!\d)/g, '-0$1'),
          headline: headline.trim(),
          subheadline: sub.trim() === '/' ? '' : sub.trim(),
          screenshot: null,
        },
      ],
    });
  }
  return out;
}

const products = [
  ...parseReadme(),
  ...SEEDS.map(([name, url, category]) => ({
    id: slug(name),
    name,
    url,
    category,
    history: [],
  })),
];

mkdirSync(OUT, { recursive: true });
const seen = new Set();
for (const p of products) {
  if (seen.has(p.id)) throw new Error(`duplicate product id: ${p.id}`);
  seen.add(p.id);
  if (p.category === 'uncategorized')
    console.warn(`! no category for ${p.id}`);

  const file = join(OUT, `${p.id}.json`);
  if (existsSync(file)) {
    // Preserve anything the pipeline already captured.
    const prev = JSON.parse(readFileSync(file, 'utf8'));
    const byDate = new Map(prev.history.map((h) => [h.date, h]));
    for (const h of p.history) if (!byDate.has(h.date)) byDate.set(h.date, h);
    p.history = [...byDate.values()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
  }
  writeFileSync(file, JSON.stringify(p, null, 2) + '\n');
}

console.log(`wrote ${products.length} products to data/products/`);
