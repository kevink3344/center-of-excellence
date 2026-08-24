// ─────────────────────────────────────────────────────────────
// Shared domain types for EIDH (Enterprise Innovation & Delivery Hub)
// Mirrors the DB enums/roles in `docs/plans/enterprise-hub-spec.md` §5.
// This file is a single source of truth imported by server + client.
// ─────────────────────────────────────────────────────────────

// ---- Roles (spec §5: users.role CHECK constraint) ----
export const USER_ROLES = [
  'requestor',
  'analyst',
  'developer',
  'pm',
  'executive',
  'support',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ---- Project status (spec §5: projects.status CHECK) ----
export const PROJECT_STATUSES = [
  'intake',
  'scored',
  'approved',
  'in_progress',
  'uat',
  'deployed',
  'on_hold',
  'retired',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// ---- Project priority (spec §5: projects.priority CHECK) ----
export const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

// ---- Requirement type (spec §5: requirements.type CHECK) ----
export const REQUIREMENT_TYPES = ['user_story', 'bug', 'task', 'epic'] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

// ---- Requirement status (spec §5: requirements.status CHECK) ----
export const REQUIREMENT_STATUSES = ['backlog', 'in_progress', 'in_review', 'done'] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

// ---- Sprint status (spec §5: sprints.status CHECK) ----
export const SPRINT_STATUSES = ['planned', 'active', 'completed'] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

// ---- Deployment environment (spec §5: deployments.environment CHECK) ----
export const DEPLOYMENT_ENVIRONMENTS = ['dev', 'test', 'prod'] as const;
export type DeploymentEnvironment = (typeof DEPLOYMENT_ENVIRONMENTS)[number];

// ---- Deployment status (spec §5: deployments.status CHECK) ----
export const DEPLOYMENT_STATUSES = ['pending', 'approved', 'deployed', 'failed'] as const;
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

// ---- Support ticket priority (spec §5: support_tickets.priority CHECK) ----
export const TICKET_PRIORITIES = ['p1', 'p2', 'p3', 'p4'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

// ---- Support ticket status (spec §5: support_tickets.status CHECK) ----
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

// ---- Comment entity types (spec §5: comments.entity_type CHECK) ----
export const COMMENT_ENTITY_TYPES = ['project', 'requirement', 'ticket'] as const;
export type CommentEntityType = (typeof COMMENT_ENTITY_TYPES)[number];
