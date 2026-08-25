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
  'discovery',
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

// ---- CHANGE MANAGEMENT (docs/plans/change-management.md) ----
// change_requests.type (spec: change_requests.type CHECK)
export const CHANGE_TYPES = ['standard', 'normal', 'major', 'emergency'] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];

// change_requests.category (spec: change_requests.category CHECK)
export const CHANGE_CATEGORIES = ['infrastructure', 'application', 'data', 'security', 'business'] as const;
export type ChangeCategory = (typeof CHANGE_CATEGORIES)[number];

// change_requests.risk (spec: change_requests.risk CHECK)
export const CHANGE_RISKS = ['low', 'medium', 'high'] as const;
export type ChangeRisk = (typeof CHANGE_RISKS)[number];

// change_requests.status (spec: change_requests.status CHECK)
export const CHANGE_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'scheduled',
  'in_implementation',
  'testing',
  'closed',
  'rejected',
  'rolled_back',
  'cancelled',
] as const;
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];

// change_requests.priority (spec: change_requests.priority CHECK) — reuses PROJECT_PRIORITIES
export type ChangePriority = ProjectPriority;

// change_tasks.status (spec: change_tasks.status CHECK)
export const CHANGE_TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type ChangeTaskStatus = (typeof CHANGE_TASK_STATUSES)[number];

// change_approvals.decision (spec: change_approvals.decision CHECK)
export const CHANGE_APPROVAL_DECISIONS = ['pending', 'approved', 'rejected', 'changes_requested'] as const;
export type ChangeApprovalDecision = (typeof CHANGE_APPROVAL_DECISIONS)[number];

// cab_members.member_type (spec: cab_members.member_type CHECK)
export const CAB_MEMBER_TYPES = ['cab_member', 'service_owner', 'it_manager'] as const;
export type CabMemberType = (typeof CAB_MEMBER_TYPES)[number];

// change_windows.kind (spec: change_windows.kind CHECK)
export const CHANGE_WINDOW_KINDS = ['window', 'freeze'] as const;
export type ChangeWindowKind = (typeof CHANGE_WINDOW_KINDS)[number];

// ── APPLICATION IDEA GENERATOR (docs/plans/app-idea.md) ──
// application_ideas.user_class (spec: app-idea.md §8)
export const APP_IDEA_USER_CLASSES = ['personal', 'small_team', 'department', 'enterprise'] as const;
export type AppIdeaUserClass = (typeof APP_IDEA_USER_CLASSES)[number];

// application_ideas.app_size (spec: app-idea.md §8)
export const APP_IDEA_APP_SIZES = ['small', 'medium', 'large'] as const;
export type AppIdeaAppSize = (typeof APP_IDEA_APP_SIZES)[number];

// application_ideas.audience (spec: app-idea.md §8)
export const APP_IDEA_AUDIENCES = ['internal', 'external'] as const;
export type AppIdeaAudience = (typeof APP_IDEA_AUDIENCES)[number];

// application_ideas.status (spec: app-idea.md §10)
export const APP_IDEA_STATUSES = ['draft', 'published', 'archived'] as const;
export type AppIdeaStatus = (typeof APP_IDEA_STATUSES)[number];
