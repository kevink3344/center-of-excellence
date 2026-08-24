// Client-side API client — talks to the Express server at /api/v1 (proxied in dev).
import type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateRequirementInput,
  CreateSprintInput,
  CreateTicketInput,
  UpdateTicketInput,
  CreateCommentInput,
  GenerateStoryInput,
  StoryDraft,
  ProjectStatus,
  ProjectPriority,
  TicketStatus,
  TicketPriority,
  RequirementType,
} from '@eidh/shared';

// Entity row shapes (lightweight mirrors of DB rows — the server may include relations).
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
}

export interface BusinessUnit {
  id: string;
  name: string;
  ownerId?: string | null;
}

export interface ProjectListItem {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  priority?: ProjectPriority | null;
  score: number;
  businessUnitId?: string | null;
  requestorId?: string | null;
  pmId?: string | null;
  budget?: number | null;
  startDate?: string | null;
  targetDate?: string | null;
  createdAt?: string | null;
  businessUnit?: BusinessUnit | null;
  requestor?: User | null;
  pm?: User | null;
}

export interface Project extends ProjectListItem {
  members?: { userId: string; user?: User }[];
  requirements?: Requirement[];
  sprints?: Sprint[];
  deployments?: Deployment[];
  tickets?: Ticket[];
}

export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  type: RequirementType;
  story?: string | null;
  acceptanceCriteria?: string | null;
  status: string;
  assigneeId?: string | null;
  assignee?: User | null;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  environment: string;
  version: string;
  status: string;
  deployedAt?: string | null;
}

export interface Ticket {
  id: string;
  projectId?: string | null;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  reportedBy?: string | null;
  assigneeId?: string | null;
  slaDueAt?: string | null;
  createdAt?: string | null;
  project?: ProjectListItem | null;
  assignee?: User | null;
  reportedByUser?: User | null;
}

export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  authorId?: string | null;
  body: string;
  createdAt?: string | null;
  author?: User | null;
}

// Envelope conventions (spec §8.2)
interface DataEnvelope<T> { data: T }
interface PagedEnvelope<T> { data: T[]; meta: { page: number; pageSize: number; total: number } }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // projects
  listProjects: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<DataEnvelope<ProjectListItem[]>>(`/api/v1/projects${qs}`);
  },
  getProject: (id: string) => request<DataEnvelope<Project>>(`/api/v1/projects/${id}`),
  createProject: (body: CreateProjectInput) =>
    request<DataEnvelope<Project>>(`/api/v1/projects`, { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (id: string, body: UpdateProjectInput) =>
    request<DataEnvelope<Project>>(`/api/v1/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteProject: (id: string) => request<void>(`/api/v1/projects/${id}`, { method: 'DELETE' }),

  // requirements
  listRequirements: (projectId: string) =>
    request<DataEnvelope<Requirement[]>>(`/api/v1/projects/${projectId}/requirements`),
  createRequirement: (projectId: string, body: CreateRequirementInput) =>
    request<DataEnvelope<Requirement>>(`/api/v1/projects/${projectId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // sprints + deployments
  listSprints: (projectId: string) =>
    request<DataEnvelope<Sprint[]>>(`/api/v1/projects/${projectId}/sprints`),
  createSprint: (projectId: string, body: CreateSprintInput) =>
    request<DataEnvelope<Sprint>>(`/api/v1/projects/${projectId}/sprints`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listDeployments: (projectId: string) =>
    request<DataEnvelope<Deployment[]>>(`/api/v1/projects/${projectId}/deployments`),

  // support
  listTickets: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<DataEnvelope<Ticket[]>>(`/api/v1/support/tickets${qs}`);
  },
  createTicket: (body: CreateTicketInput) =>
    request<DataEnvelope<Ticket>>(`/api/v1/support/tickets`, { method: 'POST', body: JSON.stringify(body) }),
  updateTicket: (id: string, body: UpdateTicketInput) =>
    request<DataEnvelope<Ticket>>(`/api/v1/support/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  // comments
  listComments: (entityType: string, entityId: string) =>
    request<DataEnvelope<Comment[]>>(`/api/v1/comments?entityType=${entityType}&entityId=${entityId}`),
  createComment: (body: CreateCommentInput) =>
    request<DataEnvelope<Comment>>(`/api/v1/comments`, { method: 'POST', body: JSON.stringify(body) }),

  // users
  me: () => request<DataEnvelope<User>>(`/api/v1/users/me`),
  listUsers: () => request<DataEnvelope<User[]>>(`/api/v1/users`),

  // ai
  generateStory: (body: GenerateStoryInput) =>
    request<DataEnvelope<StoryDraft>>(`/api/v1/ai/story`, { method: 'POST', body: JSON.stringify(body) }),
};
