# AI Component Plan — Enterprise Innovation & Delivery Hub (EIDH)

**Stack:** Node.js + React + Turso (libSQL) | **Status:** Recommendation (Draft — *to be configured*) | **Date:** 2026-08-23
**Scope:** An LLM-orchestrated AI layer that augments the CoE/ALM workflows in `enterprise-hub-spec.md`

---

## Table of Contents
1. [Recommendation Summary](#1-recommendation-summary)
2. [Guiding Principles](#2-guiding-principles)
3. [Module A — AI Intake & Prioritization Copilot](#3-module-a--ai-intake--prioritization-copilot)
4. [Module B — Requirements & Story Generator](#4-module-b--requirements--story-generator)
5. [Module C — Support & Triage Copilot](#5-module-c--support--triage-copilot)
6. [Module D — Executive Portfolio Intelligence](#6-module-d--executive-portfolio-intelligence)
7. [Cross-Cutting: "Ask the CoE" Knowledge Assistant](#7-cross-cutting-ask-the-coe-knowledge-assistant)
8. [Recommended Architecture](#8-recommended-architecture)
9. [Data Model Additions](#9-data-model-additions)
10. [API & Frontend Integration](#10-api--frontend-integration)
11. [Guardrails, Security & Cost Control](#11-guardrails-security--cost-control)
12. [Phased Rollout Plan](#12-phased-rollout-plan)
13. [Open Questions / TODOs](#13-open-questions--todos)
14. [Verification Checklist](#14-verification-checklist)

---

## 1. Recommendation Summary

> **Flagship feature:** **AI Intake & Prioritization Copilot** — because the spec already calls for an *auto-calculated* `projects.score` and a manual intake form (§7 Screen 4). AI can turn a rough request into a scored, de-duplicated, sized work item with a first-draft business case. This is the single highest-value, lowest-friction insertion point.

**Supporting features (build after the flagship, in this order):**

| # | Feature | Module | Value |
| --- | --- | --- | --- |
| 1 | Intake & Prioritization Copilot | Portfolio Command Center | Auto-score, de-dupe, draft description & business case |
| 2 | Requirements & Story Generator | Solution Factory | Generate user stories, acceptance criteria, break epics into tasks |
| 3 | Support & Triage Copilot | Lifecycle & Support Suite | Auto-prioritize, route, summarize, draft replies for tickets |
| 4 | Executive Portfolio Intelligence | Portfolio Command Center | Natural-language weekly/monthly portfolio digest & risk brief |
| 5 | **Ask the CoE** (RAG knowledge assistant) | Cross-cutting | Answer "has anything like this been built?" from project/requirement/comment history |

> **Recommendation rationale:** Every feature here plugs into an **existing** screen, table, or workflow — no new product surface is required. They are all **LLM-orchestrated** (structured output + Zod validation + human-in-the-loop), so no model training, MLOps, or heavy infra is needed. The chosen stack (Node/React/Turso) is fully compatible.

---

## 2. Guiding Principles

1. **Human-in-the-loop.** AI proposes; a human approves. Never let AI auto-create/deploy/close anything without an explicit confirm step. This is especially important for ALM actions (deployments, status changes, ticket closure).
2. **Structured output, validated.** Every AI call returns JSON validated by **Zod** against a shared schema. No free-form prose into the database.
3. **Explainability.** Every AI-generated `score`, `priority`, or recommendation must include a short **reasoning field** that is stored and shown to the user.
4. **Auditability.** Store the model, prompt version, and token usage per call in an audit table. Human edits are recorded separately from AI drafts.
5. **Deterministic fallback.** If the AI is unavailable, the app must still work — all AI features are additive, wrapped in try/catch with a graceful "AI unavailable" state.
6. **Provider-agnostic.** A thin abstraction so we can swap Azure OpenAI / Anthropic / OpenAI / local (Ollama) without touching feature code. The spec is provider-neutral; this is a config choice.
7. **Cost-aware.** Cache deterministic results, cap context, gate heavy calls (e.g. "generation" actions) behind a confirm, and add per-org usage budgets.

> **TODO (you fill in):** Choose provider + model per capability (e.g. `gpt-4o`/`claude-3-5`/`gpt-4o-mini`). Decide region/compliance (e.g. EU Data Boundary), and whether a vector store (pgvector/Turso + embeddings vs. a dedicated index) is required for the RAG feature.

---

## 3. Module A — AI Intake & Prioritization Copilot

**Plugs into:** §7 Screen 4 (Intake Form `/requests/new`) and §5 `projects` table (`score`, `priority`, `budget`).

### Capability
While the user fills the intake form (Title, BU, Description, Business Value 1–10, Effort T-shirt, Budget), an "✨ Enhance" button calls the AI to:

- **Draft/polish the description** from the raw title + notes.
- **Auto-score** the request using a transparent RICE / WSJF-inspired model (Reach × Impact × Confidence ÷ Effort), returning `{ score, breakdown, reasoning }`.
- **Suggest priority** (`low/medium/high/critical`) with rationale.
- **Detect duplicates** — semantically match the title/description against existing `projects` to warn "This looks similar to *Customer Care Portal* (EIDH-1042)."
- **Suggest a business case** — framed for the intake flow in §2.
- **Recommend a PM + budget range** based on similar past projects.

### UX
- Inline "✨ Enhance" button in the intake form; results populate as **editable drafts** (not final).
- A side panel shows the score breakdown ("Impact 8 × Reach 5 × Confidence 0.8 ÷ Effort 3 = **10.7**") and any duplicate warnings.
- On submit, the user's final `score`/`priority` override the AI draft; the AI draft + reasoning is stored for audit.

### Why it's the flagship
The `score` column already says *"Auto-calculated business value"* — today that's hand-derived. AI makes the *why* explicit (explainable scoring), which is exactly what executives need to trust the portfolio.

---

## 4. Module B — Requirements & Story Generator

**Plugs into:** §7 Screen 3 (Project Detail → Requirements tab) and §5 `requirements` table (`story`, `acceptance_criteria`, `type`, `status`).

### Capability
- **"As a… I want… So that…"** generation from a plain English description of a project/ticket.
- **Acceptance criteria** generation (Given/When/Then list).
- **Epic → task breakdown** — split an epic into `type='task'` subtasks.
- **Estimation hint** (T-shirt size) for discussion.
- **Resolution / summary suggestion** for the dev to draft when closing a requirement.

### UX
- "✨ Generate story" button on the Requirements tab opens a modal with a live draft + "Accept" / "Edit" / "Regenerate."
- Batch mode: paste a paragraph → get multiple ready-to-accept user stories.

---

## 5. Module C — Support & Triage Copilot

**Plugs into:** §7 Screen 5 (Support Desk `/support`) and §5 `support_tickets` table (`priority`, `status`, `sla_due_at`, `assignee_id`).

### Capability
- **Auto-triage** new tickets: classify `priority` (P1–P4), suggest `assignee_id` from the BU/expertise, and set a preliminary `sla_due_at`.
- **Summarize long threads** and highlight blockers.
- **Draft a reply** to the requester (tone: internal support).
- **Suggest a resolution** + mark likely-close based on similar resolved tickets.
- **SLA-risk flagging** — "This P2 is trending to breach in 3h" (replaces/augments the cron-based SLA check in §9.3).

### UX
- On the Support Desk table, an AI "Summarize thread" action per row.
- A triage panel on ticket detail where the human **accepts or corrects** the suggested priority/assignee/SLA.

---

## 6. Module D — Executive Portfolio Intelligence

**Plugs into:** §7 Screen 1 (Executive Dashboard `/dashboard`) and the `score`/`status`/`budget` aggregations.

### Capability
- **Weekly/monthly digest** — a natural-language summary generated from the dashboard aggregates (status distribution, budget utilization, at-risk projects, P1 tickets).
- **Risk brief** — explain *why* a project is at risk ("Claims Automation is at risk because 2/3 sprints slipped and a P1 ticket is unassigned"), adding depth to the static At-Risk table.
- **Re-rank suggestions** — "Based on current scores, you may want to promote *Vendor Risk Scoring* ahead of *Claims Automation*."

### UX
- A "✨ Summarize" card at the top of the dashboard; the digest is persisted and can be emailed.
- At-risk rows get an AI "Explain" affordance.

---

## 7. Cross-Cutting: "Ask the CoE" Knowledge Assistant

**Plugs into:** All modules; the global header search box (§6 Global Layout).

### Capability
- A **RAG assistant** over `projects`, `requirements`, `comments`, `deployments`, and `support_tickets` (+ optional docs).
- Answers questions like: *"What's our biggest recurring incident pattern?"*, *"Has any team built a vendor-scoring app?"*, *"Which PMs have capacity this quarter?"*
- **Grounded answers with citations** to the underlying records (never invent data).

### UX
- Click the header search → switch to "Ask the CoE" mode → chat panel.
- Responses include linked entity references (e.g. `↳ EIDH-1042 Customer Care Portal`).

---

## 8. Recommended Architecture

```
src/ai shared package
├── provider/          ← provider abstraction (AzureOpenAI / Anthropic / OpenAI / Ollama)
│   ├── types.ts       ← ChatCompletionRequest/Response normalized
│   └── index.ts       ← getProvider() (env-driven)
├── prompts/           ← versioned prompt templates + prompt-version registry
├── schemas/           ← Zod output schemas (ScoreResult, StoryDraft, TicketTriage, …)
├── lib/
│   ├── structuredOutput.ts  ← enforces JSON + Zod validation + retries
│   ├── cache.ts             ← deterministic-result cache (Turso / in-memory)
│   ├── enricher.ts          ← pulls relevant context for the prompt (bounded)
│   └── audit.ts             ← logs model/promptVersion/tokens/duration
└── features/
    ├── intake.ts      ← Module A
    ├── stories.ts     ← Module B
    ├── triage.ts      ← Module C
    ├── executive.ts   ← Module D
    └── askCoe.ts      ← Module E (RAG)
```

### Flow for any feature
```
User action → [enricher] builds bounded context → [provider] call
    → [structuredOutput] Zod-validate JSON
    → (success) persist draft + reasoning + audit
    → (fail) retry once, then degrade gracefully
```

### Server integration
- New route group: `server/src/routes/ai.*` mounted under `/api/v1/ai/`.
- AI calls are **async** (queue non-blocking generation; poll or stream). Use Zod shared from the existing `shared/` schema package.

---

## 9. Data Model Additions

Add these Turso tables (see §5 of the spec):

```sql
-- AI INSIGHTS (persisted AI output, editable by humans)
CREATE TABLE ai_insights (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'project','requirement','ticket','dashboard'
  entity_id TEXT NOT NULL,
  kind TEXT NOT NULL,        -- 'score','story','triage','summary','explanation'
  content TEXT NOT NULL,     -- JSON payload (the human-editable draft)
  reasoning TEXT,            -- short explainability string
  status TEXT CHECK(status IN ('draft','accepted','rejected')) DEFAULT 'draft',
  created_by TEXT REFERENCES users(id),   -- the human who triggered it
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI AUDIT TRAIL
CREATE TABLE ai_audit_logs (
  id TEXT PRIMARY KEY,
  feature TEXT NOT NULL,          -- 'intake','stories','triage','executive','ask_coe'
  entity_type TEXT, entity_id TEXT,
  provider TEXT, model TEXT,
  prompt_version TEXT,
  input_tokens INTEGER, output_tokens INTEGER,
  latency_ms INTEGER,
  status TEXT CHECK(status IN ('ok','degraded','failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- KNOWN DUPLICATES (index for Module A duplicate detection)
CREATE TABLE project_similarity (
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  similar_project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  similarity REAL,               -- 0..1
  PRIMARY KEY (project_id, similar_project_id)
);
```

> **TODO:** For Module E (RAG), decide whether to use **local embeddings in Turso/SQLite** (simplest, edge-friendly) or an external vector store. Turso currently doesn't ship a full vector index; options are: (a) store embeddings + brute-force cosine, (b) add `pgvector`/`turso-vector`/`sqlite-vec`, or (c) use a managed vector DB. Recommend `sqlite-vec` for edge parity, or a managed vector DB if query volume grows.

---

## 10. API & Frontend Integration

### New endpoints (draft — see §8 of the spec for conventions)

| Method | Path | Feature | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/ai/intake/enhance` | A | Score + draft + duplicate check for intake |
| `POST` | `/api/v1/ai/requirements/generate` | B | Generate story + acceptance criteria |
| `POST` | `/api/v1/ai/tickets/triage` | C | Prioritize/route/summarize ticket |
| `POST` | `/api/v1/ai/tickets/summarize` | C | Summarize a long thread |
| `POST` | `/api/v1/ai/dashboard/summarize` | D | Portfolio digest / risk brief |
| `GET` | `/api/v1/ai/projects/:id/explain-risk` | D | Explain at-risk reasons |
| `POST` | `/api/v1/ai/ask` | E | RAG Q&A (grounded, cited) |
| `GET` | `/api/v1/ai/insights` | all | List AI drafts |
| `PATCH` | `/api/v1/ai/insights/:id` | all | Accept/reject an AI draft |

### Frontend
- A reusable `<AiGenerateButton feature="intake" onResult={...} />` component; results rendered as an editable form (never read-only).
- A global "✨ Ask CoE" chat invoked from the header search.
- A small `<AiReasoning disclosure="…" />` element to surface `reasoning` near any AI-generated value.

---

## 11. Guardrails, Security & Cost Control

1. **No autonomous writes.** AI never creates/deploys/closes records directly — it only produces drafts. All state changes require the authenticated user's confirm.
2. **RBAC parity.** AI endpoints inherit the same role checks as the module they augment (e.g. only `executive`/`pm` can generate portfolio digests). Enforce at the route + feature layer.
3. **Prompt injection defense.** Treat AI output as **untrusted**: never execute, never render as HTML, and never feed AI output back into prompts without sanitization. Entity references must come from a whitelisted lookup, not free-form.
4. **Data minimization.** The enricher sends only the minimal, necessary context — no PII beyond what's already in the app, and redaction for the anonymized/feedback entry points.
5. **PII / secret hygiene.** Never send `avatar_url`, auth tokens, or secrets to the provider.
6. **Cost & rate controls.** Per-org token/request budgets, request caching, streaming for long generations, and a simple mutation (reject any non-JSON output).
7. **Auditability & compliance.** Every call logged in `ai_audit_logs`; retain per org's data residency rules.

---

## 12. Phased Rollout Plan

> **Status:** Draft. Order is by value ÷ effort. Each phase ships independently.

### Phase 1 — Foundation (infra + Module A)
- [ ] AI provider abstraction (`src/ai/provider`) + env config.
- [ ] `structuredOutput` (Zod JSON enforcement) + `enricher` + `audit`.
- [ ] `ai_insights` + `ai_audit_logs` tables via Drizzle migration.
- [ ] **Intake Copilot** (score + description draft + duplicate warning).
- [ ] Frontend: `✨ Enhance` on `/requests/new` + draft acceptance UX.

### Phase 2 — Solution Factory
- [ ] **Requirements/Story generator** on Project Detail → Requirements.
- [ ] Acceptance-criteria + epic breakdown.

### Phase 3 — Lifecycle & Support
- [ ] **Ticket triage** (priority, assignee, SLA suggestion).
- [ ] Thread summary + reply drafting.
- [ ] Replace/augment cron SLA logic with AI risk flags.

### Phase 4 — Executive + Knowledge
- [ ] **Portfolio digest / risk brief** on the Dashboard.
- [ ] **Ask the CoE** RAG assistant (embedding strategy + MCP/vector store).

### Phase 5 — Hardening
- [ ] Prompt-version registry + offline evals / regression set.
- [ ] Human-acceptance analytics (accept vs. reject rate per feature).
- [ ] Cost dashboard + per-org budgets.

---

## 13. Open Questions / TODOs

- [ ] Choose **provider + models** per capability (and cost ceiling).
- [ ] Decide **data residency** / compliance (EU Data Boundary, etc.).
- [ ] Choose **embedding + vector strategy** for Module E (Turso/sqlite-vec vs. managed vector DB).
- [ ] Define the **RICE/WSJF weighting model** (or whether to let the model pick weights with a stored config).
- [ ] Confirm **which roles** may trigger each AI feature.
- [ ] Define **retention windows** for `ai_insights` and `ai_audit_logs`.
- [ ] Decide whether **"Ask the CoE"** exposes **anonymous/feedback** entry points (likely not, to avoid PII leakage).
- [ ] Set **prompt versioning** approach (semver in `src/ai/prompts` + eval harness).

---

## 14. Verification Checklist

- [ ] All AI output is **Zod-validated** before being stored or shown.
- [ ] Every AI feature has a **graceful degrade** path when the provider is down.
- [ ] Every AI-generated value is **editable** (draft, never final) and shows **reasoning**.
- [ ] No AI call causes an **unauthorized write** — humans confirm all state changes.
- [ ] RBAC is enforced on all `/api/v1/ai/*` routes, matching the augmented module.
- [ ] AI output is treated as **untrusted** (no HTML render, no prompt echo without sanitization).
- [ ] `ai_audit_logs` records provider/model/prompt version/tokens/latency/status for every call.
- [ ] Cost + rate limits configured; deterministic results cached.
- [ ] `npm run build` passes with no TypeScript errors.
- [ ] Light + dark theme parity holds for all AI UI components.

---

> **Last updated:** 2026-08-23
> **Source doc:** `enterprise-hub-spec.md` (§1–§10) and `master-css-style.md` (theme/styling conventions)
