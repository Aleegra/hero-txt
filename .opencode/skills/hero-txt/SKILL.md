---
name: hero-txt
description: Write, critique, or rewrite a website hero section — the headline and subheadline visitors see first. Use for homepage headlines, first-screen messaging, taglines, positioning, and competitor headline research, or when the user mentions hero copy, 首屏文案, 主标题, 副标题, or slogan. Includes a dated library of real AI, developer, and B2B product sites, with earlier versions where companies repositioned.
license: CC0-1.0
---

# hero-txt

A working library of 120+ real hero sections, captured from live product sites between August and October 2026. Each entry keeps the headline, subheadline, capture date, source URL, and up to two earlier versions. Use the examples as evidence for a direction, not as lines to paste.

## Load order

1. Read `references/patterns.md` — the playbook distilled from the whole library.
2. Query for close comparables with `scripts/query.mjs`.
3. Open `references/catalog/<group>.md` only when you need the full set for one group. Prefer the query script; it keeps context small.

Run commands from this skill's base directory (the path reported when the skill loads). Node 18+; nothing to install.

```bash
node scripts/query.mjs --search "agent memory" --limit 8
node scripts/query.mjs --category agent-memory
node scripts/query.mjs --group "Cloud & DevOps" --changed
node scripts/query.mjs --list-categories
```

Add `--json` when you want to post-process. `--changed` returns only products with more than one version; `--since 2026-09-01` narrows by last capture date.

## Workflow

### 1. Pin the brief

Extract five things: the product, the buyer, the job it does, the proof, and the tone. Ask only for what would change the copy. If the user has not named a product, ask for one sentence before writing.

Do not invent numbers, customers, or capabilities. If the brief has no proof, write a version that promises less, and say what proof would make a stronger one possible.

### 2. Pull precedents

Search by the job, not the user's category label. A developer-tool company may have more to learn from Stripe's revenue line than from another developer tool. Pull 5–8 examples, then choose two or three whose situation actually resembles the brief.

Use the "previous versions" in the results. A company that moved from a feature to a consequence is evidence about what stopped working.

### 3. Choose angles, not synonyms

Draft five genuinely different routes:

| Angle | Question it answers | Example from the library |
| ----- | ------------------- | ------------------------ |
| Outcome | What changes for the buyer? | Stripe — Financial infrastructure to grow your revenue. |
| Mechanism | How is it done differently? | Modal — AI infrastructure that developers love. |
| Enemy | What is the accepted way wrong? | Coder — Your developers have guardrails. Your AI doesn't. |
| Category | What is this, redefined? | Vercel — Agentic Infrastructure. |
| Proof | Why believe it now? | Apify — 65,824 tools for your AI. |

If two routes can share a headline with one noun swapped, they are the same route. Replace one.

### 4. Write to the house limits

- Headline: 3–10 words. Library median 6, 90th percentile 9.
- Subheadline: 10–30 words. Median 14, 90th percentile 28. It must add mechanism, proof, scope, or audience — not restate the headline.
- One claim per line. Sentence case unless the brand is all-caps.
- Prefer concrete nouns and verbs to adjectives. A number beats "leading"; a named mechanism beats "AI-powered".
- Put the product's job in the headline and the receipt in the subheadline.

Phrases that usually weaken a line: "AI-powered", "next-generation", "seamless", "all-in-one", "unlock", "supercharge", "revolutionize", "everything you need", "built for the future". Keep one only if it is the clearest true word, not by reflex.

### 5. Pressure-test

Score each route 1–5 on:

- **Clarity** — can an outsider say what it is after one read?
- **Specificity** — is there a number, named mechanism, or concrete job?
- **Credibility** — would a skeptic ask "says who?", and is there an answer nearby?
- **Differentiation** — could a competitor run the same line unchanged? If yes, it is not positioning.
- **Compression** — can any word go without losing meaning?

Kill any line that only makes sense after reading the subheadline. Kill any line that describes the category rather than the change.

### 6. Deliver

Lead with the recommended pair, then four alternates. For each: the angle, the line, why it works, and the closest library precedent with its capture date.

```markdown
**Recommended — Outcome**
> Headline
> Subheadline

Why: one sentence on the bet it makes.
Precedent: Stripe, 2026-08-31 — same move from product to revenue.
```

Then note what you would test, and what proof would make the sharpest version credible. Do not pad the answer with a strategy essay.

## Critique mode

When the user supplies existing copy, score it on the five dimensions above, quote the weakest phrase, and rewrite it twice: one safe version that keeps the current positioning, one sharp version that changes the bet. Explain the trade-off in a sentence.

## Copy hygiene

- Never lift a library line verbatim. If a draft is within a word or two of an entry, flag it and change the angle.
- Cite product names and dates when using an example. The library is a snapshot, not a claim about the current site.
- A subheadline of `/` in the source means the page had none; the data omits it rather than inventing one.
- Some captures are event pages, acquisition notices, or product renames (for example OpenSearchCon, Codefresh and Octopus, IBM Kubecost). They are records, not recommendations.
- Text is from public homepages. Product names and trademarks belong to their owners; the library data is CC0-1.0.
- If current copy matters, open the source URL. Captures age.
