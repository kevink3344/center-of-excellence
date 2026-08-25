import { z } from 'zod';
import {
  CAB_MEMBER_TYPES,
  CHANGE_APPROVAL_DECISIONS,
  CHANGE_CATEGORIES,
  CHANGE_RISKS,
  CHANGE_STATUSES,
  CHANGE_TASK_STATUSES,
  CHANGE_TYPES,
  CHANGE_WINDOW_KINDS,
  DEPLOYMENT_ENVIRONMENTS,
  DEPLOYMENT_STATUSES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TYPES,
  SPRINT_STATUSES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  USER_ROLES,
} from './types';

// ─────────────────────────────────────────────────────────────
// Shared Zod schemas (spec §8.2 — request/response contracts)
// Used by the server for validation and client forms.
// ─────────────────────────────────────────────────────────────

export const userRoleSchema = z.enum(USER_ROLES);
export const projectStatusSchema = z.enum(PROJECT_STATUSES);
export const projectPrioritySchema = z.enum(PROJECT_PRIORITIES);
export const requirementTypeSchema = z.enum(REQUIREMENT_TYPES);
export const requirementStatusSchema = z.enum(REQUIREMENT_STATUSES);
export const sprintStatusSchema = z.enum(SPRINT_STATUSES);
export const deploymentEnvironmentSchema = z.enum(DEPLOYMENT_ENVIRONMENTS);
export const deploymentStatusSchema = z.enum(DEPLOYMENT_STATUSES);
export const ticketPrioritySchema = z.enum(TICKET_PRIORITIES);
export const ticketStatusSchema = z.enum(TICKET_STATUSES);

// ---- Create project / intake form (spec §8.2 example) ----
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  businessUnitId: z.string().optional(),
  businessValue: z.number().min(1).max(10).optional(),
  effort: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
  budget: z.number().nonnegative().optional(),
  priority: projectPrioritySchema.optional(),
  requestorId: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ---- Update project ----
export const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: projectStatusSchema.optional(),
  priority: projectPrioritySchema.optional(),
  score: z.number().int().optional(),
  pmId: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ---- Requirement / story (spec §8.2) ----
export const createRequirementSchema = z.object({
  title: z.string().min(1),
  type: requirementTypeSchema.default('user_story'),
  story: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  assigneeId: z.string().optional(),
});
export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;

// ---- Sprint ----
export const createSprintSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: sprintStatusSchema.default('planned'),
});
export type CreateSprintInput = z.infer<typeof createSprintSchema>;

// ---- Deployment ----
export const createDeploymentSchema = z.object({
  environment: deploymentEnvironmentSchema,
  version: z.string().min(1),
  projectId: z.string(),
});
export type CreateDeploymentInput = z.infer<typeof createDeploymentSchema>;

// ---- Support ticket ----
export const createTicketSchema = z.object({
  projectId: z.string().optional(),
  title: z.string().min(1),
  priority: ticketPrioritySchema.default('p3'),
  assigneeId: z.string().optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  assigneeId: z.string().optional(),
});
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

// ---- Change Management (docs/plans/change-management.md §7.2) ----
export const changeTypeSchema = z.enum(CHANGE_TYPES);
export const changeCategorySchema = z.enum(CHANGE_CATEGORIES);
export const changeRiskSchema = z.enum(CHANGE_RISKS);
export const changePrioritySchema = z.enum(PROJECT_PRIORITIES); // low|medium|high|critical
export const changeStatusSchema = z.enum(CHANGE_STATUSES);
export const changeTaskStatusSchema = z.enum(CHANGE_TASK_STATUSES);
export const changeApprovalDecisionSchema = z.enum(CHANGE_APPROVAL_DECISIONS);
export const cabMemberTypeSchema = z.enum(CAB_MEMBER_TYPES);
export const changeWindowKindSchema = z.enum(CHANGE_WINDOW_KINDS);

// Create a change request (RFC). `rollbackPlan` required for normal/major/emergency.
// Split the base object from the refine so the object keeps `.partial()` on the shape.
const changeRequestBaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: changeTypeSchema.default('normal'),
  category: changeCategorySchema.default('application'),
  priority: changePrioritySchema.default('medium'),
  risk: changeRiskSchema.default('medium'),
  reason: z.string().optional(),
  implementationPlan: z.string().optional(),
  rollbackPlan: z.string().optional(),
  testPlan: z.string().optional(),
  projectId: z.string().optional(),
  serviceOwner: z.string().optional(),
  plannedStartAt: z.string().datetime().optional(),
  plannedEndAt: z.string().datetime().optional(),
});

export const createChangeRequestSchema = changeRequestBaseSchema.superRefine((val, ctx) => {
  if (['normal', 'major', 'emergency'].includes(val.type) && !val.rollbackPlan) {
    ctx.addIssue({
      code: 'custom',
      path: ['rollbackPlan'],
      message: 'Rollback plan is required for this change type',
    });
  }
});
export type CreateChangeRequestInput = z.infer<typeof changeRequestBaseSchema>;

export const updateChangeRequestSchema = changeRequestBaseSchema.partial();
export type UpdateChangeRequestInput = z.infer<typeof updateChangeRequestSchema>;

export const createChangeTaskSchema = z.object({
  title: z.string().min(1),
});
export type CreateChangeTaskInput = z.infer<typeof createChangeTaskSchema>;

export const updateChangeTaskSchema = z.object({
  title: z.string().min(1).optional(),
  assigneeId: z.string().optional(),
  status: changeTaskStatusSchema.optional(),
});
export type UpdateChangeTaskInput = z.infer<typeof updateChangeTaskSchema>;

export const approveChangeSchema = z.object({
  decision: changeApprovalDecisionSchema,
  comment: z.string().optional(),
});
export type ApproveChangeInput = z.infer<typeof approveChangeSchema>;

export const scheduleChangeSchema = z.object({
  plannedStartAt: z.string().datetime(),
  plannedEndAt: z.string().datetime(),
});
export type ScheduleChangeInput = z.infer<typeof scheduleChangeSchema>;

export const createChangeWindowSchema = z.object({
  name: z.string().min(1),
  kind: changeWindowKindSchema.default('window'),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  scope: z.string().optional(),
});
export type CreateChangeWindowInput = z.infer<typeof createChangeWindowSchema>;

// ---- Comment ----
export const createCommentSchema = z.object({
  entityType: z.enum(['project', 'requirement', 'ticket', 'change']),
  entityId: z.string(),
  body: z.string().min(1),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---- Pagination / list query ----
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// ---- AI: application idea generation (docs/plans/app-idea.md) ----
// Replaces the legacy story generator (ai-component.md §4 Module B).

// Wizard answers (4 questions + analysis model + optional template basis).
export const appIdeaAnswersSchema = z.object({
  userClass: z.enum(['personal', 'small_team', 'department', 'enterprise']),
  appSize: z.enum(['small', 'medium', 'large']),
  audience: z.enum(['internal', 'external']),
  connectivity: z.boolean(),
  model: z.string().optional(), // model id (undefined = deterministic)
  templateId: z.string().optional(), // base an existing idea on a prior draft
  ideaText: z.string().max(2000).optional(), // free-form basis (optional)
});
export type AppIdeaAnswers = z.infer<typeof appIdeaAnswersSchema>;

// The generated design document (human-editable draft).
export const appDesignSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  architecture: z.string().min(1),
  stack: z.array(z.string()).min(1),
  dataModel: z.object({
    coreEntities: z.array(z.string()).min(1),
    relationships: z.array(z.string()),
  }),
  integrations: z.array(z.object({ name: z.string(), purpose: z.string() })),
  security: z.object({
    authentication: z.string(),
    authorization: z.string(),
    dataProtection: z.string(),
  }),
  estimate: z.object({
    effort: z.enum(['XS', 'S', 'M', 'L', 'XL']),
    tShirt: z.string(),
    weeks: z.number().int().nonnegative(),
    team: z.array(z.string()),
  }),
  phases: z.array(z.object({ name: z.string(), weeks: z.number().int().nonnegative(), focus: z.string() })),
  risks: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
  readyStories: z.array(
    z.object({
      title: z.string(),
      story: z.string(),
      acceptance: z.array(z.string()),
    }),
  ),
  reasoning: z.string(),
});
export type AppDesign = z.infer<typeof appDesignSchema>;

// Request body for POST /api/v1/ideas/generate (AI or deterministic).
export const generateIdeaSchema = appIdeaAnswersSchema;
export type GenerateIdeaInput = z.infer<typeof generateIdeaSchema>;

// POST /api/v1/ideas (save generated design as a draft).
export const createIdeaSchema = z.object({
  title: z.string().min(1),
  ideaText: z.string().min(1),
  model: z.string().optional(),
  userClass: z.enum(['personal', 'small_team', 'department', 'enterprise']),
  appSize: z.enum(['small', 'medium', 'large']),
  audience: z.enum(['internal', 'external']),
  connectivity: z.boolean(),
  design: appDesignSchema,
});
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;

// PATCH /api/v1/ideas/:id
export const updateIdeaSchema = z.object({
  title: z.string().min(1).optional(),
  ideaText: z.string().min(1).optional(),
  design: appDesignSchema.partial().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;

// ─────────────────────────────────────────────────────────────
// Admin-configurable Generator defaults (docs/plans/app-idea.md §7.4)
// These control what the Application Idea Generator uses by default:
//   - the technology stack it recommends (e.g. Node, not .NET)
//   - the authentication scheme (JWT, with optional SSO)
//   - the default DB (Turso for dev) vs production DB (Azure SQL)
// Stored in `app_settings` (key `generator_settings`), JSON-encoded.
// ─────────────────────────────────────────────────────────────
export const GENERATOR_AUTH_MODES = ['jwt', 'sso', 'jwt_sso'] as const;
export const GENERATOR_DB_OPTIONS = ['turso', 'azure_sql', 'postgres', 'sqlite'] as const;

export const generatorSettingsSchema = z.object({
  // Recommended stack. The generator prefers these over its hard-coded defaults.
  techStack: z.array(z.string().min(1)).min(1),
  // authMode: 'jwt' (default) | 'sso' | 'jwt_sso'
  authMode: z.enum(GENERATOR_AUTH_MODES),
  // Dev default database (Turso) and production default (Azure SQL).
  defaultDatabase: z.enum(GENERATOR_DB_OPTIONS),
  productionDatabase: z.enum(GENERATOR_DB_OPTIONS),
  updatedAt: z.string().optional(),
});
export type GeneratorSettings = z.infer<typeof generatorSettingsSchema>;
export type GeneratorSettingsInput = z.input<typeof generatorSettingsSchema>;

export const DEFAULT_GENERATOR_SETTINGS: GeneratorSettings = {
  techStack: ['Node.js (Express)', 'React', 'Turso (libSQL) — dev / Azure SQL Server — prod', 'Docker'],
  authMode: 'jwt',
  defaultDatabase: 'turso',
  productionDatabase: 'azure_sql',
};

// POST /api/v1/ideas/:id/publish
export const publishIdeaSchema = z.object({
  projectId: z.string().optional(), // publish into an existing project
  title: z.string().min(1).optional(), // default: draft.title
  description: z.string().optional(), // default: design.summary
  businessUnitId: z.string().optional(),
  businessValue: z.number().min(1).max(10).optional(),
  effort: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
  priority: projectPrioritySchema.optional(),
  budget: z.number().nonnegative().optional(),
});
export type PublishIdeaInput = z.infer<typeof publishIdeaSchema>;

export type Pagination = z.infer<typeof paginationSchema>;

// ---- Response envelope convention (spec §8.2) ----
export function ok<T>(data: T) {
  return { data } as const;
}
export function paged<T>(data: T[], meta: { page: number; pageSize: number; total: number }) {
  return { data, meta } as const;
}

// ---- Error envelope (spec §8.3) ----
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'RATE_LIMITED',
  'CONFLICT',
  'INTERNAL',
  'AI_UNAVAILABLE',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
