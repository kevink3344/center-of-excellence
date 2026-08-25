# Application Idea Generator Plan — Enterprise Innovation & Delivery Hub (EIDH)

**Stack:** Node.js + React + Turso (libSQL) | **Version:** 1.0 | **Date:** 2026-08-25
**Scope:** Replaces the "Requirements & Story Generator" (Module B) with an **Application Idea Generator** — a guided wizard that turns a rough idea into a draft application design, stores it as an editable Draft, and lets the owner Publish it into a real EIDH project.
**Decision:** **Build into EIDH**, replacing the existing `/stories` surface (keep the AI orchestration + deterministic-fallback patterns from `ai-component.md` §Module B, but reframe the output from *user stories* to an *application design*).

---

## Table of Contents

1. [Executive Summary & Recommendation](#1-executive-summary--recommendation)
2. [Motivation: What Changes vs. the Story Generator](#2-motivation-what-changes-vs-the-story-generator)
3. [Scope & Definitions](#3-scope--definitions)
4. [The Idea to Draft Wizard](#4-the-idea-to-draft-wizard)
5. [Design Artifact (What the Generator Produces)](#5-design-artifact-what-the-generator-produces)
6. [Deterministic Design Rules](#6-deterministic-design-rules)
7. [AI Augmentation](#7-ai-augmentation)
8. [Domain Model & Data Schema (Turso SQL)](#8-domain-model--data-schema-turso-sql)
9. [API Specification](#9-api-specification)
10. [Draft Lifecycle & Publishing](#10-draft-lifecycle--publishing)
11. [Frontend Integration](#11-frontend-integration)
12. [Publishing: Draft → EIDH Project](#12-publishing-draft--eidh-project)
13. [Guardrails, Governance & Audit](#13-guardrails-governance--audit)
14. [Phased Build Plan](#14-phased-build-plan)
15. [Open Questions / TODOs](#15-open-questions--todos)
16. [Verification Checklist](#16-verification-checklist)

---

## 1. Executive Summary & Recommendation

**Problem:** The current *Requirements & Story Generator* takes a description and emits a single user story + acceptance criteria. That's useful for **an already-scoped feature**, but a CoE intake audience starts higher up: they have a **raw idea** ("I want an app that lets vendors submit invoices," "we need internal knowledge search"). Today there is no guided path from *idea* → *design* → *draft deliverable*, and no place to iterate on or version that design before it becomes a governed project.

**Solution:** Replace the Story Generator with an **Application Idea Generator**:

1. The user types a free-text **idea**.
2. A short **wizard** captures four determining signals:
   - **(1) Number of users**
   - **(2) Application size (Large vs. Small)**
   - **(3) Internal vs. External audience**
   - **(4) Connectivity to other systems (Yes/No)**
3. The generator produces a **structured application design** (architecture recommendation, tech stack, data model, integration plan, security posture, size/cost estimate, risks, delivery phases).
4. The design is saved as a **Draft** — fully editable and versioned.
5. The owner iterates, then **Publishes**, which creates a governed **EIDH project** (and optional seeded requirements).

**Recommendation:** Build in, as a **replacement surface** for `/stories`. Reuse the existing AI provider abstraction (`server/src/ai/provider.ts`), the deterministic-fallback convention, the `@eidh/shared` Zod envelope, and the existing `projects`/`requirements` tables for publishing. Add **one** new table `application_ideas` to hold drafts + designs. Keep the wizard 4 questions (fast, low-friction) and derive everything else deterministically first, then optionally AI-enrich.

> **Why replace rather than add alongside:** the Story Generator was a narrow "Module B" slice. The idea→design→draft→publish loop is a strictly more useful front door for the same intake audience and the same project. Keeping both would clutter navigation and duplicate the AI plumbing. The design artifact *includes* user-story-ready requirements when published, so no capability is lost.

---

## 2. Motivation: What Changes vs. the Story Generator

| Dimension | Today (`/stories`, Module B) | Proposed (`/ideas`) |
| --- | --- | --- |
| **Input** | A description of a feature | A raw application idea (free text) |
| **Guidance** | None | A 4-question wizard |
| **Output** | One user story + criteria | A full application design (multi-section) |
| **Artifacts** | `requirements` row only | **Draft** design, editable + versioned |
| **Lifecycle** | Generate → Accept → save as a requirement | Idea → Wizard → Design → **Draft** → Edit → **Publish** → Project |
| **AI role** | Generate the story | Generate/enrich the design; deterministic fallback |
| **Persisted state** | No draft bucket | `application_ideas` table (draft = `status:'draft'`) |
| **Final outcome** | A requirement under a project | A **project** (with seeded requirements) |

---

## 3. Scope & Definitions

### In scope
- The **4-question wizard** (users, size, audience, connectivity).
- **Design generation** — deterministic engine + optional AI enrichment.
- **Draft** CRUD (create, read, update, delete) with an edit UI.
- **Publish** → materialize an EIDH project (and optionally requirements).
- Nav + route swap: `/stories` → `/ideas`.

### Out of scope (v1)
- Multi-user review/approval workflow on a draft (Publish is owner-only in v1).
- Version history/diffing beyond a single `updated_at` (V2 could add snapshots).
- Templates / starting from a blank design without AI.
- Public sharing of drafts outside EIDH.

### Key terms
- **Idea** — the raw free-text prompt entered by the user.
- **Wizard answers** — the 4 signals that shape the design.
- **Design** — the generated structured artifact (see §5).
- **Draft** — a saved, editable instance of an idea + answers + design.
- **Publish** — the action that converts a Draft into an EIDH `project`.

---

## 4. The Idea to Draft Wizard

### 4.1 Flow (single page, stepper)

```
['Model' ▾]  ← AI model drop-down (above the Idea window)
[1. Idea]    ← free text + ['Template' ▾] (below)
  → [2. Wizard (4 Qs)]  →  [3. Generate]  →  [4. Design]  →  [5. Save Draft]
                            ▲                            │
                            └──────── Edit/Regenerate ───┘
                                                         │
                                        [6. Publish → Project] (from saved Draft)
```

### 4.2 Step 1 — Idea

The Idea window is framed by **two selectors** — one **above** (choose the AI model) and one **below** (choose a saved idea template to seed the input).

**Above — AI model drop-down (model picker)**
- A `<select>` rendered above the idea textarea listing the available AI models.
- Options are **not hard-coded** — they come from a model catalog in `.env` (see §7.1). e.g. `AI_MODELS='deepseek-chat,gpt-4o-mini,claude-3-5-sonnet'` (3–4 entries).
- On load the client fetches the catalog from `GET /api/v1/ai/models` and populates the drop-down; the first entry is selected by default.
- The chosen model ID is sent with the generate request (`{ idea, answers, model }`) and passed to the AI provider call. Selecting a different model does **not** re-run anything until the user clicks Generate.
- Label: *"AI model"*, with the default model highlighted. Stored on the draft as `model` so the record is auditable.

**Idea textarea**
- Free-text textarea (mirrors current `storyInput`).
- Placeholder: *"e.g. An internal app where vendors submit and track invoices."*
- Optional example chips (reuse the `EXAMPLE_PROMPTS` pattern, reworded to ideas).
- Minimum length: 1 char.

**Below — Idea template selector (template picker)**
- A drop-down **below** the textarea: *"Start from a template"* (or *"Use a saved idea as a template"*).
- Lists **previously generated ideas** (drafts) as templates — the user can seed the current idea from one. This is the "basis for their idea" reuse path.
- Source: `GET /api/v1/ideas?status=draft` (or a dedicated "templates" list) — shows a curated set of earlier ideas, optionally limited to the user's own.
- Each option shows a short label (draft title / idea headline). Selecting one **pre-fills** the idea textarea (and optionally the 4 wizard answers + design) so the user can adapt it rather than start from blank.
- Choosing a template does **not** create a copy until the user saves a new draft; it's a read-only seed into the form.
- A "Clear" / "None" option restores a blank input.

> **Config note:** "model catalog" and "templates" are **two distinct things**. The model drop-down (above) selects *which LLM* generates the design; the template drop-down (below) selects *which prior idea* seeds the input. Both are additive to the existing wizard — they do not change the 4-question flow.

### 4.3 Step 2 — The four questions (single screen, four controls)

| # | Question | Options | Purpose (drives design) |
| --- | --- | --- | --- |
| 1 | **How many users?** | `under_10` (Internal team) · `10_50` (Department) · `50_200` (Business unit) · `200_1000` (Enterprise) · `1000_plus` (Org-wide / public) | Scale, auth, hosting |
| 2 | **Large or small application?** | `small` (Single purpose) · `medium` (Multi-module) · `large` (Enterprise platform) | Architecture, effort, team |
| 3 | **Internal or external?** | `internal` (Employees only) · `external` (Customers/partners/public) | Security, compliance, hosting |
| 4 | **Connectivity to other systems?** | `no` (Standalone) · `yes` (Integrates with other apps) | Integration architecture |

> Wizard is intentionally **focused**: the four signals are the highest-information-per-question inputs. Every subsequent design section derives from them. Keep it to 4 to preserve low-friction — do not add more in v1.

### 4.4 Step 3 — Generate
- Calls `POST /api/v1/ideas/generate` with `{ idea, answers, model }` (the `model` is the selected AI model from the drop-down; optional — omitted means "use default").
- Server tries AI with the **selected model**; on AI-unavailable returns `503 AI_UNAVAILABLE`, client falls back to the deterministic engine (§6).
- Loading state: `"Generating your design…"`.

### 4.5 Step 4 — Design view
- Renders the design artifact (§5) as readable sections, **all editable inline** (or via an "Edit" mode).

### 4.6 Step 5 — Save as Draft
- `POST /api/v1/ideas` persists `{ idea, answers, design }` with `status:'draft'`.
- After save, user can navigate to the Draft list to reopen and edit.
- Drafts behave like "save your work" — you can leave and come back.

---

## 5. Design Artifact (What the Generator Produces)

The generator returns a **structured design object**. This is the core new output type. It is richer than a user story and intentionally maps to what a CoE analyst needs before funding.

```ts
interface AppDesign {
  name: string;                       // proposed application name
  headline: string;                   // one-sentence value proposition
  summary: string;                    // 2-3 sentence description
  audience: AuditAudience;            // internal | external
  scale: ScaleAnswer;                 // user-count class
  size: SizeAnswer;                   // small | medium | large
  connectivity: ConnectivityAnswer;   // standalone | integrated

  architecture: {
    pattern: string;                  // e.g. "Modular monolith", "Single-page app + API", "Microservices"
    hosting: string;                  // e.g. "Azure App Service", "Static + Function Apps", "Intranet IIS"
    scaling: string;                  // derived from scale
    rationale: string;                // why this pattern fits the 4 answers
  };

  stack: {
    frontend: string;
    backend: string;
    database: string;
    auth: string;                     // derived from internal vs external
    notes: string;
  };

  dataModel: {
    entities: { name: string; purpose: string; fields: string[] }[];  // suggested tables
    rationale: string;
  };

  integrations: {
    count: number;
    systems: string[];                // empty if connectivity = no
    pattern: string;                  // e.g. "REST + queue", "ETL", "Event-driven"
    dataFlow: string;
  };

  security: {
    authn: string;                    // SSO/M365 | external IdP + MFA
    authz: string;
    compliance: string[];             // e.g. ["Privacy", "Accessibility", "DPA"]
    notes: string;
  };

  estimate: {
    effort: string;                   // XS S M L XL
    teamSize: number;
    weeks: string;                    // range
    budgetRange: string;              // range, depends on size
    rationale: string;
  };

  phases: {                 // suggested delivery sequence
    phase: string;          // "MVP", "v1", "v2"
    scope: string;
  }[];

  risks: { text: string; severity: 'low' | 'medium' | 'high'; mitigation: string }[];

  readyStories: {           // produced on Publish (optional) — bridges to old requirement world
    title: string;
    story: string;
    acceptance: string[];
  }[];

  reasoning: string;        // human-readable explanation of the assumptions
}
```

### Why this shape
- **`readyStories`** preserves the old value (user stories + acceptance criteria) so publishing still yields actionable requirements.
- **`estimate` + `phases`** give a CoE portfolio an immediate size/cost read (plugs into `projects.score`/`budget`/`priority` on publish).
- **`integrations`** answers the connectivity question concretely.
- **`security`** differentiates internal vs. external meaningfully.

---

## 6. Deterministic Design Rules

The deterministic engine is the **guaranteed fallback** and also a good way to smoke-test the design logic. It maps the 4 answers to a plausible design with **no AI**. This is the "always works" path (per `ai-component.md` §Guiding Principle 5).

### 6.1 Scale → hosting / auth / scaling

| User class | Auth | Hosting | Scaling note |
| --- | --- | --- | --- |
| `under_10` | Simple (shared account / SSO) | Single PAAS instance | No autoscaling |
| `10_50` | SSO (M365/Entra) | App Service + managed DB | Basic |
| `50_200` | SSO + RBAC roles | App Service + managed DB (+ cache) | Autoscale on demand |
| `200_1000` | SSO + SCIM provisioning | Multi-instance + CDN | Horizontal scale |
| `1000_plus` | IdP + MFA, strong session | Distributed + CDN + availability zones | Elastic autoscale |

### 6.2 Size → architecture / effort / team

| Size | Architecture pattern | Effort | Team | Weeks (est.) |
| --- | --- | --- | --- | --- |
| `small` | Single-page app + single API (monolith) | S | 1–2 devs | 4–8 |
| `medium` | Modular monolith + API, split modules | M | 2–4 devs | 8–16 |
| `large` | Service-oriented / microservices, event bus | L–XL | 4–8+ cross-functional | 16–32+ |

### 6.3 Audience (Internal / External) → security posture

| Audience | Authentication | Authorization | Compliance focus |
| --- | --- | --- | --- |
| `internal` | M365/Entra SSO (federated) | Role-based, per-BU | Internal policy, least-privilege |
| `external` | External IdP + MFA, self-registration, secure session | Scoped per-tenant/customer, consent | Privacy, DPA, accessibility (WCAG), data residency |

### 6.4 Connectivity (Yes/No) → integration architecture

| Answer | `integrations.count` | Pattern | Data flow |
| --- | --- | --- | --- |
| `no` | 0 | Standalone | Single system; data lives inside the app |
| `yes` | 1–3+ derived from idea (keyword scan) | REST + async queue / event-driven | Pull/push; describe source systems, sync cadence, error handling |

### 6.5 Name & summary generation
- **Name:** derive from idea title-case, or `"{domain} Hub/Portal/Manager"` from detected keywords (reuse `detectDomain` idea from `storyGenerator.ts`).
- **Summary:** template using the idea text + the 4 answers ("A {size} {audience} app for up to {users} users that {does X}.").
- **`readyStories`:** generate 2–4 user stories + acceptance criteria reusing the existing `generateStory` logic, scoped to the app's purpose.

> **NOTE (replace `storyGenerator.ts`):** the existing `client/src/lib/storyGenerator.ts` becomes `client/src/lib/ideaGenerator.ts`. The user-story synthesis is reused as a sub-step for `readyStories`, but the deterministic engine's primary job is now the **design**, not a single story.

---

## 7. AI Augmentation

- **Endpoint:** reuse the AI provider (`server/src/ai/provider.ts` `chat`). Add `server/src/ai/ideas.ts` (mirrors `stories.ts`).
- **Prompt:** instructs the model to return the `AppDesign` JSON shape (same strict-JSON parse approach, Zod-validated).
- **System prompt** must include the 4 answers + the idea and constraints. Enforce exact keys and enum values. Cap tokens.
- **Guarding:** validate output with a new `appDesignSchema` in `@eidh/shared`. On any failure → throw `503 AI_UNAVAILABLE` → client falls back to deterministic.
- **Cost control:** the AI call is a single "generation" action behind the Generate button. Publish uses deterministic `readyStories` + the *user-approved* design (no new AI call required).

### 7.1 Model catalog (the AI model drop-down)

The drop-down above the Idea window lists the **selectable AI models**. The list is **config-driven from `.env`**, not hard-coded — so the user can add/remove models without touching the frontend or server code.

**Env var:** add a new `AI_MODELS` (comma-separated) to `.env` and to the validated schema in `server/src/config/env.ts`:

```
# .env — optional. Comma-separated model IDs. First entry = default.
AI_MODELS=deepseek-chat,gpt-4o-mini,claude-3-5-sonnet
```

- `env.ts`: add `AI_MODELS: z.string().optional()` to `envSchema`, and derive a `modelCatalog: string[]` helper (`(env.AI_MODELS ?? env.AI_MODEL ?? 'deepseek-chat').split(',').map(s=>s.trim()).filter(Boolean)`).
- `server/src/ai/provider.ts`: add `export function modelCatalog(): string[]` returning the parsed list, and optionally `defaultCatalogModel()` = first entry. Keep existing `defaultModel()` for back-compat.
- **API:** add `GET /api/v1/ai/models` → `{ data: { models: string[], default: string } }` so the frontend populates the drop-down. Server derives this from `modelCatalog()`.
- **Generate call:** `POST /api/v1/ideas/generate` accepts an optional `model` field. If provided, the controller passes it to `chat({ model })`; if not, it uses `defaultCatalogModel()`/`defaultModel()`. The selected model is **validated** against the catalog (`z.string().refine(m => catalog.includes(m))`) to prevent arbitrary model injection.
- **Persistence:** store the chosen `model` on the `application_ideas` row so the design is traceable to which model produced it (audit).

> **TODO (you fill in):** confirm the exact model IDs your providers accept (DeepSeek/Azure OpenAI/Anthropic/Ollama names differ). The catalog is just a list of strings passed straight to the provider, so they must be valid for the configured `AI_BASE_URL`/`AI_PROVIDER`.

### 7.2 Idea templates (reuse of prior ideas)

- A template is simply a previously saved **draft** re-used to seed the current idea.
- `GET /api/v1/ideas?status=draft` (optionally `&mine=true` · `&limit=`) returns candidate templates (title + ideaText + design summary).
- **No new schema** — templates are existing `application_ideas` rows, just rendered as a selector below the Idea textarea.
- Optionally cache/favorite a subset as "featured templates" (a `isTemplate` boolean on the row, or a curated seed list) so users always have good starting points.

---

## 8. Domain Model & Data Schema (Turso SQL)

Add **one** new table to `server/src/db/schema.ts` alongside the existing AI tables (ref `ai-component.md` §9).

```ts
// ---- Idea → Draft → Publish (docs/plans/app-idea.md §8) ----
export const USER_CLASSES = ['under_10','10_50','50_200','200_1000','1000_plus'] as const;
export const APP_SIZES = ['small','medium','large'] as const;
export const AUDIENCE_TYPES = ['internal','external'] as const;
export const IDEA_STATUSES = ['draft','published','archived'] as const;

export const applicationIdeas = sqliteTable('application_ideas', {
  id: id(),
  authorId: text('author_id').references(() => users.id),   // creator
  title: text('title').notNull(),                            // idea headline (also proposed app name)
  ideaText: text('idea_text').notNull(),                     // the raw free-text idea
  model: text('model'),                                      // AI model that generated the design (from catalog)
  userClass: text('user_class', { enum: USER_CLASSES }).notNull(),
  appSize: text('app_size', { enum: APP_SIZES }).notNull(),
  audience: text('audience', { enum: AUDIENCE_TYPES }).notNull(),
  connectivity: text('connectivity', { enum: ['no','yes'] }).notNull(),
  design: text('design', { mode: 'json' }).notNull(),         // AppDesign object, JSON string
  status: text('status', { enum: IDEA_STATUSES }).notNull().default('draft'),
  publishedProjectId: text('published_project_id').references(() => projects.id), // set on publish
  createdAt: timestamp(),
  updatedAt: text('updated_at'),
}, (t) => [
  index('ideas_author_idx').on(t.authorId),
  index('ideas_status_idx').on(t.status),
]);
```

> **Drizzle usage tip:** `text('design', { mode: 'json' })` stores/parses JSON automatically (in the same sqlite-core import). If the DB layer has any trouble, store as plain `text` and `JSON.parse`/`stringify` in the controller.

### Migration
- `npm run db:generate -w server` then `npm run db:migrate -w server`.
- Idempotent **seed update**: add 2–3 sample drafts to `server/src/db/seed.ts` (delete-then-insert, in FK-safe order — add `applicationIdeas` before `projects` delete since it references `projects` for `publishedProjectId`... actually it should be deleted before `projects`; see §14).

---

## 9. API Specification

All under `/api/v1/ideas` (replace the `/api/v1/ai/story` route; the `/api/v1/ai/*` namespace can be kept or folded in).

| Method | Path | Body / Params | Returns | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/ai/models` | — | `{ data: { models: string[], default: string } }` | List selectable AI models (from `.env` `AI_MODELS`) |
| `POST` | `/api/v1/ideas/generate` | `{ idea, answers, model? }` | `{ data: AppDesign }` | Generate design (AI with selected model, fallback deterministic) |
| `POST` | `/api/v1/ideas` | `{ idea, answers, design, model? }` | `{ data: Idea }` | Save a new Draft |
| `GET` | `/api/v1/ideas` | `?status=draft&authorId=` | `{ data: Idea[], meta }` | List drafts |
| `GET` | `/api/v1/ideas/:id` | — | `{ data: Idea }` | Get one draft (full design) |
| `PUT` | `/api/v1/ideas/:id` | `{ idea?, answers?, design? }` | `{ data: Idea }` | Update draft (edit design) |
| `POST` | `/api/v1/ideas/:id/publish` | `{ title?, description?, businessUnitId?, priority?, budget? }` | `{ data: { idea, project } }` | Publish → create project (+ seeded requirements) |
| `DELETE` | `/api/v1/ideas/:id` | — | `{ data:{ ok:true } }` | Archive/delete a draft |

### Request schemas (`@eidh/shared/src/schemas.ts`)
```ts
export const appIdeaAnswersSchema = z.object({
  userClass: z.enum(USER_CLASSES),
  appSize: z.enum(APP_SIZES),
  audience: z.enum(AUDIENCE_TYPES),
  connectivity: z.enum(['no','yes']),
});

export const generateIdeaSchema = z.object({
  idea: z.string().min(1).max(4000),
  answers: appIdeaAnswersSchema,
  model: z.string().optional(),            // selected AI model (validated against catalog in controller)
});

export const createIdeaSchema = generateIdeaSchema.extend({
  design: appDesignSchema,          // required when saving a draft
  model: z.string().optional(),      // persisted for audit
});

export const updateIdeaSchema = z.object({
  idea: z.string().min(1).max(4000).optional(),
  answers: appIdeaAnswersSchema.optional(),
  design: appDesignSchema.optional(),
  model: z.string().optional(),
});

export const publishIdeaSchema = z.object({
  title: z.string().min(1).optional(),   // default: draft.title
  description: z.string().optional(),    // default: design.summary
  businessUnitId: z.string().optional(),
  priority: projectPrioritySchema.optional(), // derived from estimate if omitted
  budget: z.number().nonnegative().optional(),
});

export const appDesignSchema = z.object({ ... });  // full AppDesign, see §5
```

> **Story route removal:** delete `POST /api/v1/ai/story`, `server/src/controllers/ai.ts generateStory`, and `server/src/ai/stories.ts` (or keep `stories.ts`'s prompt helpers for reuse in `readyStories`). The `generateStorySchema`/`StoryDraft` can remain in shared if reused, otherwise remove.

---

## 10. Draft Lifecycle & Publishing

### 10.1 States

```
draft ──(publish)──> published   (creates projects row; sets publishedProjectId)
  │
  └──(archive)──> archived
```

- **Draft** — editable, not yet a project. Owner can iterate indefinitely.
- **Published** — a real `projects` row exists; the design is frozen as the "as-approved" baseline. Further edits create a **new draft** (immutable published baseline), not a silent mutation.
- **Archived** — soft-deleted from the active list (kept for audit).

### 10.2 Publish behavior
1. Validate the draft is `status:'draft'`.
2. Insert a `projects` row:
   - `title` = publish body `title` ?? `draft.title`
   - `description` = `description` ?? `design.summary`
   - `status` = `'intake'` (or `'scored'` if we set a score from the estimate)
   - `score` = derived from `estimate.effort` (XS→ small, … ) mapped to a 1–100 heuristic
   - `priority` = `body.priority` ?? heuristic from scale+audience
   - `budget` = `body.budget` ?? parsed from `estimate.budgetRange`
   - `businessUnitId` = from body if provided
   - `requestorId` = `draft.authorId`
3. Optionally seed `requirements` from `design.readyStories` (each `readyStories[i]` → a `type='user_story'` requirement with `story` + `acceptance_criteria`).
4. Set `draft.status='published'`, `draft.publishedProjectId=<new id>`, `draft.updatedAt=now`.
5. Create a **notification** via existing notifications service ("Idea 'X' was published as project 'Y'").
6. Return `{ idea, project }`.

> **Idempotency:** publishing an already-published draft returns a conflict (`409 IDEA_ALREADY_PUBLISHED`) rather than creating a duplicate project.

---

## 11. Frontend Integration

### 11.1 Route & nav swap
- `client/src/App.tsx`: replace `<Route path="/stories" element={<StoryGenerator />} />` with `<Route path="/ideas" element={<AppIdeas />} />`.
- `client/src/components/AppLayout.tsx`: change `NAV` entry `{ to: '/stories', label: 'Requirements & Story', icon: Wand2 }` → `{ to: '/ideas', label: 'Application Ideas', icon: Lightbulb }`.

### 11.2 New pages/components (`client/src`)
- `pages/AppIdeas.tsx` — route page. If `:id` present → detail/edit; else wizard.
- `pages/IdeaDetail.tsx` — open a saved Draft, edit the design, Publish.
- `components/IdeaWizard.tsx` — the 4-step stepper (idea → 4 questions → generate).
- `components/IdeaModelPicker.tsx` — the **AI model drop-down** rendered **above** the Idea textarea. Fetches `GET /api/v1/ai/models` and populates options; holds the selected `model` in wizard state.
- `components/IdeaTemplatePicker.tsx` — the **template drop-down** rendered **below** the Idea textarea. Fetches `GET /api/v1/ideas?status=draft`, lists prior ideas, and **pre-fills** the idea text (and answers/design) on select; has a "None/Clear" option.
- `components/IdeaDesignView.tsx` — renders the `AppDesign` sections, editable.
- `components/IdeaDraftList.tsx` — list of saved drafts (status filter).
- `lib/ideaGenerator.ts` — **replaces** `lib/storyGenerator.ts` (deterministic design engine + `EXAMPLE_IDEAS`).
- `lib/api.ts` — add `getAiModels`, `generateIdea`, `createIdea`, `listIdeas`, `getIdea`, `updateIdea`, `publishIdea`.

### 11.3 The design view → edit
- Each section (summary, name, architecture, stack, dataModel, integrations, security, estimate, phases, risks, readyStories) is rendered as an editable block.
- "Edit" toggles fields to inputs/textarea; "Save Draft" writes via `PUT`.
- "Regenerate" re-calls `generate` (with current idea+answers) to redo the design (confirms before overwriting).

### 11.4 Draft list
- Table/cards: title, status chip (`draft`/`published`/`archived`), author, `updatedAt`, actions (Open, Edit, Publish).
- Filter by status; empty state with a CTA → start a new idea.

### 11.5 Styling
- Reuse existing `.panel`, `.ai-panel`, `.ai-generator-grid`, `.ai-textarea`, `.story-block`, `.badge` classes in `master-css-style.md` — no new CSS system required. Add `.idea-section`/`.wizard-step` styles if needed.

---

## 12. Publishing: Draft → EIDH Project

This is the **key integration** — it wires the Idea Generator into the existing portfolio.

- `publish` controller uses the same `db.insert(projects)` + `db.insert(requirements)` paths as `server/src/controllers/projects.ts`. Reuse the `projects` insert + requirement seeding logic (extract a small helper if not already present).
- The created project shows up immediately under `Portfolio` (`/portfolio`), `My Work`, and the Dashboard — no changes to those pages needed since they read `projects`.
- The published **draft detail** links to the new project (`/projects/:id`) so the CoE analyst can continue from design → delivery.
- Optionally store the `design` on the project (as description augment) or as a related comment (`entity_type='project'`).

---

## 13. Guardrails, Governance & Audit

- **Human-in-the-loop:** the design is always an **editable draft**; AI never directly creates a project. The only way to create a project is the owner clicking **Publish** on an approved design (`ai-component.md` §2).
- **Deterministic fallback:** AI outage never blocks draft creation → deterministic engine always produces a design.
- **Auditability:** store `authorId`, `model`, `status`, `publishedProjectId`, `updatedAt`. Publish is a one-way transition; a published baseline is immutable. `ai_audit_logs` (if present) records the generation call + chosen model.
- **Model allow-list:** the model drop-down is **server-driven** from `AI_MODELS` in `.env`, and the request `model` is validated against that catalog before calling the provider — the client cannot pass an arbitrary model ID.
- **Validation:** every write is Zod-validated (`@eidh/shared`). Design JSON is validated against `appDesignSchema` before persistence.
- **Cost control:** one AI call per generation; publish reuses the saved design (no re-call).
- **PII/security:** idea text may contain sensitive info — treat like other user content (existing sanitization/roles apply). External apps surface compliance flags in the design for review, they don't auto-enforce.

---

## 14. Phased Build Plan

| Phase | Scope | Deliverable | Depends on |
| --- | --- | --- | --- |
| **P0 — Schema** | Add `application_ideas` table + enums (`model` column) + migration + seed samples | Turso table + migration | — |
| **P1 — Shared contract** | `appDesignSchema`, idea/answer/publish schemas, `model` field, types export | `@eidh/shared` types | P0 |
| **P2 — Deterministic engine** | `client/src/lib/ideaGenerator.ts`: map answers→design, reuse story synthesis for `readyStories` | Working design without AI | P1 |
| **P3 — API + controllers** | `ideas` routes/controller (`generate`, CRUD, `publish`), `GET /ai/models`, remove `ai/story` route | REST contract | P1 |
| **P4 — AI enrichment** | `server/src/ai/ideas.ts` + prompt; `modelCatalog()` helper in provider + `.env` `AI_MODELS`; wire into `generate`; keep fallback | AI-generate with model picker + fallback | P3 |
| **P5 — Frontend wizard** | `IdeaWizard`, `IdeaModelPicker` (above), `IdeaTemplatePicker` (below), `AppIdeas`, nav/route swap | Wizard UX | P2, P3 |
| **P6 — Draft list + edit + publish** | `IdeaDraftList`, `IdeaDesignView` (editable), `publishIdea` UI, link to project | Draft lifecycle | P5 |
| **P7 — Polish & QA** | Empty states, loading/error, confirmation on regenerate/publish, model/picker a11y | Production-ready | P6 |

> **Sizing:** P0–P3 ≈ deterministic MVP (draft + publish works without AI). P4 adds the AI enrichment + model catalog. P5–P7 complete the UX (including the two pickers).

---

## 15. Open Questions / TODOs

- [ ] **Score mapping:** what 1–100 heuristic from `estimate.effort` + scale should set `projects.score` on publish? (Needs a defensible formula; align with the RICE model in `ai-component.md` §3.)
- [ ] **`ai_audit_logs`** — confirm the table exists (from `ai-component.md` §9) and log generation calls for cost/audit.
- [ ] **JSON column** — verify `text(..., { mode:'json' })` works with the current drizzle/libsql driver, or fall back to plain text + `JSON.parse`.
- [ ] **Remove vs. keep** `generateStorySchema`/`StoryDraft` in `@eidh/shared` (only keep if `readyStories` reuses them).
- [ ] **Existing `/stories` page/debris** — confirm no other references to `StoryGenerator`/`storyGenerator` before removing (grep `stories`), including tests and the `ai-component.md` doc.
- [ ] **Model catalog format** — decide the `AI_MODELS` delimiter/format in `.env` (comma-separated is proposed). Confirm the model IDs are valid for the configured `AI_PROVIDER`/`AI_BASE_URL`.
- [ ] **Template scope** — should templates be limited to the current user's own drafts (`GET /ideas?status=draft&mine=true`), or visible to all users? (v1 plan: the user's own drafts + a curated seed set.)
- [ ] **Publish → notifications** — confirm the notifications service signature for the "idea published" event.
- [ ] **Editing a published draft** — decide if "edit a published idea" creates a copy-draft (v1) or is blocked (v2). v1 plan: editing a published idea creates a new `draft`.
- [ ] **Auth/ownership** — rely on existing `auth` middleware (`req.user`) for `authorId`; confirm route is behind it.
- [ ] **Sample seeds** — add 2–3 idea drafts to `seed.ts` (and update the FK-safe delete order to include `applicationIdeas`).
- [ ] **`GET /api/v1/ai/models`** — confirm whether the response should be cached (the catalog only changes when `.env` changes) to avoid a fetch on every page load.

---

## 16. Verification Checklist

**Schema & migration**
- [ ] `npm run db:generate -w server` + `npm run db:migrate -w server` succeed.
- [ ] `application_ideas` exists with correct columns/enums.

**Shared contract**
- [ ] `appDesignSchema` validates a sample design object; invalid enums/keys rejected.
- [ ] `@eidh/shared` types build cleanly (`npm run type-check`).

**Deterministic engine (no AI)**
- [ ] Each of the 4 answers changes the produced design (spot-check scale + audience + connectivity crossing).
- [ ] `readyStories` yields ≥2 valid user stories + acceptance criteria.

**API**
- [ ] `GET /api/v1/ai/models` returns `{ models, default }` populated from `AI_MODELS` in `.env`.
- [ ] `POST /ideas/generate` returns `{ data: AppDesign }` (AI with the selected model or fallback); passing an invalid `model` is rejected.
- [ ] `POST /ideas` saves a draft (persists `model`); `GET /ideas` lists it; `PUT /ideas/:id` edits; `GET /ideas/:id` returns full design.
- [ ] `POST /ideas/:id/publish` creates a `projects` row + `requirements`, sets `publishedProjectId`, and is idempotent (second publish → 409).
- [ ] Old `POST /ai/story` route removed (or confirmed unused).

**Frontend**
- [ ] Nav shows "Application Ideas" → `/ideas`; `/stories` no longer routes.
- [ ] Wizard: **model drop-down (above)** → idea text → **template drop-down (below)** → 4 questions → generate → design → save draft.
- [ ] Model picker populates from the API; changing it is reflected in the generate call; the selected model is shown on the saved draft.
- [ ] Template picker lists prior drafts; selecting one pre-fills the idea and (optionally) the answers/design.
- [ ] Draft list shows seeded drafts; open → edit → save; publish → lands on `/projects/:id`.
- [ ] Loading/empty/error states present; AI-unavailable falls back to deterministic.

**Quality**
- [ ] Mobile/responsive layout for the stepper + design view.
- [ ] `npm run type-check` + `npm run lint` pass in `client`, `server`, `shared`.
- [ ] No dangling imports of `storyGenerator`/`StoryGenerator` anywhere (grep).
