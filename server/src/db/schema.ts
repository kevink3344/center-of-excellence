// ─────────────────────────────────────────────────────────────
// Drizzle ORM schema — mirrors `docs/plans/enterprise-hub-spec.md` §5.
// Tables: users, business_units, projects, project_members,
//         requirements, sprints, deployments, support_tickets, comments
// Plus AI tables from `docs/plans/ai-component.md` §9.
// ─────────────────────────────────────────────────────────────
import {
  text,
  integer,
  real,
  sqliteTable,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

// ---- Enums (check constraints) ----
const rolen = () => text('role', { enum: ['requestor', 'analyst', 'developer', 'pm', 'executive', 'support'] });
const pstatus = () => text('status', { enum: ['intake', 'scored', 'approved', 'in_progress', 'uat', 'deployed', 'on_hold', 'retired'] });
const priority = () => text('priority', { enum: ['low', 'medium', 'high', 'critical'] });
const rtype = () => text('type', { enum: ['user_story', 'bug', 'task', 'epic'] });
const rstatus = () => text('status', { enum: ['backlog', 'in_progress', 'in_review', 'done'] });
const sstatus = () => text('status', { enum: ['planned', 'active', 'completed'] });
const denv = () => text('environment', { enum: ['dev', 'test', 'prod'] });
const dstatus = () => text('status', { enum: ['pending', 'approved', 'deployed', 'failed'] });
const tpriority = () => text('priority', { enum: ['p1', 'p2', 'p3', 'p4'] });
const tstatus = () => text('status', { enum: ['open', 'in_progress', 'resolved', 'closed'] });
const entType = () => text('entity_type', { enum: ['project', 'requirement', 'ticket'] });

const id = () => text('id').primaryKey().$defaultFn(() => randomUUID());
const timestamp = () => text('created_at').default("(datetime('now'))");
const date = () => text(); // SQLite DATE stored as TEXT 'YYYY-MM-DD'
const datetime = () => text(); // SQLite DATETIME stored as TEXT ISO

// ---- USERS & ORGANIZATION (spec §5) ----
export const users = sqliteTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: rolen().notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp(),
});

export const businessUnits = sqliteTable('business_units', {
  id: id(),
  name: text('name').notNull(),
  ownerId: text('owner_id').references(() => users.id),
});

// ---- PORTFOLIO & PROJECTS (spec §5) ----
export const projects = sqliteTable(
  'projects',
  {
    id: id(),
    title: text('title').notNull(),
    description: text('description'),
    status: pstatus().notNull().default('intake'),
    priority: priority(),
    score: integer('score').notNull().default(0),
    businessUnitId: text('business_unit_id').references(() => businessUnits.id),
    requestorId: text('requestor_id').references(() => users.id),
    pmId: text('pm_id').references(() => users.id),
    budget: real('budget'),
    startDate: date(),
    targetDate: date(),
    createdAt: timestamp(),
  },
  (t) => [index('projects_status_idx').on(t.status), index('projects_bu_idx').on(t.businessUnitId)],
);

export const projectMembers = sqliteTable(
  'project_members',
  {
    projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] })],
);

// ---- LIFECYCLE - REQUIREMENTS & SPRINTS (spec §5) ----
export const requirements = sqliteTable(
  'requirements',
  {
    id: id(),
    projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    type: rtype().notNull().default('user_story'),
    story: text('story'), // As a... I want... So that...
    acceptanceCriteria: text('acceptance_criteria'),
    status: rstatus().notNull().default('backlog'),
    assigneeId: text('assignee_id').references(() => users.id),
  },
  (t) => [index('requirements_project_idx').on(t.projectId)],
);

export const sprints = sqliteTable(
  'sprints',
  {
    id: id(),
    projectId: text('project_id').notNull().references(() => projects.id),
    name: text('name').notNull(),
    startDate: date(),
    endDate: date(),
    status: sstatus().notNull().default('planned'),
  },
  (t) => [index('sprints_project_idx').on(t.projectId)],
);

// ---- OPERATIONS & SUPPORT (spec §5) ----
export const deployments = sqliteTable(
  'deployments',
  {
    id: id(),
    projectId: text('project_id').notNull().references(() => projects.id),
    environment: denv().notNull(),
    version: text('version').notNull(),
    status: dstatus().notNull().default('pending'),
    deployedBy: text('deployed_by').references(() => users.id),
    deployedAt: datetime(),
  },
  (t) => [index('deployments_project_idx').on(t.projectId)],
);

export const supportTickets = sqliteTable(
  'support_tickets',
  {
    id: id(),
    projectId: text('project_id').references(() => projects.id),
    title: text('title').notNull(),
    priority: tpriority().notNull().default('p3'),
    status: tstatus().notNull().default('open'),
    reportedBy: text('reported_by').references(() => users.id),
    assigneeId: text('assignee_id').references(() => users.id),
    slaDueAt: datetime(),
    createdAt: timestamp(),
  },
  (t) => [index('tickets_status_idx').on(t.status), index('tickets_project_idx').on(t.projectId)],
);

export const comments = sqliteTable(
  'comments',
  {
    id: id(),
    entityType: entType().notNull(), // 'project', 'requirement', 'ticket'
    entityId: text('entity_id').notNull(),
    authorId: text('author_id').references(() => users.id),
    body: text('body').notNull(),
    createdAt: timestamp(),
  },
  (t) => [index('comments_entity_idx').on(t.entityType, t.entityId)],
);

// ─────────────────────────────────────────────────────────────
// AI tables (from `docs/plans/ai-component.md` §9) — additive
// ─────────────────────────────────────────────────────────────
export const aiInsights = sqliteTable(
  'ai_insights',
  {
    id: id(),
    entityType: text('entity_type', { enum: ['project', 'requirement', 'ticket', 'dashboard'] }).notNull(),
    entityId: text('entity_id').notNull(),
    kind: text('kind', { enum: ['score', 'story', 'triage', 'summary', 'explanation'] }).notNull(),
    content: text('content').notNull(), // JSON payload (human-editable draft)
    reasoning: text('reasoning'),
    status: text('status', { enum: ['draft', 'accepted', 'rejected'] }).notNull().default('draft'),
    createdBy: text('created_by').references(() => users.id),
    createdAt: timestamp(),
  },
  (t) => [index('ai_insights_entity_idx').on(t.entityType, t.entityId)],
);

export const aiAuditLogs = sqliteTable(
  'ai_audit_logs',
  {
    id: id(),
    feature: text('feature').notNull(), // 'intake','stories','triage','executive','ask_coe'
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    provider: text('provider'),
    model: text('model'),
    promptVersion: text('prompt_version'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    latencyMs: integer('latency_ms'),
    status: text('status', { enum: ['ok', 'degraded', 'failed'] }).notNull().default('ok'),
    createdAt: timestamp(),
  },
  (t) => [index('ai_audit_feature_idx').on(t.feature)],
);

export const projectSimilarity = sqliteTable(
  'project_similarity',
  {
    projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    similarProjectId: text('similar_project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    similarity: real('similarity'), // 0..1
  },
  (t) => [primaryKey({ columns: [t.projectId, t.similarProjectId] })],
);

// ─────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  ownedUnits: many(businessUnits),
  requestedProjects: many(projects, { relationName: 'requestor' }),
  managedProjects: many(projects, { relationName: 'pm' }),
  memberships: many(projectMembers),
  assignedRequirements: many(requirements),
  deployments: many(deployments),
  ticketsReported: many(supportTickets, { relationName: 'reportedBy' }),
  ticketsAssigned: many(supportTickets, { relationName: 'assignee' }),
  comments: many(comments),
}));

export const businessUnitsRelations = relations(businessUnits, ({ one, many }) => ({
  owner: one(users, { fields: [businessUnits.ownerId], references: [users.id] }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  businessUnit: one(businessUnits, { fields: [projects.businessUnitId], references: [businessUnits.id] }),
  requestor: one(users, { fields: [projects.requestorId], references: [users.id], relationName: 'requestor' }),
  pm: one(users, { fields: [projects.pmId], references: [users.id], relationName: 'pm' }),
  members: many(projectMembers),
  requirements: many(requirements),
  sprints: many(sprints),
  deployments: many(deployments),
  tickets: many(supportTickets),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const requirementsRelations = relations(requirements, ({ one }) => ({
  project: one(projects, { fields: [requirements.projectId], references: [projects.id] }),
  assignee: one(users, { fields: [requirements.assigneeId], references: [users.id] }),
}));

export const sprintsRelations = relations(sprints, ({ one }) => ({
  project: one(projects, { fields: [sprints.projectId], references: [projects.id] }),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  project: one(projects, { fields: [deployments.projectId], references: [projects.id] }),
  deployedBy: one(users, { fields: [deployments.deployedBy], references: [users.id] }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  project: one(projects, { fields: [supportTickets.projectId], references: [projects.id] }),
  reportedBy: one(users, { fields: [supportTickets.reportedBy], references: [users.id], relationName: 'reportedBy' }),
  assignee: one(users, { fields: [supportTickets.assigneeId], references: [users.id], relationName: 'assignee' }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  createdBy: one(users, { fields: [aiInsights.createdBy], references: [users.id] }),
}));
