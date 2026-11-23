# hero-txt: How your top competitors attract their target audience

A library of hero section copy collected from live product websites.

Each entry records the headline and sub-headline shown on a product's homepage, together with a screenshot of the page at the time of capture. When a site changes its copy, the earlier version is retained. Every entry holds its three most recent versions, which makes it possible to see when and how a product changed its positioning.

Currently 124 products across 20 categories. Last updated 2026-11-17.

## Browsing
The rendered library, with screenshots, is at [herotxt.page](https://www.herotxt.page/). This `README` lists the same entries as plain text.

## Agent skill
The library doubles as an agent skill at `.opencode/skills/hero-txt/`. `SKILL.md` explains how to research, draft, and pressure-test hero copy, and the catalog is bundled beside it. Agents that read `SKILL.md` — OpenCode, Claude Code, and compatible tools — can use the folder directly; copy it into `~/.config/opencode/skills/` or `~/.claude/skills/` for global use.

`node scripts/build-skill.mjs` regenerates the bundled data and catalog. The weekly backup runs it with the README build, so the skill stays in step with the library.

## Data
Entries live in a Supabase database, with screenshots in Supabase Storage. A weekly backup exports them to data/products/ as JSON, one file per product. Each record holds the product name, homepage URL, category, current headline and sub-headline, capture date, screenshot URL, and previous versions.

This `README` is generated from that data. Edit the database, not the Markdown or the JSON — both are overwritten by the next backup.

## Contributing
To suggest a product that is missing, open an issue with the product name and its homepage URL.

## Attribution
Screenshots belong to their respective owners and are included here for reference and commentary.

<!-- The generated category sections and product entries follow below. -->

## Contents

**AI & Agents**  
- [Inference & Model Serving](#inference--model-serving) (6)
- [AI Cloud & GPU Infrastructure](#ai-cloud--gpu-infrastructure) (10)
- [Agent Runtime & Dev Sandboxes](#agent-runtime--dev-sandboxes) (4)
- [Agent Harness & Frameworks](#agent-harness--frameworks) (10)
- [Coding Agents & App Builders](#coding-agents--app-builders) (5)
- [Agent Memory & Knowledge](#agent-memory--knowledge) (7)
- [Browser Use & Web Agents](#browser-use--web-agents) (5)
- [AI Gateway & Routing](#ai-gateway--routing) (3)
- [Search & Retrieval APIs](#search--retrieval-apis) (2)
- [Agent Eval & LLM Observability](#agent-eval--llm-observability) (5)

**Cloud & DevOps**  
- [Cloud, App & Agent Security](#cloud-app--agent-security) (9)
- [Observability & Incident Response](#observability--incident-response) (8)
- [CI/CD & Software Delivery](#cicd--software-delivery) (8)
- [Platform Engineering & IaC](#platform-engineering--iac) (7)
- [Kubernetes Ops & Cloud FinOps](#kubernetes-ops--cloud-finops) (8)
- [Cloud Platforms & Networking](#cloud-platforms--networking) (8)
- [Databases & Vector Stores](#databases--vector-stores) (4)
- [Developer & Work Tools](#developer--work-tools) (7)

**Business & GTM**  
- [Payments & Spend](#payments--spend) (3)
- [GTM & Revenue Tools](#gtm--revenue-tools) (5)

## Inference & Model Serving

_Run open models as an API — throughput, latency, and cost per token._

### [Baseten](https://www.baseten.co/)
- **Headline:** The open frontier is built on Baseten
- **Sub-headline:** Baseten brings inference, training, and execution together on one platform to power the fastest growing companies in the world.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Inference is everything
  The fastest model runtimes, cross-cloud high availability, and seamless developer workflows. Powered by the Baseten Inference Stack.

</details>

### [DeepInfra](https://deepinfra.com/)
- **Headline:** LOW-COST AI Inference
- **Sub-headline:** Accelerate your AI with developer-friendly APIs designed for performance and cost-efficiency.
- **Updated:** 2026-08-29

### [Fireworks AI](https://fireworks.ai/)
- **Headline:** Intelligence is power. Own yours.
- **Sub-headline:** One platform to run, ensemble, and train open models with world-class researchers and uncompromising quality.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-30** — Own your model. Own your future.
  Fireworks' SoTA training and inference take you beyond the frontier, transforming open models into your specialized intelligence.

</details>

### [Modal](https://modal.com/)
- **Headline:** The platform for production AI
- **Sub-headline:** Cloud infrastructure for teams that develop, train, and serve AI applications at scale.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — AI infrastructure that developers love
  Run inference, training, batch processing, and sandboxes with sub-second cold starts, instant autoscaling, and a developer experience that feels local.

</details>

### [RadixArk](https://www.radixark.com/)
- **Headline:** Serve and train open models at frontier scale
- **Sub-headline:** Serve AI models with high throughput and low latency. Post-train them with RL on your own data. Choose the deployment setup that fits your workload.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — SHIP AI FOR ALL

</details>

### [vLLM by Inferact](https://vllm.ai/)
- **Headline:** The High-Throughput and Memory-Efficient inference and serving engine for LLMs
- **Sub-headline:** Easy, fast, and cost-efficient LLM serving for everyone.
- **Updated:** 2026-08-30

## AI Cloud & GPU Infrastructure

_Rent the machines that training and inference run on._

### [Akash](https://akash.network/)
- **Headline:** The Open Cloud for AI's Next Frontier
- **Sub-headline:** Tap into global GPU power at a fraction of the cost.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — The World's Premier Decentralized Compute Marketplace
  Akash is an open network that lets users buy and sell computing resources securely and efficiently. Purpose-built for public utility.

</details>

### [Anyscale](https://www.anyscale.com/)
- **Headline:** Foundation Model builders scale and training workloads on Anyscale
- **Sub-headline:** Powered by Ray, the world's most widely adopted AI compute engine.
- **Updated:** 2026-08-31

### [CoreWeave](https://coreweave.com/)
- **Headline:** CoreWeave The Essential Cloud for AI™
- **Sub-headline:** One AI Cloud platform, fully integrated, built to turn every pioneers’ most complex AI workloads into shipped products that accelerate human discovery
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — CoreWeave Cloud: The Essential Cloud for AI
  The force multiplier for AI. Trusted by the world's leading AI pioneers.

</details>

### [GMI Cloud](https://www.gmicloud.ai/)
- **Headline:** One cloud for compute, inference, and agents.
- **Sub-headline:** AI infrastructure built for production scale — GPU clusters, optimized inference, and agent runtime on one unified cloud.
- **Updated:** 2026-08-30

### [Lambda](https://lambdalabs.com)
- **Headline:** Supercomputers for training and inference
- **Sub-headline:** The Superintelligence Cloud
- **Updated:** 2026-10-10

### [Nebius](https://nebius.com/)
- **Headline:** The Ultimate AI Cloud
- **Sub-headline:** Build and scale AI faster on a cloud engineered from silicon to API.
- **Updated:** 2026-08-30

### [SkyPilot](https://skypilot.ai/)
- **Headline:** Your AI infrastructure, frontier velocity
- **Sub-headline:** One platform for all your AI compute – Kubernetes, Slurm, 20+ clouds
- **Updated:** 2026-08-29

### [TensorPool](https://tensorpool.dev/)
- **Headline:** You focus on the models. We handle the infrastructure.
- **Sub-headline:** Train foundation models without thinking about infrastructure.
- **Updated:** 2026-08-31

### [Together AI](https://www.together.ai/)
- **Headline:** Build what's next on the AI Native Cloud
- **Sub-headline:** Full-stack AI platform, powered by cutting-edge research.
- **Updated:** 2026-08-29

### [vCluster](https://www.vcluster.com/)
- **Headline:** Run your AI cloud like a hyperscaler.
- **Sub-headline:** One platform to turn raw GPUs into every kind of cluster, from bare metal up to Kubernetes, Slurm, inference, and more.
- **Updated:** 2026-08-30

<details><summary>Previous versions</summary>

- **2024-09-26** — Building Blocks for Platform Creators
  Reduce Kubernetes cost with virtual K8s clusters

</details>

## Agent Runtime & Dev Sandboxes

_Isolated environments where agents (and developers) execute untrusted code._

### [Coder](https://coder.com/)
- **Headline:** Your developers have guardrails. Your AI doesn't.
- **Sub-headline:** Safely run your favorite AI, agents, and enterprise development on your own infrastructure.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Click ~~README~~ to get started
  Developers can instantly launch fully configured cloud development environments and make their first commit in minutes. No need to traverse README files or await onboarding queues.

</details>

### [Daytona](https://www.daytona.io/)
- **Headline:** Run AI Code.
- **Sub-headline:** Secure and Elastic Infrastructure for Running Your AI-Generated Code.
- **Updated:** 2026-08-29

### [E2B](https://e2b.dev/)
- **Headline:** EVERY AGENT GETS A MACHINE
- **Sub-headline:** E2B runs the isolated machine your agent works on. You ship the agent. We run the infrastructure. Our cloud or yours.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — AI Sandboxes for Deep Research Agents
  Open-source, secure environment with real-world tools for enterprise-grade agents.

</details>

### [Runta](https://runta.com/)
- **Headline:** Run AI agents with lower costs and tighter control.
- **Sub-headline:** Secure runtimes that reduce token usage, protect credentials, and govern network access.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Runta is your execution layer for AI agents.
  Catch your agents wasting tokens. Never hand them your real credentials.

</details>

## Agent Harness & Frameworks

_The scaffolding that turns a model into an agent: loops, tools, orchestration._

### [Composio](https://composio.dev/)
- **Headline:** Give your AI secure access to sk in minutes
- **Sub-headline:** /
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Everything your agents need to take action
  1,000+ integrations with just-in-time tool calls, secure delegated auth, sandboxed environments, and parallel execution.

</details>

### [Conductor](https://www.conductor.build/)
- **Headline:** Run a team of coding agents in the cloud.
- **Sub-headline:** /
- **Updated:** 2026-08-31

### [DeepSeek Harness](https://deepseek.com/harness/en/)
- **Headline:** DeepSeek Harness Ready to use. Right now.
- **Sub-headline:** Everyday tasks, coding, or your own harness—it starts here. DeepSeek Harness is now in public preview worldwide and open source, with composable plugins that extend what agents can do.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Everything is a plugin
  DeepSeek Harness is now in developer preview for agent harness developers worldwide — source code included.

</details>

### [Dify](https://dify.ai/)
- **Headline:** AI Agent Management Platform that Puts You in Control
- **Sub-headline:** Build an agent with one team, and scale across the enterprise. Choose your models and deployment environment, manage access, and monitor agent activity in real time.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — The Platform for Production-Ready Agentic Workflows.
  Build Agentic workflows, RAG pipelines, with rich AI model and tool support on one collaborative workspace. Deploy on cloud, VPC, or self-hosted, so teams move from prototype to production without rebuilding the stack.

</details>

### [LangChain](https://www.langchain.com/)
- **Headline:** Own your intelligence
- **Sub-headline:** Run, Improve, and Govern Agents with LangSmith
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Meet LangSmith Engine
  Smarter after every launch

</details>

### [Multica](https://multica.ai/)
- **Headline:** Turn Claude Code into a teammate.
- **Sub-headline:** One workspace for your team and its agents: assign the work, track it, and review it. You stay in control.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Your next 10 hires won't be human.
  Multica is an open-source platform that turns coding agents into real teammates. Assign tasks, track progress, compound skills — manage your human + agent workforce in one place.

</details>

### [n8n](https://n8n.io/)
- **Headline:** Build the agent. Understand its workflow.
- **Sub-headline:** n8n is the platform for agents and workflows you can follow. Open any step, see what it does, and explain to anyone who runs it.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — AI agents and workflows you can see and control
  Build visually, go deep with code, connect to anything. Every step of your agents' reasoning, traceable on the canvas. Deploy on your infrastructure or ours.

</details>

### [Raft](https://raft.build/)
- **Headline:** Where humans and AI agents build together.
- **Sub-headline:** The agent-native workspace for builders and teams.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Where humans and AI agents build together.
  For agent-native builders and teams. Build with Raft. Build with fun.

</details>

### [Trigger.dev](https://trigger.dev/)
- **Headline:** Build and deploy durable AI agents and workflows
- **Sub-headline:** Trigger.dev is the open source platform for building AI agents in TypeScript. Long-running tasks with retries, queues, AI observability, and elastic scaling.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Build and deploy fully-managed AI agents and workflows
  Trigger.dev is the platform for building AI workflows in TypeScript. Long-running tasks with retries, queues, observability, and elastic scaling.

</details>

### [Union AI](https://www.union.ai/)
- **Headline:** Build Data Factories on your Own Cloud
- **Sub-headline:** Union is the durable AI runtime your team owns. Turn your data into models, agents and apps with plain Python, on infrastructure you control. If a step fails, it picks up where it stopped.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — The durable AI runtime that runs in your cloud, not ours.
  One platform to build indestructible AI workflows, serve models, and orchestrate compute. Zero trust security guarantees your data and models never leave your infrastructure.

</details>

## Coding Agents & App Builders

_Describe software in English, get software back._

### [Cursor](https://cursor.com/)
- **Headline:** Cursor is your coding agent for building ambitious software.
- **Sub-headline:** /
- **Updated:** 2026-08-29

### [Kimchi](https://kimchi.dev/)
- **Headline:** AI Agents, governed at scale
- **Sub-headline:** A single platform to run AI agents across your engineering organization with consistent security, governance and cost controls at every step.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — The governed AI coding platform
  Give engineers autonomous coding agents without losing control of models, data, quality, or spend. Start serverless. Deploy in your VPC when ready.

</details>

### [Lovable](https://lovable.dev/)
- **Headline:** Build something Lovable
- **Sub-headline:** Bring a new product, internal tool, or entire company to life.
- **Updated:** 2026-08-29

### [Replit](https://replit.com/)
- **Headline:** What will you build?
- **Sub-headline:** Turn ideas into apps in minutes — no coding needed
- **Updated:** 2026-08-29

### [Vercel](https://vercel.com/)
- **Headline:** Agentic Infrastructure
- **Sub-headline:** For coding agents To ship apps and agents Automated by agents
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Agentic Infrastructure
  For coding agents · To ship apps and agents · Automated by agents

</details>

## Agent Memory & Knowledge

_Give agents something to remember between runs._

### [Cognee](https://www.cognee.ai/)
- **Headline:** Memory for Agents, Teams, and People
- **Sub-headline:** Connect Slack, GitHub, Linear to Cognee and help agents recall what your company knows.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Open Source Memory Platform for Agents
  Connect Slack, GitHub, Linear to Cognee and help agents recall what your company knows.

</details>

### [Evermind](https://evermind.ai/)
- **Headline:** EverMe : Your Memory and Knowledge across agents and devices.
- **Sub-headline:** Open EverMe on another device and pick up where you left off on your project.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — EverOS : Give Your AI Agent Self-evolving Memory.
  Turn stateless LLMs into intelligent agents that can truly remember. Maintain context across days, sessions, and platforms.

</details>

### [Glean](https://www.glean.com/)
- **Headline:** Complete context that makes AI work at enterprise scale.
- **Sub-headline:** /
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Elevate your AI expertise
  See how teams are deploying agents and building AI-native workflows to run real work.

</details>

### [Letta](https://www.letta.com/)
- **Headline:** Letta is an AI research lab in San Francisco building machines that learn. We envision a future where humans coexist with digital people: experiential agents that remember everything, learn continuously, and improve themselves over time.
- **Sub-headline:** /
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Letta is an AI research lab in San Francisco building machines that learn.
  We envision a future where humans coexist with digital people: experiential agents that remember everything, learn continuously, and improve themselves over time.

</details>

### [mem0](https://mem0.ai/)
- **Headline:** AI memory that persists across sessions and agents
- **Sub-headline:** Drop-in memory infrastructure for AI agents and apps. Context that persists. Built for production.
- **Updated:** 2026-08-29

### [Reducto](https://reducto.ai/)
- **Headline:** Turn documents into data.
- **Sub-headline:** The agentic document platform for leading AI teams who demand enterprise performance at scale. One platform for every document task.
- **Updated:** 2026-08-31

### [Zep](https://www.getzep.com/)
- **Headline:** Build agents that do the job right
- **Sub-headline:** Zep is the enterprise context layer for reliable agents, providing governed access to company knowledge and skills built from agent tasks.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-30** — Agent memory, at enterprise scale.
  Memory of users, the business, and work done. Managed, governed, and served at scale.

</details>

## Browser Use & Web Agents

_Let agents drive a real browser and read the live web._

### [Apify](https://apify.com/)
- **Headline:** 123,195 tools for your AI
- **Sub-headline:** Apify is a marketplace of ready-to-run tools for AI. Get real-time web data, track competitors, generate leads, monitor social media, and integrate your apps and agents.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — 65,824 tools for your AI
  Apify is the largest marketplace of trusted tools for AI. Get real-time web data, track competitors, generate leads, monitor social media, and integrate your apps and agents.

</details>

### [Browser Use](https://browser-use.com/)
- **Headline:** Browser agents and cloud browsers.
- **Sub-headline:** #1 browser agent on GitHub | Enterprise ready SOC 2, on-prem
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Agents that use the browser.
  Browser Use Agents finish the task. Browser Infrastructure powers your own agents.

</details>

### [Browserbase](https://www.browserbase.com/)
- **Headline:** Give your agents access to the whole web.
- **Sub-headline:** Browserbase makes the web as reliable and programmable as APIs
- **Updated:** 2026-08-29

### [Firecrawl](https://www.firecrawl.dev/)
- **Headline:** Give your AI agents web data and beyond
- **Sub-headline:** The web data API to search and scrape with access to more sources through Alexandria. It's also open source.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Power AI agents with clean web data
  The context API to search, scrape, and interact with the web at scale. It's also open source.

</details>

### [Tinyfish](https://www.tinyfish.ai/)
- **Headline:** Unlock the web for agents.
- **Sub-headline:** TinyFish agents fill out forms, work behind logins, research a topic, and monitor for meaningful changes.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Everything AI needs to use the web.
  Search the web, fetch clean content from any URL, run a real browser, and deploy agents. All from one API.

</details>

## AI Gateway & Routing

_One endpoint in front of many models — routing, fallbacks, keys, and spend._

### [LiteLLM](https://www.litellm.ai/)
- **Headline:** The AI Gateway for platform teams
- **Sub-headline:** Put your full AI stack behind one key. See who is driving spend, cap it before it runs, and send each request to the model that should handle it.
- **Updated:** 2026-08-31

### [OpenRouter](https://openrouter.ai/)
- **Headline:** The future is multi-model
- **Sub-headline:** Run all your AI workloads securely on one neutral platform, with the best model at the best intelligence per dollar.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — The Unified Interface For Every Model
  Better prices, better uptime, no subscriptions.

</details>

### [Portkey](https://portkey.ai/)
- **Headline:** Portkey is now PRISMA AIRS AI Gateway
- **Sub-headline:** Observe, govern, and secure every AI interaction across your enterprise. Now generally available.
- **Updated:** 2026-08-31

## Search & Retrieval APIs

_Web-scale search built to be read by a model rather than a person._

### [Exa](https://exa.ai/)
- **Headline:** The world's data for AI agents
- **Sub-headline:** Search the largest index of public web and private information.
- **Updated:** 2026-08-31

### [Tavily](https://www.tavily.com/)
- **Headline:** Connect your AI agents to the web
- **Sub-headline:** One secure API for real-time web access.
- **Updated:** 2026-08-31

## Agent Eval & LLM Observability

_Trace, score, and debug what the agent actually did._

### [Arize AI](https://arize.com/)
- **Headline:** The agent observability and evaluation platform.
- **Sub-headline:** Turn production signals into continual learning so your agents improve with every interaction.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — The continual learning platform for agents.
  The AI engineering platform for self-improving agents. Observe. Evaluate. Learn.

</details>

### [Braintrust](https://www.braintrust.dev/)
- **Headline:** Ship quality agents at scale
- **Sub-headline:** Discover patterns in production, turn them into evals, and improve quality with every release.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Ship quality agents at scale
  Surface patterns in production, turn them into evals, and improve quality with every release.

</details>

### [Langfuse](https://langfuse.com/)
- **Headline:** Open Source Agent Evals & Observability
- **Sub-headline:** Langfuse is one open platform for every AI call your company makes and every agent your teams build. Track usage and costs, trace and evaluate agents, and use production logs to ship better AI. Cloud or self-hosted.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-30** — Open Source Agent Evals & Observability
  Trace, evaluate, and improve AI agents with one open platform. Use production data to understand behavior, collaborate on fixes, and ship better quality at lower cost and latency.

</details>

### [LangSmith](https://www.langchain.com/langsmith)
- **Headline:** Know what your agents are really doing
- **Sub-headline:** LangSmith Observability gives you complete visibility into agent behavior.
- **Updated:** 2026-08-29

### [Milestone](https://mstone.ai/)
- **Headline:** The intelligence platform for AI native engineering
- **Sub-headline:** Connect AI spend, engineering output, quality, and governance to understand where AI creates value — and where it does not.
- **Updated:** 2026-08-31

## Cloud, App & Agent Security

_Find and fix risk across code, containers, cloud, and now agent identity._

### [Akeyless](https://www.akeyless.io/)
- **Headline:** Runtime Identity Security at Agentic Scale
- **Sub-headline:** Prevent credential abuse and stop unauthorized actions with unified secrets management, just-in-time access, and real-time AI agent controls
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Runtime Identity Security at Agentic Scale
  Securing 220B+ machine interactions, the Akeyless platform is built for the AI-driven era
- **2024-09-26** — Vaultless Secrets Management
  Centralize and secure credentials, certificates, and keys across your CI/CD pipeline, reducing both the cost and complexity of vault management.

</details>

### [ARMO](https://www.armosec.io/)
- **Headline:** Connecting the Dots Between {} Security
- **Sub-headline:** Zero-day and every day protection for your cloud applications with the first runtime behavioral Cloud Application Detection and Response (CADR) solution. A fully explainable & traceable runtime security story spanning the entire cloud technology stack.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Unifying AppSec, CloudSec and DevSec
  The only runtime-driven, open-source first, cloud security platform Powered by Kubescape & eBPF

</details>

### [Chainguard](https://www.chainguard.dev/)
- **Headline:** Prevent AI attacks with trusted open source
- **Sub-headline:** Eliminate malware and vulnerability risk across your containers, dependencies, CI/CD actions, and AI agent skills so your developers can just ship.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Secure-by-default open source software
  Hardened, secure, and production-ready builds that prevent AI attacks.
- **2024-09-26** — ~~Shift Left.~~ Start Left.
  Chainguard builds secure container images that eliminate CVEs from the start. Java, Python, and Go. Postgres, Redis and Nginx. And everything in between.Build faster? Or be more secure? Why not both.

</details>

### [ControlPlane](https://control-plane.io/)
- **Headline:** We secure the platforms the world runs on
- **Sub-headline:** Security at AI velocity: from threat model to hardened AI systems, without slowing delivery
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Cybersecurity consulting and advisory

</details>

### [HiddenLayer](https://hiddenlayer.com/)
- **Headline:** The most comprehensive security platform for AI
- **Sub-headline:** Backed by patented technology and industry-leading adversarial AI research, our platform provides AI Discovery, AI Supply Chain Security, AI Attack Simulation, and AI Runtime Security.
- **Updated:** 2026-09-15

### [Keycard](https://www.keycard.ai/)
- **Headline:** Runtime auth for agents
- **Sub-headline:** Give each agent its own identity, authority to act, and access to resources under your policy.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Control agent access to tools, APIs, and data
  See every action your agents take. Know exactly who authorized it.

</details>

### [Snyk](https://snyk.io/)
- **Headline:** Unleash AI Innovators — Securely
- **Sub-headline:** An independent security layer that continuously validates AI-generated code, governs development agents, and secures AI-native applications—so organizations can move fast with AI without losing control.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Develop fast. Stay secure.
  Snyk gives you the visibility, context, and control you need to work alongside developers on reducing application risk.

</details>

### [Upwind](https://www.upwind.io/)
- **Headline:** The Cloud & AI Security Platform
- **Sub-headline:** Combine the context of your cloud workloads, APIs, and agents with runtime intelligence to identify the most critical risks, build a plan to fix them, and catch new attacks in real time.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Cloud & AI Security from the Inside-Out.
  By combining agentless scanning and runtime sensors Upwind enables security developers and devops teams to see their Cloud & AI infrastructure in the same operating picture, remediate exactly what matters and stop attacks in real-time.
- **2024-09-26** — The Future of Cloud Security is Runtime
  Run faster and more securely with Upwind’s next-generation cloud security platform. Combine the power of cloud security posture with runtime context and realtime protection— enabling your security team to prioritize accurately and respond fast to your most critical risks.

</details>

### [Wiz](https://www.wiz.io/)
- **Headline:** Protect Everything You Build and Run
- **Sub-headline:** Wiz connects code, cloud, and runtime into a single security graph that provides the end-to-end context required to automate risk reduction and threat response, enabling security teams to operate at AI speed. AI alone doesn't make security faster. Context does.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Secure Everything You Build and Run in the Cloud
  Use the Wiz Cloud Security Platform to build faster in the cloud, enabling security, dev and devops to work together in a self-service model built for the scale and speed of your cloud development.

</details>

## Observability & Incident Response

_Know when production breaks, and why._

### [AXIOM](https://axiom.co/)
- **Headline:** The modern machine data platform.
- **Sub-headline:** Petabyte-scale, schema-less ingest on a fully managed event store, so you keep every byte without the operational cost of running it yourself.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Stop sampling, observe every event.
  100% of your data for every possible need: o11y, security, analytics, and new insights.

</details>

### [chronosphere](https://chronosphere.io/)
- **Headline:** Observability Built for Control
- **Sub-headline:** Chronosphere is the world's most reliable observability platform for microservices and containers. Find and fix
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Observability Built for Control
- **2024-09-26** — Observability with Control 10x more scalable/ 8x faster MTTR/ 0x overages
  Find and fix customer-impacting issues faster and stop paying for data you don’t use with the world’s most reliable observability platform.

</details>

### [Coralogix](https://coralogix.com/)
- **Headline:** The Telemetry Lake for Observability
- **Sub-headline:** Better, faster, lower cost. Complete Observability and SIEM for humans and agents.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — You can't observe the future with yesterday's architecture
  Go beyond dashboards with a true AI-native platform and a data lake built for observability. Turn agents into operators, and engineers into architects.
- **2024-09-26** — Modern architecture. Disruptive value.
  Observability and Security that scale with you.

</details>

### [incident.io](https://incident.io/)
- **Headline:** With great product, comes great reliability
- **Sub-headline:** The software reliability platform built to investigate, respond and prevent incidents, powered by AI that deeply understands your organization.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Move fast when you break things
  On-call, incident response and status pages all under one roof. So good, you'll break things on purpose.

</details>

### [logz.io](https://logz.io/)
- **Headline:** Innovate Faster, Recover Quicker, Get Automated Insights
- **Sub-headline:** with Smarter Observability Powered by Open 360 AI
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Modern Observability Powered by AI

</details>

### [Lumigo](https://lumigo.io/)
- **Headline:** Intelligent ✦ AI-Powered Observability
- **Sub-headline:** Better data, smarter AI—the only observability platform capturing payload requests for precise troubleshooting.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Intelligent AI-Powered Observability
  Better data, smarter AI—the only observability platform capturing payload requests for precise troubleshooting.
- **2024-09-26** — Solve complex microservice issues 80% faster
  The only platform that enriches in-context trace payloads and log correlation to troubleshoot at supersonic speeds

</details>

### [OpenSearch](https://opensearch.org/)
- **Headline:** The open engine for AI-powered search and observability
- **Sub-headline:** Index once, then search, retrieve, and analyze across everything you build and run. OpenSearch is open source that stays open: vendor-neutral, fully Apache 2.0 licensed from ingest to dashboard, and a project of the Linux Foundation.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — OpenSearchCon North America
  Where the future of open source search and observability is forged
- **2024-09-26** — Find the meaning in your data
  OpenSearch is an open-source, enterprise-grade search and observability suite that brings order to unstructured data at scale

</details>

### [Steadybit](https://steadybit.com/)
- **Headline:** The Enterprise Reliability Testing Platform
- **Sub-headline:** Find and fix reliability issues before they become a problem. Channel the power of Agentic Chaos Engineering at scale to protect revenue and ensure your apps are always on.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-10-17** — Build reliable systems ready for anything
  The Chaos Engineering tool that makes it easy and safe to test System Resilience

</details>

## CI/CD & Software Delivery

_Build, test, package, and ship code to production._

### [Blacksmith](https://blacksmith.sh)
- **Headline:** The fastest way to run your GitHub Actions
- **Sub-headline:** A dead simple, drop-in replacement that costs 60% less than GitHub runners:
- **Updated:** 2026-10-26

### [CircleCI](https://circleci.com/)
- **Headline:** Validate everything. Assume nothing.
- **Sub-headline:** Validate before you push. Spend less. Ship more.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Confidence in every deploy
  Engineering teams of all sizes use CircleCI to easily build, test, and deploy production-ready code.

</details>

### [cloudsmith](https://cloudsmith.com/)
- **Headline:** Artifact management and supply chain security for AI-driven development
- **Sub-headline:** Agents add dependencies faster than teams can review them. Cloudsmith checks every package, container, and model your developers and agents pull from public registries, blocks malicious or non-compliant ones, and logs what shipped where.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Control and security for your AI-driven software supply chain
  Your developers pull packages, containers, and ML models from registries you don't fully control. Cloudsmith checks every one for known vulnerabilities, malware, and license violations, blocks anything that fails your policy, and logs exactly what shipped where.
- **2024-09-26** — Liberate DevOps with fully managed, scalable artifact management
  Cut costs + speed up production, all while safeguarding the code teams pull + push. Boost productivity with high performance package distribution.

</details>

### [codefresh](https://codefresh.io/)
- **Headline:** Codefresh and Octopus
- **Sub-headline:** In February 2024, Octopus acquired Codefresh. Since then, we've brought together the best of both teams to tackle the hardest Continuous Delivery challenges for Kubernetes and Argo CD at enterprise scale.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — The GitOps Software Delivery Platform
  Enterprise-ready, Powered by Argo, Secure & scalable

</details>

### [DevCycle](https://devcycle.com/)
- **Headline:** Speed Up Feature Releases
- **Sub-headline:** The first open standards feature management platform built to help developers ship faster
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Life's short. Stop building your own feature flags.
  Upgrade to DevCycle, the feature flag platform built on the OpenFeature standard and supported by industry experts.

</details>

### [Docker](https://www.docker.com/)
- **Headline:** Trust Docker for the Agents You Don’t
- **Sub-headline:** Docker securely contains autonomous agents so you can confidently build, ship, and run on trust.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-30** — Accelerate agent adoption, safely.
  Full autonomy for any agent. Full confidence for your security team.
- **2024-09-26** — Develop faster. Run anywhere.
  Docker helps developers build, share, run, and verify applications anywhere — without tedious environment configuration or management.

</details>

### [Harness](https://www.harness.io/)
- **Headline:** Your software factory from idea to production
- **Sub-headline:** Harness is the Autonomous SDLC Platform that ships AI code as fast as it's written, catches risk before it ships, and governs every pipeline.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Your harness for the autonomous SDLC
  Harness is the Autonomous SDLC Platform — it ships AI code as fast as it's written, catches risk before it ships, and governs every pipeline.
- **2024-09-26** — The AI-Native Software Delivery Platform
  Achieve engineering excellence and improve developer experience with the world's first AI-native software delivery platform.

</details>

### [Octopus Deploy](https://octopus.com/)
- **Headline:** AI is accelerating development. Can your governance keep up?
- **Sub-headline:** Octopus Deploy is the CD platform built for enterprise scale. When change accelerates, knowing who deployed what, where, and when isn't optional.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Deploy your software to multi-cloud, hybrid, and on-premises environments with ease
  Make your complex deployments simple, reliable, and auditable with Octopus Deploy.

</details>

## Platform Engineering & IaC

_Paved paths and declarative infrastructure for internal developer platforms._

### [Cortex](https://www.cortex.io/)
- **Headline:** Code is no longer the bottleneck. Everything else is.
- **Sub-headline:** /
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Code is no longer the bottleneck. Everything else is.
  The Engineering Operations Platform engineering leaders trust to ship faster as AI multiplies output, without risk to reliability and security.
- **2024-09-26** — Unblock Engineers. Unlock Productivity.
  Cortex is the Internal Developer Portal eliminating “developer tax” with paved paths to production. Create, catalog, score, and drive action to continuously improve software.

</details>

### [Diagrid](https://www.diagrid.io/)
- **Headline:** Durable Execution for Workflows and Agents
- **Sub-headline:** Add reliability, visibility and automated recovery to your apps, workflows, and AI agents. Runs in the cloud or on-prem. Works with LangGraph, CrewAI, Google ADK, AWS Strands, OpenAI Agents, and more.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Durable execution, now built for agents.
  Durable workflows and verifiable execution — workflows are always carried to completion: agents recover without losing state. Every step is cryptographically attested. Works with any agent framework.
- **2024-09-26** — APIs for building secure & reliable microservices
  dapr allows you to build state-of-the-art apps in half the time and never worry about missing a deadline or delivering insecure & unreliable code

</details>

### [env0](https://www.env0.com/)
- **Headline:** Infrastructure that governs itself.
- **Sub-headline:** env zero automatically enforces every policy and guardrail against what is actually running in your cloud. Loved by platform teams, chosen by CISOs.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Govern Your Cloud at the Speed of AI.
  Continuously unify declared state and discovered state into a single context lake where agents can reason and take deterministic action.
- **2024-09-26** — Automate and Manage IaC at Scale, With Confidence
  Optimize and unify Infrastructure as Code operations across every framework: OpenTofu, Terraform, Pulumi, CloudFormation, Terragrunt, K8s and more.

</details>

### [Giant Swarm](https://www.giantswarm.io/)
- **Headline:** Platforms for your applications. And now for your agents.
- **Sub-headline:** Two products, one team behind them: 12+ years of running enterprise platforms in production.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-30** — The Curated Platform Stack
  10+ Years of Production Experience, Ready in a Day
- **2024-09-26** — Smarter Platform Engineering
  Platform teams of all sizes partner with Giant Swarm to increase developer productivity.

</details>

### [Spacelift](https://spacelift.io/)
- **Headline:** Ship infrastructure as fast as developers code
- **Sub-headline:** Modern development moves too fast for IaC alone. Spacelift orchestrates deployment and Day 2 operations in one platform, so developers ship fast, and platform teams stay in control.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Ship infrastructure as fast as developers code
  Modern development moves too fast for IaC. Spacelift fuses AI, IaC, and GitOps pipelines, so developers ship fast, and platform teams stay in control.
- **2024-09-26** — Govern/Provision/Configure with a single automated workflow
  Orchestrate Terraform, OpenTofu, Ansible and more to deliver secure, cost-effective, and high-performance infrastructure. Fast.

</details>

### [Upbound](https://www.upbound.io/)
- **Headline:** The infrastructure platform that runs itself.
- **Sub-headline:** One AI-native platform to build, run, and govern control planes across your entire estate, ready to serve both the engineers who run it and the AI systems increasingly acting on it.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Crossplane reinvented for the enterprise cloud
  Manage your entire cloud infrastructure — any cloud provider and any abstraction — from one single point of control, harnessing the power of Crossplane for the enterprise cloud.

</details>

### [Wonderful](https://wonderful.ai/)
- **Headline:** Accelerate AI transformation across the enterprise
- **Sub-headline:** Wonderful helps enterprises drive AI adoption to unlock their full potential.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-09-15** — Applied AI for the enterprise
  Wonderful helps enterprises accelerate AI adoption to unlock their full potential.

</details>

## Kubernetes Ops & Cloud FinOps

_Run Kubernetes well and stop overpaying for it._

### [CAST AI](https://cast.ai/)
- **Headline:** Kubernetes workloads, cloud and AI infrastructure, tuned together.
- **Sub-headline:** Cast AI continuously optimizes Kubernetes and the resources beneath it. Start read-only, automate when you're ready, and verify the results in production.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Application Performance and Kubernetes Automation. On autopilot.
  Cast AI turns Kubernetes workload, infrastructure, cost, and SLO signals into safe automated actions: rightsizing pods, scaling nodes, optimizing GPUs and Spot, and fixing issues without manual tuning.
- **2024-09-26** — Cut your cloud cost in half
  CAST AI is the leading Kubernetes automation platform that cuts AWS, Azure, and GCP customers’ cloud costs by over 50%.

</details>

### [DoiT](https://www.doit.com/)
- **Headline:** www.doit.com
- **Sub-headline:** Performing security verification
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Attribute Every AI Token to the Customer, Feature, and Agent Behind It
  AI spend is a black box. LLM Gateways show token totals but can't tell you who burned them. Attribute™ traces every token, inference, and training run back to the team, product, and customer that drove it.
- **2024-10-11** — Intelligence to optimize your cloud
  DoiT’s cloud development platform ensures your AWS, Google Cloud, and Microsoft Azure infrastructure is working optimally for your business – from planning to production.

</details>

### [komodor](https://komodor.com/)
- **Headline:** The Agentic Operations Platform for Production
- **Sub-headline:** Get started instantly with ready-to-run agentic workflows, bring your own agents, and run them all as one governed fleet. Every agent on the platform is continuously optimized to get faster, more accurate and cheaper with every run.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — The Autonomous AI SRE Platform For Your Entire Cloud-Native Stack
  Komodor detects, resolves, and prevents production issues in large-scale environments with 97%+ accuracy, while proactively eliminating the structural cloud waste other tools can't reach.
- **2024-09-26** — Kubernetes for Developers/DevOps/SREs/Teams/Humans/
  Simplify cluster management and troubleshooting to unlock the full value of K8s, and drive innovation at scale.

</details>

### [Kubecost](https://www.kubecost.com/)
- **Headline:** IBM Kubecost
- **Sub-headline:** Run fast. Spend smart.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Monitor & reduce Kubernetes spend
  Kubecost provides real-time cost visibility and insights for teams using Kubernetes, helping you continuously reduce your cloud costs.

</details>

### [nOps](https://www.nops.io/)
- **Headline:** Automated AI & Cloud Cost Optimization
- **Sub-headline:** Industry-leading cloud savings without operational overhead or long-term commitment risk
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-10-17** — Al-Powered AWS FinOps Platform
  Discover how much you can save in just 10 minutes!

</details>

### [Portworx](https://portworx.com/)
- **Headline:** Leading Kubernetes Data Management
- **Sub-headline:** Automate, protect, and unify data for modern applications across any on-premises, public, or hybrid cloud environment
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Kubernetes Storage & Data Management
  Automate, protect, and unify data for modern applications across any on-premises, public, or hybrid cloud environment

</details>

### [ScaleOps](https://scaleops.com/)
- **Headline:** Autonomous Orchestration for AI Infrastructure
- **Sub-headline:** Trusted by 100s of Enterprises to Autonomously Orchestrate Their Production Infrastructure
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-30** — The Autonomous Compute Orchestration Layer Powering Cloud&AI Infrastructure
  Context-aware automation that continuously manages infrastructure for every app, agent, and model in production. Real-time CPU, memory, GPU, storage, and network management without manual tuning or performance tradeoffs.
- **2024-10-17** — Automated Kubernetes Resource Optimization
  Reduce your K8s costs by up to 80% using automatic optimization to pods and nodes to meet real-time demand without sacrificing performance.

</details>

### [Zesty](https://zesty.co/)
- **Headline:** Kubernetes Resource Management on Autopilot.
- **Sub-headline:** Zesty automatically adapts compute, storage, and GPU resources to changing workload demands within your guardrails. Cut costs, protect performance, and free your team from constant resource management.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Stop Paying for Resources You Don't Use.
  Zesty automatically rightsizes Kubernetes resources to match real-time workload demand, cutting infrastructure costs without risking your SLOs.
- **2024-09-26** — Cut cloud spend, scale smarter.
  One platform to automate & streamline cloud infrastructure optimization.

</details>

## Cloud Platforms & Networking

_The compute underneath, and the traffic routed across it._

### [DigitalOcean](https://www.digitalocean.com/)
- **Headline:** AI-Native Cloud
- **Sub-headline:** One integrated platform, silicon to agent, with economics that improve as you scale.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Learn here. Dream here. Develop here.
  Powerful and production-ready, our cloud platform has the solutions that devs like you need to succeed—whether you're building world-changing AI apps, running a side project, or building a business.

</details>

### [Isovalent](https://isovalent.com/)
- **Headline:** Connect and Secure Kubernetes. And Beyond.
- **Sub-headline:** Enterprise-grade Kubernetes networking and security
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — eBPF-based networking, security, and observability
  Isovalent Enterprise for Cilium enables cloud native networking, security, and observability.

</details>

### [Mirantis](https://www.mirantis.com/)
- **Headline:** Mirantis k0rdent AI Takes You FROM ZERO TO AI CLOUD IN DAYS, JUST ADD HARDWARE
- **Sub-headline:** /
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — FROM ZERO TO AI CLOUD IN DAYS, JUST ADD HARDWARE
- **2024-09-26** — CONTROL YOUR STRATEGIC INFRASTRUCTURE WITH OPEN SOURCE
  Move from VMware to truly open and flexible infrastructure that radically lowers your IT costs

</details>

### [Railway](https://railway.com/)
- **Headline:** Let agents ship products as fast as they write code
- **Sub-headline:** Build, test, deploy, and improve your entire product in one loop, with your agents.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Ship software peacefully
  With the all-in-one intelligent cloud provider

</details>

### [Render](https://render.com/)
- **Headline:** Your fastest path to production for any workload
- **Sub-headline:** Intuitive infrastructure to scale any app or agent from your first user to your billionth.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Your fastest path to production for APIs & web apps
  Intuitive infrastructure to scale any app or agent from your first user to your billionth.

</details>

### [Scaleway](https://www.scaleway.com/en/)
- **Headline:** European Cloud & AI.
- **Sub-headline:** Build on a secure, transparent, and fast-moving cloud & AI platform built for what's next.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Europe's empowering cloud provider
  Build, train, deploy and scale AI models and intelligent applications on a resilient and sustainable cloud ecosystem.

</details>

### [Solo.io](https://www.solo.io/)
- **Headline:** Infrastructure for Production-grade AI Agents
- **Sub-headline:** Solo gives enterprises the runtime, connectivity, and governance controls to bring AI agents to production safely.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — Reimagining infrastructure for cloud & AI
  Solo is the unified platform for secure, seamless cloud operations — built to power the next generation of intelligent AI agents.
- **2024-09-26** — Connect, Observe, Secure APIs in the Cloud Native Era
  Solo.io is the leading provider of API gateway, service mesh, & internal developer portal solutions

</details>

### [Traefik](https://traefik.io/)
- **Headline:** Unified Control Plane for APIs, Models, and Agents
- **Sub-headline:** Eliminate fragmentation and unify governance for any workload, anywhere.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-09-26** — Run APIs Easily. Anywhere.
  Cloud-native, GitOps-driven API runtime solutions for demanding DevOps and Platform Engineers with diverse use-cases, environments, and deployment models.

</details>

## Databases & Vector Stores

_Where the application state — and increasingly the embeddings — lives._

### [Milvus](https://milvus.io/)
- **Headline:** The High-Performance Vector Database Built for Scale
- **Sub-headline:** Milvus is an open-source vector database built for GenAI applications. Install with pip, perform high-speed searches, and scale to tens of billions of vectors with minimal performance loss.
- **Updated:** 2026-08-31

### [neo4j](https://neo4j.com/)
- **Headline:** The knowledge layer that makes AI SCALABLE
- **Sub-headline:** Go ahead. Go big.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-29** — The knowledge layer that makes AI trustworthy
  Lower cost. Reduce risk. Inform decisions.
- **2024-09-26** — GenAI apps, grounded in your data
  Power your applications with knowledge graphs. Backed by the only graph database with vector search.

</details>

### [Pinecone](https://www.pinecone.io/)
- **Headline:** Give agents memory
- **Sub-headline:** The trusted AI knowledge platform where fast, accurate retrieval doesn't get more expensive as it scales.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Give agents knowledge
  The knowledge platform for AI agents. Fast, accurate retrieval that doesn't get more expensive as it scales.

</details>

### [Supabase](https://supabase.com/)
- **Headline:** Build in a weekend Scale to millions
- **Sub-headline:** Start your project with a Postgres database. Add Authentication, Data APIs, Edge Functions, Realtime Data, Storage, and Vector embeddings.
- **Updated:** 2026-08-31

## Developer & Work Tools

_Everyday software for building and running a business._

### [AgentMail](https://www.agentmail.to/)
- **Headline:** Email Inboxes for AI agents
- **Sub-headline:** We're not AI for your email, we're email for your AI
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Email Inboxes for AI Agents
  AgentMail is the email inbox API for AI agents. It gives agents their own email inboxes, like Gmail does for humans.

</details>

### [JetBrains](https://www.jetbrains.com/)
- **Headline:** jetbrains air is one system for building software with agents
- **Sub-headline:** /
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-30** — Building the Integral Development Experience
  An open platform for agentic software development — with you in control
- **2024-09-26** — Make Your Software Vision a Reality
  Pro tools created with {developers}, teams, and  businesses in mind

</details>

### [Notion](https://www.notion.com/)
- **Headline:** Where teams and agents Think together.
- **Sub-headline:** Capture context, find answers, and automate tasks with AI built for your team.
- **Updated:** 2026-08-29

### [Otter.ai](https://otter.ai)
- **Headline:** Your AI notetaker is now also your Conversational Knowledge Engine
- **Sub-headline:** Otter transcribes every meeting, turning it into searchable knowledge that powers your workflow.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-10-26** — Meeting AI that turns talk into action
  Transcription. Pre-call briefs. Live coaching. Automatic follow-ups.

</details>

### [PostHog](https://posthog.com/)
- **Headline:** Your product's context layer
- **Sub-headline:** PostHog ingests and stores your analytics, errors, replays, and business data so you and your agents can query and act on it.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Shift your product into self-driving mode
  PostHog already knows your customers, which features they use, and the issues they have.

</details>

### [Resend](https://resend.com/)
- **Headline:** Email for developers
- **Sub-headline:** The best way to reach humans instead of spam folders. Deliver transactional and marketing emails at scale.
- **Updated:** 2026-08-31

### [Shopify](https://www.shopify.com/)
- **Headline:** Be the next household name
- **Sub-headline:** Dream big and build fast on Shopify. The world's best commerce platform.
- **Updated:** 2026-08-29

<details><summary>Previous versions</summary>

- **2024-10-17** — Be the next big thing/one to watch/category creator/unicorn startup/household name/global empire/solo flier/store they line up for/
  Dream big, build fast, and grow far on Shopify.

</details>

## Payments & Spend

_Moving money: checkout, cards, and the ledger behind them._

### [Mesh Pay](https://www.meshpay.com/)
- **Headline:** Global money movement. One network.
- **Sub-headline:** Move money instantly between local currencies, stablecoins and crypto. Accept payments, fund accounts, convert and settle across currencies, and send payouts globally over local rails like Pix, SPEI and GCash - connecting 300+ wallets and exchanges to traditional finance through a single integration.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — The first global crypto payments network
  Accept crypto from 300+ wallets and exchanges. Settle in stablecoins or local currency. One integration.

</details>

### [Ramp](https://ramp.com/)
- **Headline:** Time is money. Save both.
- **Sub-headline:** Cards, expenses, bill payments, and banking* – in the blink of AI.
- **Updated:** 2026-08-31

### [Stripe](https://stripe.com/)
- **Headline:** Financial infrastructure to grow your revenue.
- **Sub-headline:** Accept payments, handle business banking,¹ and implement custom revenue models—from your first transaction to your billionth.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Financial infrastructure to grow your revenue.
  Accept payments, offer financial services, and implement custom revenue models—from your first transaction to your billionth.

</details>

## GTM & Revenue Tools

_Finding buyers and getting found — pipeline, enrichment, and AI-era visibility._

### [Apollo](https://www.apollo.io/)
- **Headline:** The AI sales platform for smarter, faster revenue growth
- **Sub-headline:** Build pipeline smarter, close deals faster, and simplify your tech stack with a unified platform built for modern sales and marketing teams.
- **Updated:** 2026-08-31

### [Clay](https://www.clay.com/)
- **Headline:** Build systems to grow revenue
- **Sub-headline:** Infrastructure to get any data, run agentic workflows, and launch GTM plays.
- **Updated:** 2026-08-31

### [Lightfield](https://lightfield.app/)
- **Headline:** CRM engineered for the future
- **Sub-headline:** Lightfield updates itself from every customer interaction, so its agents can run outbound, flag deals at risk, and tell you where to focus next.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Agentic CRM for forward-deployed companies

</details>

### [Nile](https://nile.app/)
- **Headline:** Control how AI agents shop your brand
- **Sub-headline:** Nile is the agentic commerce stack: your catalog, pricing, and checkout, served to every AI agent exactly the way you define it.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-09-07** — Your brand, represented on every AI
  Nile gives your brand its own AI salesperson — selling inside ChatGPT, Gemini, Perplexity, and every AI your customers ask what to buy.

</details>

### [Profound](https://www.tryprofound.com/)
- **Headline:** The AI marketing platform to win in
- **Sub-headline:** Multiply what you can accomplish with an AI Marketer trained on what consumers prompt, what agents cite, and the context only your teams have.
- **Updated:** 2026-11-17

<details><summary>Previous versions</summary>

- **2026-08-31** — Marketing agents to win in Perplexity
  Reach millions of consumers who are using AI to discover new products and brands

</details>
