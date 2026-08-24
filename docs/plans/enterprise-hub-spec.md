# Enterprise Innovation & Delivery Hub (EIDH) - Technical Specification
**Stack:** Node.js + React + Turso (libSQL) | **Version:** 1.0 | **Date:** 2026-05-11
**Purpose:** Enterprise Center of Excellence (CoE) & Application Lifecycle Management (ALM) Portal

> This one application answers all 3 enterprise tiers: 1) Leading Teams/Projects 2) Low-Code Solution Delivery 3) Full Lifecycle Management

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Data Schema - Turso SQL](#4-data-schema---turso-sql)
5. [Roles & Permissions (RBAC)](#5-roles--permissions-rbac)
6. [User Stories](#6-user-stories)
7. [Screen Mockups & UX Spec](#7-screen-mockups--ux-spec)
8. [API Specification](#8-api-specification)
9. [Build Steps - Implementation Guide](#9-build-steps---implementation-guide)
10. [Deployment & DevOps](#10-deployment--devops)

---

### 1. Executive Summary

**Problem:** Enterprises suffer from Shadow IT, manual project intake via email/spreadsheets, no visibility into project portfolio, and no standardized lifecycle for building/supporting apps.

**Solution:** EIDH is a single portal to **Intake -> Prioritize -> Plan -> Build -> Deploy -> Support -> Retire** any enterprise application. It serves as both the product and the portfolio manager for all other products.

**Core Modules:**
- **A. Portfolio Command Center:** For Leaders/Executives to manage teams, budgets, and enterprise portfolio.
- **B. Solution Factory:** For Builders to manage requirements, sprints, and reusable components.
- **C. Lifecycle & Support Suite:** For Operations to manage deployments, SLA tickets, and application health.

### 2. System Architecture

**Architecture:** Modern Monorepo, Client-Server, Edge-Ready Database


graph TD
    User --> React[React SPA - Vite + Tailwind]
    React --> API[Node.js API - Express/Hono]
    API --> Auth[Auth Middleware - JWT/Clerk]
    API --> DB[(Turso libSQL - Edge SQLite)]
    API --> Jobs[Background Jobs - Node Cron]
    API --> Storage[S3/R2 - File Storage]


### 3. Project Structure

/enterprise-hub
├── /client (React + Vite + TypeScript)
│   ├── /src/pages, /components, /hooks, /lib
├── /server (Node + Express + TypeScript)
│   ├── /src/routes, /controllers, /middleware, /db
├── /drizzle (Drizzle ORM Schema & Migrations)
└── package.json (Turborepo)

### 4. Technology Stack

Layer	Technology	Purpose
Frontend	React 18 + Vite + TypeScript	SPA
Styling	Tailwind CSS + shadcn/ui	Enterprise UI System
State/Data	TanStack Query + React Router + Zustand	Server state & routing
Charts	Recharts / Tremor	Executive Dashboards (Replaces Power BI)
Backend	Node.js + Express + TypeScript	REST API
Database	Turso (libSQL) + Drizzle ORM	Edge SQLite, Type-safe ORM
Auth	Clerk or Lucia Auth + JWT	RBAC
Validation	Zod	Shared schema
Deployment	Vercel (Frontend) + Fly.io/Render (API) + Turso Cloud	CI/CD

### 5. Data Schema - Turso SQL

-- USERS & ORGANIZATION
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('requestor','analyst','developer','pm','executive','support')),
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT REFERENCES users(id)
);

-- PORTFOLIO & PROJECTS
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK(status IN ('intake','scored','approved','in_progress','uat','deployed','on_hold','retired')) DEFAULT 'intake',
  priority TEXT CHECK(priority IN ('low','medium','high','critical')),
  score INTEGER DEFAULT 0, -- Auto-calculated business value
  business_unit_id TEXT REFERENCES business_units(id),
  requestor_id TEXT REFERENCES users(id),
  pm_id TEXT REFERENCES users(id),
  budget REAL,
  start_date DATE,
  target_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_members (
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

-- LIFECYCLE - REQUIREMENTS & SPRINTS
CREATE TABLE requirements (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT CHECK(type IN ('user_story','bug','task','epic')) DEFAULT 'user_story',
  story TEXT, -- As a... I want... So that...
  acceptance_criteria TEXT,
  status TEXT CHECK(status IN ('backlog','in_progress','in_review','done')) DEFAULT 'backlog',
  assignee_id TEXT REFERENCES users(id)
);

CREATE TABLE sprints (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK(status IN ('planned','active','completed'))
);

-- OPERATIONS & SUPPORT
CREATE TABLE deployments (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  environment TEXT CHECK(environment IN ('dev','test','prod')) NOT NULL,
  version TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending','approved','deployed','failed')),
  deployed_by TEXT REFERENCES users(id),
  deployed_at DATETIME
);

CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  title TEXT NOT NULL,
  priority TEXT CHECK(priority IN ('p1','p2','p3','p4')),
  status TEXT CHECK(status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
  reported_by TEXT REFERENCES users(id),
  assignee_id TEXT REFERENCES users(id),
  sla_due_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'project', 'requirement', 'ticket'
  entity_id TEXT NOT NULL,
  author_id TEXT REFERENCES users(id),
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

### 7. Screen Mockups & UX Spec
Global Layout: Sidebar Navigation (Dashboard, Portfolio, My Work, Support, Admin) + Top Header (Search, Notifications, User Menu). Use shadcn/ui Sidebar, Card, Badge, Table.
Screen 1: Executive Dashboard (/dashboard)
Header: Date range filter
Row 1: 4 KPI Cards: [Total Active Projects: 24] [Budget Utilized: 68%] [Avg Delivery Time: 42 days] [Open P1 Tickets: 3]
Row 2: Recharts: BarChart (Projects by Status), PieChart (Projects by Business Unit)
Row 3: Table: "At-Risk Projects" (Target Date < 7 days & status != deployed)
Screen 2: Portfolio Kanban (/portfolio)
Top: Filter by Priority, BU, + New Request button
Columns: Intake | Scored | Approved | In Progress | UAT | Deployed
Card: Title, Requestor Avatar, Priority Badge (color), Score, Budget
Screen 3: Project Detail (/projects/:id) - Tabbed View
Tabs: Overview | Requirements | Sprints | Deployments | Support | Activity
Overview Tab: Left: Description, Timeline (Gantt mini), Budget Progress Bar. Right: Members list, Comments thread.
Requirements Tab: Table with status badges + Add User Story modal.
Screen 4: Intake Form (/requests/new)
shadcn Form: Title*, BU dropdown, Description (textarea), Business Value (1-10 slider), Effort (T-shirt size), Budget input. Footer: Submit & Cancel. Shows live calculated Score preview.
Screen 5: Support Desk (/support)
Table: Ticket ID, Project, Title, Priority (P1-red), Status, Assignee, SLA Countdown (e.g., "2h 15m left")
Filters: My Tickets, Overdue

---

### 8. API Specification

> **Status:** Draft — *to be filled in.*
> **Conventions:** RESTful endpoints under `/api/v1`. Request/response bodies validated with **Zod** (shared schema package). All endpoints require a bearer JWT unless noted. Errors follow a consistent envelope (see [§8.3 Error Handling](#83-error-handling)).

#### 8.1 Endpoint Overview

| Method | Path | Auth | Module | Description | Entity |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/projects` | ✅ | Portfolio | List/filter projects | `projects` |
| `POST` | `/api/v1/projects` | ✅ | Portfolio | Create project (intake) | `projects` |
| `GET` | `/api/v1/projects/:id` | ✅ | Portfolio | Project detail | `projects` |
| `PATCH` | `/api/v1/projects/:id` | ✅ | Portfolio | Update project fields | `projects` |
| `DELETE` | `/api/v1/projects/:id` | ✅ | Portfolio | Delete project | `projects` |
| `GET` | `/api/v1/projects/:id/requirements` | ✅ | Solution Factory | List requirements | `requirements` |
| `POST` | `/api/v1/projects/:id/requirements` | ✅ | Solution Factory | Add requirement/story | `requirements` |
| `GET` | `/api/v1/projects/:id/sprints` | ✅ | Solution Factory | List sprints | `sprints` |
| `POST` | `/api/v1/projects/:id/sprints` | ✅ | Solution Factory | Create sprint | `sprints` |
| `POST` | `/api/v1/projects/:id/deployments` | ✅ | Lifecycle | Request deployment | `deployments` |
| `GET` | `/api/v1/support/tickets` | ✅ | Lifecycle | List/filter tickets | `support_tickets` |
| `POST` | `/api/v1/support/tickets` | ✅ | Lifecycle | Create ticket | `support_tickets` |
| `PATCH` | `/api/v1/support/tickets/:id` | ✅ | Lifecycle | Update ticket status/assignee | `support_tickets` |
| `GET` | `/api/v1/users/me` | ✅ | Auth | Current user profile | `users` |

> TODO: Expand this table with auth (login/refresh/logout), business units, comments, dashboard/aggregate endpoints, and the `/api/v1/health` probe.

#### 8.2 Request / Response Contracts

> TODO: For each endpoint, document the request body shape, query params, response shape, and the Zod schema used. Use the shared types below as a starting point.

**Example (to expand):**

```
POST /api/v1/projects
{
  "title": "string (required)",
  "description": "string",
  "businessUnitId": "string",
  "businessValue": "number (1-10)",
  "effort": "XS | S | M | L | XL",
  "budget": "number"
}
```

```
201 Created
{
  "id": "uuid",
  "title": "...",
  "status": "intake",
  "score": 0,
  ...
}
```

> TODO: Add the response envelope convention (e.g. `{ data }` vs `{ data, meta }` for paginated lists), plus params for pagination/sorting/filtering.

#### 8.3 Error Handling

Standard error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": [{ "field": "title", "message": "Required" }]
  }
}
```

> TODO: Enumerate the full set of error codes (e.g. `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `CONFLICT`) and map them to HTTP status codes.

#### 8.4 Authentication & RBAC

> TODO: Document the auth flow (Clerk/Lucia + JWT), how roles map to permissions per endpoint, and middleware behavior. Roles: `requestor | analyst | developer | pm | executive | support`.

#### 8.5 Rate Limiting & Resilience

> TODO: Document per-user/per-IP limits, retry/backoff behavior, and any caching strategy (e.g. TanStack Query client caching, CDN caching for public endpoints).

---

### 9. Build Steps — Implementation Guide

> **Status:** Draft — *to be filled in.* This is the phase-by-phase build order to implement the system against §2–§7.

#### 9.0 Prerequisites

- Node.js ≥ 20 (LTS)
- pnpm / yarn / npm (monorepo — `package.json` at root, Turborepo)
- Turso account + database created (local dev via `turso dev` or libSQL embedded)
- `.env` for the server (database URL, JWT secret, S3/R2 credentials, auth keys)

> TODO: Fill in exact versions and tooling.

#### 9.1 Phase 1 — Monorepo & Tooling

> TODO: Root `package.json`, Turborepo config, `tsconfig` base, shared Zod schema package (or `shared/` workspace), formatters/linters (Biome or ESLint), git hooks.

#### 9.2 Phase 2 — Database (Turso + Drizzle)

> TODO: Drizzle schema from §5, migration tooling, seed script (idempotent, FK-safe delete-then-insert), DB type generation.

#### 9.3 Phase 3 — Backend (Express + TypeScript)

> TODO: Server bootstrapping, middleware (auth, validation, error, rate-limit), controllers/routes per §8, Zod validation, cron jobs for SLA/escalation, S3/R2 storage integration, unit tests.

#### 9.4 Phase 4 — Frontend (React + Vite + TS)

> TODO: Vite + React Router setup, TanStack Query + Zustand, shadcn/ui or custom token system (see `docs/styles/master-css-style.md`), layout/sidebar/header, all screens from §7, Recharts dashboard, form validation shared from Zod.

#### 9.5 Phase 5 — Integration & Hardening

> TODO: End-to-end flows (intake → prioritize → plan → build → deploy → support), RBAC enforcement across client routes + server, error/empty states, accessibility, performance budget.

#### 9.6 Phase 6 — Testing & Quality Gates

> TODO: Test strategy (unit/integration/E2E), CI pipeline steps, code coverage gates, lint/type-check in PR.

> TODO: Add estimated effort, dependency list, and acceptance criteria per phase.

---

### 10. Deployment & DevOps

> **Status:** Draft — *to be filled in.*

#### 10.1 Environments

| Environment | Purpose | Frontend | API | Database |
| --- | --- | --- | --- | --- |
| `dev` | Local + shared dev | Vercel preview | Fly.io/Render preview | Turso dev branch |
| `test` | Pre-prod QA | Vercel preview | Fly.io/Render | Turso test branch/db |
| `prod` | Production | Vercel production | Fly.io/Render | Turso production db |

#### 10.2 Hosting & Infrastructure

> TODO: Vercel for the SPA, Fly.io or Render for the API, Turso Cloud for the database, S3/R2 for object/attachment storage. Document domains, TLS, env vars per environment, and secrets management.

#### 10.3 CI/CD Pipeline

> TODO: Trigger branches + flow: install → lint → type-check → test → build → migrate → deploy. Map to GitHub Actions (or chosen CI). Note preview deployments per PR and promotion between environments.

#### 10.4 Database Migrations in CI/CD

> TODO: How to run Drizzle migrations safely before/after deploy (expand/contract strategy), backfill strategy, and rollback procedure.

#### 10.5 Observability

> TODO: Logging (pino/winston), structured metrics, tracing, error tracking (Sentry), uptime/health checks, and SIEM integrations if enterprise-required.

#### 10.6 Security & Compliance

> TODO: Auth (Clerk/Lucia), RBAC enforcement, secret scanning, dependency audit, CSP/security headers, rate limiting, audit trails for ALM actions, data retention.

#### 10.7 Backup, Disaster Recovery & Runbooks

> TODO: Turso backups/replication, restore drills, backup cadence, DR strategy, rollback runbook, incident response owner.

---

> **Last updated:** 2026-08-23