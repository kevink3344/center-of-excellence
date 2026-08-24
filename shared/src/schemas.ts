import { z } from 'zod';
import {
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

// ---- Comment ----
export const createCommentSchema = z.object({
  entityType: z.enum(['project', 'requirement', 'ticket']),
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

// ---- AI: story generation (docs/plans/ai-component.md §4 Module B) ----
// Request body for POST /api/v1/ai/story.
export const generateStorySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(4000, 'Prompt is too long'),
});
export type GenerateStoryInput = z.infer<typeof generateStorySchema>;

// Structured output the AI must return (Zod-validated, human-editable draft).
export const storyDraftSchema = z.object({
  title: z.string().min(1),
  story: z.string().min(1),
  acceptance: z.array(z.string()).min(1),
  reasoning: z.string(),
});
export type StoryDraft = z.infer<typeof storyDraftSchema>;
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
