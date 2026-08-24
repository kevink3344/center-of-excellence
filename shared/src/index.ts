// Shared package entry point for @eidh/shared
export * from './types';
export * from './schemas';

// Re-export inferred entity row types derived from the Zod schemas (client-friendly)
export type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateRequirementInput,
  CreateSprintInput,
  CreateDeploymentInput,
  CreateTicketInput,
  UpdateTicketInput,
  CreateCommentInput,
  LoginInput,
  Pagination,
  ErrorEnvelope,
  GenerateStoryInput,
  StoryDraft,
} from './schemas';
