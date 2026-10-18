-- Moves the two pieces of pipeline state that used to live in git into the
-- database, now that the library itself is here. Run once in the SQL editor.
-- Safe to re-run: every statement is idempotent.

-- 1. url_history — every category a product has been published under.
--
-- Product URLs nest under the category, so recategorising a product moves it.
-- The build leaves a redirect at each address a product has left, and this is
-- the only record of those addresses: it cannot be recovered from current data.
-- It replaces data/url-history.json, which the build used to write and CI then
-- threw away.

create table if not exists public.url_history (
  entry_slug    text        not null,
  category_slug text        not null,
  first_seen    timestamptz not null default now(),
  primary key (entry_slug, category_slug)
);

alter table public.url_history enable row level security;
drop policy if exists "url_history is public" on public.url_history;
create policy "url_history is public" on public.url_history
  for select to anon, authenticated using (true);

-- Recorded by a trigger rather than by the scripts, so a category changed by
-- hand in the dashboard is caught too. Only published products count: a staged
-- product was never reachable, so it has no old address to redirect.
create or replace function public.record_url_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and new.category_id is not null then
    insert into url_history (entry_slug, category_slug)
    select new.slug, c.slug from categories c where c.id = new.category_id
    on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists record_url_history on public.hero_entries;
create trigger record_url_history
  after insert or update of category_id, status, slug on public.hero_entries
  for each row execute function public.record_url_history();

-- Seeded from data/url-history.json as of 2026-10-18, in its original order.
insert into public.url_history (entry_slug, category_slug, first_seen) values
  ('agentmail', 'dev-work-tools', timestamptz '2026-09-01' + interval '0 second'),
  ('akash', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second'),
  ('akeyless', 'security', timestamptz '2026-09-01' + interval '0 second'),
  ('anyscale', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second'),
  ('apify', 'browser-use', timestamptz '2026-09-01' + interval '0 second'),
  ('apollo', 'gtm', timestamptz '2026-09-01' + interval '0 second'),
  ('arize-ai', 'agent-eval', timestamptz '2026-09-01' + interval '0 second'),
  ('armo', 'security', timestamptz '2026-09-01' + interval '0 second'),
  ('axiom', 'observability', timestamptz '2026-09-01' + interval '0 second'),
  ('baseten', 'inference', timestamptz '2026-09-01' + interval '0 second'),
  ('braintrust', 'agent-eval', timestamptz '2026-09-01' + interval '0 second'),
  ('browser-use', 'browser-use', timestamptz '2026-09-01' + interval '0 second'),
  ('browserbase', 'browser-use', timestamptz '2026-09-01' + interval '0 second'),
  ('cast-ai', 'k8s-finops', timestamptz '2026-09-01' + interval '0 second'),
  ('chainguard', 'security', timestamptz '2026-09-01' + interval '0 second'),
  ('chronosphere', 'observability', timestamptz '2026-09-01' + interval '0 second'),
  ('circleci', 'cicd', timestamptz '2026-09-01' + interval '0 second'),
  ('clay', 'gtm', timestamptz '2026-09-01' + interval '0 second'),
  ('cloudsmith', 'cicd', timestamptz '2026-09-01' + interval '0 second'),
  ('codefresh', 'cicd', timestamptz '2026-09-01' + interval '0 second'),
  ('coder', 'agent-runtime', timestamptz '2026-09-01' + interval '0 second'),
  ('cognee', 'agent-memory', timestamptz '2026-09-01' + interval '0 second'),
  ('composio', 'agent-harness', timestamptz '2026-09-01' + interval '0 second'),
  ('conductor', 'agent-harness', timestamptz '2026-09-01' + interval '0 second'),
  ('controlplane', 'security', timestamptz '2026-09-01' + interval '0 second'),
  ('coralogix', 'observability', timestamptz '2026-09-01' + interval '0 second'),
  ('coreweave', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second'),
  ('cortex', 'platform-eng', timestamptz '2026-09-01' + interval '0 second'),
  ('cursor', 'coding-agents', timestamptz '2026-09-01' + interval '0 second'),
  ('daytona', 'agent-runtime', timestamptz '2026-09-01' + interval '0 second'),
  ('deepinfra', 'inference', timestamptz '2026-09-01' + interval '0 second'),
  ('deepseek-harness', 'agent-harness', timestamptz '2026-09-01' + interval '0 second'),
  ('devcycle', 'cicd', timestamptz '2026-09-01' + interval '0 second'),
  ('diagrid', 'platform-eng', timestamptz '2026-09-01' + interval '0 second'),
  ('dify', 'agent-harness', timestamptz '2026-09-01' + interval '0 second'),
  ('digitalocean', 'cloud-network', timestamptz '2026-09-01' + interval '0 second'),
  ('docker', 'cicd', timestamptz '2026-09-01' + interval '0 second'),
  ('doit', 'k8s-finops', timestamptz '2026-09-01' + interval '0 second'),
  ('e2b', 'agent-runtime', timestamptz '2026-09-01' + interval '0 second'),
  ('env0', 'platform-eng', timestamptz '2026-09-01' + interval '0 second'),
  ('evermind', 'agent-memory', timestamptz '2026-09-01' + interval '0 second'),
  ('exa', 'search', timestamptz '2026-09-01' + interval '0 second'),
  ('firecrawl', 'browser-use', timestamptz '2026-09-01' + interval '0 second'),
  ('fireworks-ai', 'inference', timestamptz '2026-09-01' + interval '0 second'),
  ('giant-swarm', 'platform-eng', timestamptz '2026-09-01' + interval '0 second'),
  ('glean', 'agent-memory', timestamptz '2026-09-01' + interval '0 second'),
  ('gmi-cloud', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second'),
  ('harness', 'cicd', timestamptz '2026-09-01' + interval '0 second'),
  ('incident-io', 'observability', timestamptz '2026-09-01' + interval '0 second'),
  ('isovalent', 'cloud-network', timestamptz '2026-09-01' + interval '0 second'),
  ('jetbrains', 'dev-work-tools', timestamptz '2026-09-01' + interval '0 second'),
  ('keycard', 'security', timestamptz '2026-09-01' + interval '0 second'),
  ('kimchi', 'coding-agents', timestamptz '2026-09-01' + interval '0 second'),
  ('komodor', 'k8s-finops', timestamptz '2026-09-01' + interval '0 second'),
  ('kubecost', 'k8s-finops', timestamptz '2026-09-01' + interval '0 second'),
  ('langchain', 'agent-harness', timestamptz '2026-09-01' + interval '0 second'),
  ('langfuse', 'agent-eval', timestamptz '2026-09-01' + interval '0 second'),
  ('langsmith', 'agent-eval', timestamptz '2026-09-01' + interval '0 second'),
  ('letta', 'agent-memory', timestamptz '2026-09-01' + interval '0 second'),
  ('lightfield', 'gtm', timestamptz '2026-09-01' + interval '0 second'),
  ('litellm', 'ai-gateway', timestamptz '2026-09-01' + interval '0 second'),
  ('logz-io', 'observability', timestamptz '2026-09-01' + interval '0 second'),
  ('lovable', 'coding-agents', timestamptz '2026-09-01' + interval '0 second'),
  ('lumigo', 'observability', timestamptz '2026-09-01' + interval '0 second'),
  ('mem0', 'agent-memory', timestamptz '2026-09-01' + interval '0 second'),
  ('mesh-pay', 'fintech', timestamptz '2026-09-01' + interval '0 second'),
  ('milestone', 'agent-eval', timestamptz '2026-09-01' + interval '0 second'),
  ('milvus', 'database', timestamptz '2026-09-01' + interval '0 second'),
  ('mirantis', 'cloud-network', timestamptz '2026-09-01' + interval '0 second'),
  ('modal', 'inference', timestamptz '2026-09-01' + interval '0 second'),
  ('multica', 'agent-harness', timestamptz '2026-09-01' + interval '0 second'),
  ('n8n', 'agent-harness', timestamptz '2026-09-01' + interval '0 second'),
  ('nebius', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second'),
  ('neo4j', 'database', timestamptz '2026-09-01' + interval '0 second'),
  ('nops', 'k8s-finops', timestamptz '2026-09-01' + interval '0 second'),
  ('notion', 'dev-work-tools', timestamptz '2026-09-01' + interval '0 second'),
  ('octopus-deploy', 'cicd', timestamptz '2026-09-01' + interval '0 second'),
  ('openrouter', 'ai-gateway', timestamptz '2026-09-01' + interval '0 second'),
  ('opensearch', 'observability', timestamptz '2026-09-01' + interval '0 second'),
  ('pinecone', 'database', timestamptz '2026-09-01' + interval '0 second'),
  ('portkey', 'ai-gateway', timestamptz '2026-09-01' + interval '0 second'),
  ('portworx', 'k8s-finops', timestamptz '2026-09-01' + interval '0 second'),
  ('posthog', 'dev-work-tools', timestamptz '2026-09-01' + interval '0 second'),
  ('profound', 'gtm', timestamptz '2026-09-01' + interval '0 second'),
  ('radixark', 'inference', timestamptz '2026-09-01' + interval '0 second'),
  ('raft', 'agent-harness', timestamptz '2026-09-01' + interval '0 second'),
  ('railway', 'cloud-network', timestamptz '2026-09-01' + interval '0 second'),
  ('ramp', 'fintech', timestamptz '2026-09-01' + interval '0 second'),
  ('reducto', 'agent-memory', timestamptz '2026-09-01' + interval '0 second'),
  ('render', 'cloud-network', timestamptz '2026-09-01' + interval '0 second'),
  ('replit', 'coding-agents', timestamptz '2026-09-01' + interval '0 second'),
  ('resend', 'dev-work-tools', timestamptz '2026-09-01' + interval '0 second'),
  ('runta', 'agent-runtime', timestamptz '2026-09-01' + interval '0 second'),
  ('scaleops', 'k8s-finops', timestamptz '2026-09-01' + interval '0 second'),
  ('scaleway', 'cloud-network', timestamptz '2026-09-01' + interval '0 second'),
  ('shopify', 'dev-work-tools', timestamptz '2026-09-01' + interval '0 second'),
  ('skypilot', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second'),
  ('snyk', 'security', timestamptz '2026-09-01' + interval '0 second'),
  ('solo-io', 'cloud-network', timestamptz '2026-09-01' + interval '0 second'),
  ('spacelift', 'platform-eng', timestamptz '2026-09-01' + interval '0 second'),
  ('steadybit', 'observability', timestamptz '2026-09-01' + interval '0 second'),
  ('stripe', 'fintech', timestamptz '2026-09-01' + interval '0 second'),
  ('supabase', 'database', timestamptz '2026-09-01' + interval '0 second'),
  ('tavily', 'search', timestamptz '2026-09-01' + interval '0 second'),
  ('tensorpool', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second'),
  ('tinyfish', 'browser-use', timestamptz '2026-09-01' + interval '0 second'),
  ('together-ai', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second'),
  ('traefik', 'cloud-network', timestamptz '2026-09-01' + interval '0 second'),
  ('trigger-dev', 'agent-harness', timestamptz '2026-09-01' + interval '0 second'),
  ('union-ai', 'agent-harness', timestamptz '2026-09-01' + interval '0 second'),
  ('upbound', 'platform-eng', timestamptz '2026-09-01' + interval '0 second'),
  ('upwind', 'security', timestamptz '2026-09-01' + interval '0 second'),
  ('vcluster', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second'),
  ('vercel', 'coding-agents', timestamptz '2026-09-01' + interval '0 second'),
  ('inferact', 'inference', timestamptz '2026-09-01' + interval '0 second'),
  ('wiz', 'security', timestamptz '2026-09-01' + interval '0 second'),
  ('zep', 'agent-memory', timestamptz '2026-09-01' + interval '0 second'),
  ('zesty', 'k8s-finops', timestamptz '2026-09-01' + interval '0 second'),
  ('nile', 'gtm', timestamptz '2026-09-01' + interval '0 second'),
  ('hiddenlayer', 'security', timestamptz '2026-09-01' + interval '0 second'),
  ('wonderful', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second'),
  ('wonderful', 'platform-eng', timestamptz '2026-09-01' + interval '1 second'),
  ('lambda', 'ai-cloud', timestamptz '2026-09-01' + interval '0 second')
on conflict do nothing;

-- 2. staged_batches — products a digest reply selected, awaiting 发布 / 取消.
--
-- Replaces data/pending/. Only scripts/inbox-poll.mjs touches it, with the
-- service-role key, so RLS is on with no policy: anon can neither read nor write.

create table if not exists public.staged_batches (
  conversation text primary key,
  created      date   not null default current_date,
  products     text[] not null
);

alter table public.staged_batches enable row level security;
