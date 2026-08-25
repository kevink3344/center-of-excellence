// OpenAPI 3.0 spec for the EIDH REST API (spec §8).
// Served at /api-docs by `swagger-ui-express`. Every route registered in
// `src/index.ts` is documented here so the UI is a complete, try-it-out
// reference for all CRUD + lifecycle endpoints.

// JSON media type helper.
const json = (t: string, v: Record<string, unknown> | null = null) => ({
  schema: { type: t, ...(v ? v : {}) },
});

// $ref media type helper.
const ref = (name: string) => ({
  schema: { $ref: `#/components/schemas/${name}` },
});

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'EIDH REST API',
    version: '1.0.0',
    description:
      'Enterprise Innovation & Delivery Hub — Center of Excellence API. ' +
      'All routes are prefixed with `/api/v1`. In development, auth is a stub ' +
      'injected by `requireAuth`; in production routes require a Bearer token.',
  },
  servers: [{ url: 'http://localhost:4000/api/v1', description: 'Local dev' }],
  tags: [
    { name: 'Health', description: 'Liveness probe' },
    { name: 'Projects', description: 'Project portfolio CRUD' },
    { name: 'Requirements', description: 'Requirements / stories under a project' },
    { name: 'Sprints', description: 'Sprints and deployments under a project' },
    { name: 'Support Tickets', description: 'Support ticket CRUD' },
    { name: 'Users', description: 'Users and current-user info' },
    { name: 'Comments', description: 'Polymorphic comments' },
    { name: 'AI', description: 'AI model listing' },
    { name: 'Ideas', description: 'Application idea generation & drafts' },
    { name: 'Change Management', description: 'RFC / change request lifecycle & windows' },
    { name: 'Notifications', description: 'Notification feed' },
    { name: 'Settings', description: 'Generator defaults' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health probe',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': json('object', {
                properties: { status: { type: 'string' }, uptime: { type: 'number' } },
              }),
            },
          },
        },
      },
    },

    // ── Projects ──────────────────────────────────────────────
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List projects',
        description: 'Filter via query params (status, businessUnit, priority) + pagination.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'businessUnitId', in: 'query', schema: { type: 'string' } },
          { name: 'priority', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Paged projects', content: { 'application/json': ref('ProjectList') } },
          401: { description: 'Unauthorized', content: { 'application/json': ref('Error') } },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create project (intake)',
        requestBody: { required: true, content: { 'application/json': ref('CreateProject') } },
        responses: {
          201: { description: 'Created', content: { 'application/json': ref('Project') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Project detail', content: { 'application/json': ref('Project') } },
          404: { description: 'Not found', content: { 'application/json': ref('Error') } },
        },
      },
      patch: {
        tags: ['Projects'],
        summary: 'Update project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('UpdateProject') } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': ref('Project') } },
          404: { description: 'Not found', content: { 'application/json': ref('Error') } },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Deleted' },
          404: { description: 'Not found', content: { 'application/json': ref('Error') } },
        },
      },
    },

    // ── Requirements ──────────────────────────────────────────
    '/projects/{id}/requirements': {
      get: {
        tags: ['Requirements'],
        summary: 'List requirements for a project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Requirements', content: { 'application/json': ref('RequirementList') } },
        },
      },
      post: {
        tags: ['Requirements'],
        summary: 'Create requirement / story',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('CreateRequirement') } },
        responses: {
          201: { description: 'Created', content: { 'application/json': ref('Requirement') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },

    // ── Sprints & Deployments ─────────────────────────────────
    '/projects/{id}/sprints': {
      get: {
        tags: ['Sprints'],
        summary: 'List sprints for a project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Sprints', content: { 'application/json': ref('SprintList') } },
        },
      },
      post: {
        tags: ['Sprints'],
        summary: 'Create sprint',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('CreateSprint') } },
        responses: {
          201: { description: 'Created', content: { 'application/json': ref('Sprint') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/projects/{id}/deployments': {
      get: {
        tags: ['Sprints'],
        summary: 'List deployments for a project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Deployments', content: { 'application/json': ref('DeploymentList') } },
        },
      },
      post: {
        tags: ['Sprints'],
        summary: 'Create deployment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('CreateDeployment') } },
        responses: {
          201: { description: 'Created', content: { 'application/json': ref('Deployment') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },

    // ── Support Tickets ───────────────────────────────────────
    '/support/tickets': {
      get: {
        tags: ['Support Tickets'],
        summary: 'List support tickets',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'priority', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Tickets', content: { 'application/json': ref('TicketList') } },
        },
      },
      post: {
        tags: ['Support Tickets'],
        summary: 'Create support ticket',
        requestBody: { required: true, content: { 'application/json': ref('CreateTicket') } },
        responses: {
          201: { description: 'Created', content: { 'application/json': ref('Ticket') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/support/tickets/{id}': {
      patch: {
        tags: ['Support Tickets'],
        summary: 'Update support ticket',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('UpdateTicket') } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': ref('Ticket') } },
          404: { description: 'Not found', content: { 'application/json': ref('Error') } },
        },
      },
    },

    // ── Users ─────────────────────────────────────────────────
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Current user',
        responses: {
          200: { description: 'Current user', content: { 'application/json': ref('User') } },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        responses: {
          200: { description: 'Users', content: { 'application/json': ref('UserList') } },
        },
      },
    },

    // ── Comments ──────────────────────────────────────────────
    '/comments': {
      get: {
        tags: ['Comments'],
        summary: 'List comments (filter by entityType + entityId)',
        parameters: [
          { name: 'entityType', in: 'query', schema: { type: 'string' } },
          { name: 'entityId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Comments', content: { 'application/json': ref('CommentList') } },
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Create comment',
        requestBody: { required: true, content: { 'application/json': ref('CreateComment') } },
        responses: {
          201: { description: 'Created', content: { 'application/json': ref('Comment') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },

    // ── AI ────────────────────────────────────────────────────
    '/ai/models': {
      get: {
        tags: ['AI'],
        summary: 'List selectable AI models',
        responses: {
          200: {
            description: 'Models',
            content: {
              'application/json': json('array', { items: { $ref: '#/components/schemas/Model' } }),
            },
          },
        },
      },
    },

    // ── Ideas ─────────────────────────────────────────────────
    '/ideas/generate': {
      post: {
        tags: ['Ideas'],
        summary: 'Generate an application idea (AI or deterministic)',
        requestBody: { required: true, content: { 'application/json': ref('GenerateIdea') } },
        responses: {
          200: { description: 'Generated design', content: { 'application/json': ref('AppDesign') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
          503: { description: 'AI unavailable', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/ideas': {
      get: {
        tags: ['Ideas'],
        summary: 'List idea drafts',
        responses: {
          200: { description: 'Ideas', content: { 'application/json': ref('IdeaList') } },
        },
      },
      post: {
        tags: ['Ideas'],
        summary: 'Save generated design as a draft',
        requestBody: { required: true, content: { 'application/json': ref('CreateIdea') } },
        responses: {
          201: { description: 'Created', content: { 'application/json': ref('Idea') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/ideas/{id}': {
      get: {
        tags: ['Ideas'],
        summary: 'Get one draft',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Idea', content: { 'application/json': ref('Idea') } },
          404: { description: 'Not found', content: { 'application/json': ref('Error') } },
        },
      },
      patch: {
        tags: ['Ideas'],
        summary: 'Update a draft',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('UpdateIdea') } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': ref('Idea') } },
          404: { description: 'Not found', content: { 'application/json': ref('Error') } },
        },
      },
      delete: {
        tags: ['Ideas'],
        summary: 'Archive / delete a draft',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Deleted' },
          404: { description: 'Not found', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/ideas/{id}/publish': {
      post: {
        tags: ['Ideas'],
        summary: 'Publish a draft → project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('PublishIdea') } },
        responses: {
          200: { description: 'Published', content: { 'application/json': ref('Project') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },

    // ── Change Management ─────────────────────────────────────
    '/change/calendar': {
      get: {
        tags: ['Change Management'],
        summary: 'Get change calendar',
        responses: {
          200: { description: 'Calendar' },
        },
      },
    },
    '/change/windows': {
      get: {
        tags: ['Change Management'],
        summary: 'List change windows / freezes',
        responses: {
          200: { description: 'Windows' },
        },
      },
      post: {
        tags: ['Change Management'],
        summary: 'Create change window (executive/pm)',
        requestBody: { required: true, content: { 'application/json': ref('CreateChangeWindow') } },
        responses: {
          201: { description: 'Created' },
          403: { description: 'Forbidden', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/change/requests': {
      get: {
        tags: ['Change Management'],
        summary: 'List change requests',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'projectId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Change requests', content: { 'application/json': ref('ChangeList') } },
        },
      },
      post: {
        tags: ['Change Management'],
        summary: 'Create change request (RFC)',
        requestBody: { required: true, content: { 'application/json': ref('CreateChange') } },
        responses: {
          201: { description: 'Created', content: { 'application/json': ref('Change') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/change/requests/{id}': {
      get: {
        tags: ['Change Management'],
        summary: 'Get change request',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Change', content: { 'application/json': ref('Change') } },
          404: { description: 'Not found', content: { 'application/json': ref('Error') } },
        },
      },
      patch: {
        tags: ['Change Management'],
        summary: 'Update change request (draft only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('UpdateChange') } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': ref('Change') } },
          409: { description: 'Conflict (not draft)', content: { 'application/json': ref('Error') } },
        },
      },
      delete: {
        tags: ['Change Management'],
        summary: 'Delete change request (draft/cancelled only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Deleted' },
          409: { description: 'Conflict (not draft/cancelled)', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/change/requests/{id}/submit': {
      post: {
        tags: ['Change Management'],
        summary: 'Submit draft → pending_approval',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Submitted', content: { 'application/json': ref('Change') } },
          409: { description: 'Conflict (not draft)', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/change/requests/{id}/approvals': {
      post: {
        tags: ['Change Management'],
        summary: 'Approve / reject / request changes',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('ApproveChange') } },
        responses: {
          200: { description: 'Decision recorded', content: { 'application/json': ref('Change') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/change/requests/{id}/schedule': {
      post: {
        tags: ['Change Management'],
        summary: 'Schedule a change',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('ScheduleChange') } },
        responses: {
          200: { description: 'Scheduled', content: { 'application/json': ref('Change') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/change/requests/{id}/implement': {
      post: {
        tags: ['Change Management'],
        summary: 'Move to in_implementation',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Implemented', content: { 'application/json': ref('Change') } } },
      },
    },
    '/change/requests/{id}/complete': {
      post: {
        tags: ['Change Management'],
        summary: 'Complete a change',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Completed', content: { 'application/json': ref('Change') } } },
      },
    },
    '/change/requests/{id}/rollback': {
      post: {
        tags: ['Change Management'],
        summary: 'Roll back a change',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Rolled back', content: { 'application/json': ref('Change') } } },
      },
    },
    '/change/requests/{id}/cancel': {
      post: {
        tags: ['Change Management'],
        summary: 'Cancel a change',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Cancelled', content: { 'application/json': ref('Change') } } },
      },
    },
    '/change/requests/{id}/tasks': {
      post: {
        tags: ['Change Management'],
        summary: 'Add a task to a change',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('CreateChangeTask') } },
        responses: {
          201: { description: 'Created', content: { 'application/json': ref('ChangeTask') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },
    '/change/tasks/{taskId}': {
      patch: {
        tags: ['Change Management'],
        summary: 'Update a change task',
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': ref('UpdateChangeTask') } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': ref('ChangeTask') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },

    // ── Notifications ─────────────────────────────────────────
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications',
        responses: {
          200: { description: 'Notifications', content: { 'application/json': ref('NotificationList') } },
        },
      },
    },
    '/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Get unread count',
        responses: {
          200: {
            description: 'Unread count',
            content: {
              'application/json': json('object', { properties: { count: { type: 'number' } } }),
            },
          },
        },
      },
    },
    '/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications read',
        responses: {
          204: { description: 'Marked read' },
        },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark one notification read',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Marked read' },
        },
      },
    },

    // ── Settings ──────────────────────────────────────────────
    '/settings/generator': {
      get: {
        tags: ['Settings'],
        summary: 'Read generator defaults',
        responses: {
          200: { description: 'Settings', content: { 'application/json': ref('GeneratorSettings') } },
        },
      },
      put: {
        tags: ['Settings'],
        summary: 'Update generator defaults',
        requestBody: { required: true, content: { 'application/json': ref('GeneratorSettingsInput') } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': ref('GeneratorSettings') } },
          400: { description: 'Validation error', content: { 'application/json': ref('Error') } },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    responses: {},
    parameters: {},
    requestBodies: {},
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string' },
        },
      },
      UserList: {
        type: 'object',
        properties: { data: { type: 'array', items: { $ref: '#/components/schemas/User' } } },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
          priority: { type: 'string' },
          score: { type: 'number' },
          budget: { type: 'number' },
          startDate: { type: 'string' },
          targetDate: { type: 'string' },
          businessUnitId: { type: 'string' },
          pmId: { type: 'string' },
        },
      },
      ProjectList: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Project' } },
          meta: {
            type: 'object',
            properties: { page: { type: 'number' }, pageSize: { type: 'number' }, total: { type: 'number' } },
          },
        },
      },
      CreateProject: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          businessUnitId: { type: 'string' },
          businessValue: { type: 'number', minimum: 1, maximum: 10 },
          effort: { type: 'string', enum: ['XS', 'S', 'M', 'L', 'XL'] },
          budget: { type: 'number', minimum: 0 },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          requestorId: { type: 'string' },
        },
      },
      UpdateProject: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          status: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          score: { type: 'number' },
          pmId: { type: 'string' },
          budget: { type: 'number', minimum: 0 },
          startDate: { type: 'string' },
          targetDate: { type: 'string' },
        },
      },
      Requirement: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          title: { type: 'string' },
          type: { type: 'string', enum: ['user_story', 'bug', 'task', 'epic'] },
          story: { type: 'string' },
          acceptanceCriteria: { type: 'string' },
          status: { type: 'string' },
          assigneeId: { type: 'string' },
        },
      },
      RequirementList: {
        type: 'object',
        properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Requirement' } } },
      },
      CreateRequirement: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1 },
          type: { type: 'string', enum: ['user_story', 'bug', 'task', 'epic'], default: 'user_story' },
          story: { type: 'string' },
          acceptanceCriteria: { type: 'string' },
          assigneeId: { type: 'string' },
        },
      },
      Sprint: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          name: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          status: { type: 'string' },
        },
      },
      SprintList: {
        type: 'object',
        properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Sprint' } } },
      },
      CreateSprint: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1 },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          status: { type: 'string', enum: ['planned', 'active', 'completed'], default: 'planned' },
        },
      },
      Deployment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          environment: { type: 'string', enum: ['dev', 'test', 'prod'] },
          version: { type: 'string' },
          status: { type: 'string' },
          deployedAt: { type: 'string' },
        },
      },
      DeploymentList: {
        type: 'object',
        properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Deployment' } } },
      },
      CreateDeployment: {
        type: 'object',
        required: ['environment', 'version', 'projectId'],
        properties: {
          environment: { type: 'string', enum: ['dev', 'test', 'prod'] },
          version: { type: 'string', minLength: 1 },
          projectId: { type: 'string' },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          title: { type: 'string' },
          priority: { type: 'string', enum: ['p1', 'p2', 'p3', 'p4'] },
          status: { type: 'string' },
          assigneeId: { type: 'string' },
          slaDueAt: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      TicketList: {
        type: 'object',
        properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Ticket' } } },
      },
      CreateTicket: {
        type: 'object',
        required: ['title'],
        properties: {
          projectId: { type: 'string' },
          title: { type: 'string', minLength: 1 },
          priority: { type: 'string', enum: ['p1', 'p2', 'p3', 'p4'], default: 'p3' },
          assigneeId: { type: 'string' },
        },
      },
      UpdateTicket: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          priority: { type: 'string', enum: ['p1', 'p2', 'p3', 'p4'] },
          assigneeId: { type: 'string' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          authorId: { type: 'string' },
          body: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      CommentList: {
        type: 'object',
        properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Comment' } } },
      },
      CreateComment: {
        type: 'object',
        required: ['entityType', 'entityId', 'body'],
        properties: {
          entityType: { type: 'string', enum: ['project', 'requirement', 'ticket', 'change'] },
          entityId: { type: 'string' },
          body: { type: 'string', minLength: 1 },
        },
      },
      Model: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          provider: { type: 'string' },
          label: { type: 'string' },
        },
      },
      AppDesign: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          headline: { type: 'string' },
          summary: { type: 'string' },
          architecture: { type: 'string' },
          stack: { type: 'array', items: { type: 'string' } },
          dataModel: {
            type: 'object',
            properties: {
              coreEntities: { type: 'array', items: { type: 'string' } },
              relationships: { type: 'array', items: { type: 'string' } },
            },
          },
          integrations: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' }, purpose: { type: 'string' } } },
          },
          security: {
            type: 'object',
            properties: {
              authentication: { type: 'string' },
              authorization: { type: 'string' },
              dataProtection: { type: 'string' },
            },
          },
          estimate: {
            type: 'object',
            properties: {
              effort: { type: 'string', enum: ['XS', 'S', 'M', 'L', 'XL'] },
              tShirt: { type: 'string' },
              weeks: { type: 'number' },
              team: { type: 'array', items: { type: 'string' } },
            },
          },
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, weeks: { type: 'number' }, focus: { type: 'string' } },
            },
          },
          risks: {
            type: 'array',
            items: {
              type: 'object',
              properties: { risk: { type: 'string' }, mitigation: { type: 'string' } },
            },
          },
          readyStories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                story: { type: 'string' },
                acceptance: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          reasoning: { type: 'string' },
        },
      },
      GenerateIdea: {
        type: 'object',
        required: ['userClass', 'appSize', 'audience', 'connectivity'],
        properties: {
          userClass: { type: 'string', enum: ['personal', 'small_team', 'department', 'enterprise'] },
          appSize: { type: 'string', enum: ['small', 'medium', 'large'] },
          audience: { type: 'string', enum: ['internal', 'external'] },
          connectivity: { type: 'boolean' },
          model: { type: 'string' },
          templateId: { type: 'string' },
          ideaText: { type: 'string', maxLength: 2000 },
        },
      },
      Idea: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          authorId: { type: 'string' },
          title: { type: 'string' },
          ideaText: { type: 'string' },
          model: { type: 'string' },
          userClass: { type: 'string' },
          appSize: { type: 'string' },
          audience: { type: 'string' },
          connectivity: { type: 'boolean' },
          design: { $ref: '#/components/schemas/AppDesign' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          publishedProjectId: { type: 'string' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
      IdeaList: {
        type: 'object',
        properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Idea' } } },
      },
      CreateIdea: {
        type: 'object',
        required: ['title', 'ideaText', 'userClass', 'appSize', 'audience', 'connectivity', 'design'],
        properties: {
          title: { type: 'string', minLength: 1 },
          ideaText: { type: 'string', minLength: 1 },
          model: { type: 'string' },
          userClass: { type: 'string', enum: ['personal', 'small_team', 'department', 'enterprise'] },
          appSize: { type: 'string', enum: ['small', 'medium', 'large'] },
          audience: { type: 'string', enum: ['internal', 'external'] },
          connectivity: { type: 'boolean' },
          design: { $ref: '#/components/schemas/AppDesign' },
        },
      },
      UpdateIdea: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          ideaText: { type: 'string', minLength: 1 },
          design: { $ref: '#/components/schemas/AppDesign' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
        },
      },
      PublishIdea: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          businessUnitId: { type: 'string' },
          businessValue: { type: 'number', minimum: 1, maximum: 10 },
          effort: { type: 'string', enum: ['XS', 'S', 'M', 'L', 'XL'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          budget: { type: 'number', minimum: 0 },
        },
      },
      Change: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['standard', 'normal', 'major', 'emergency'] },
          category: { type: 'string', enum: ['infrastructure', 'application', 'data', 'security', 'business'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          risk: { type: 'string', enum: ['low', 'medium', 'high'] },
          status: { type: 'string' },
          reason: { type: 'string' },
          implementationPlan: { type: 'string' },
          rollbackPlan: { type: 'string' },
          testPlan: { type: 'string' },
          projectId: { type: 'string' },
          serviceOwner: { type: 'string' },
          plannedStartAt: { type: 'string' },
          plannedEndAt: { type: 'string' },
          requestedBy: { type: 'string' },
        },
      },
      ChangeList: {
        type: 'object',
        properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Change' } } },
      },
      CreateChange: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          type: { type: 'string', enum: ['standard', 'normal', 'major', 'emergency'], default: 'normal' },
          category: { type: 'string', enum: ['infrastructure', 'application', 'data', 'security', 'business'], default: 'application' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
          risk: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
          reason: { type: 'string' },
          implementationPlan: { type: 'string' },
          rollbackPlan: { type: 'string' },
          testPlan: { type: 'string' },
          projectId: { type: 'string' },
          serviceOwner: { type: 'string' },
          plannedStartAt: { type: 'string' },
          plannedEndAt: { type: 'string' },
        },
      },
      UpdateChange: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['standard', 'normal', 'major', 'emergency'] },
          category: { type: 'string', enum: ['infrastructure', 'application', 'data', 'security', 'business'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          risk: { type: 'string', enum: ['low', 'medium', 'high'] },
          reason: { type: 'string' },
          implementationPlan: { type: 'string' },
          rollbackPlan: { type: 'string' },
          testPlan: { type: 'string' },
          projectId: { type: 'string' },
          serviceOwner: { type: 'string' },
          plannedStartAt: { type: 'string' },
          plannedEndAt: { type: 'string' },
        },
      },
      CreateChangeTask: {
        type: 'object',
        required: ['title'],
        properties: { title: { type: 'string', minLength: 1 } },
      },
      UpdateChangeTask: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          assigneeId: { type: 'string' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
        },
      },
      ChangeTask: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          changeId: { type: 'string' },
          title: { type: 'string' },
          assigneeId: { type: 'string' },
          status: { type: 'string' },
          position: { type: 'number' },
        },
      },
      ApproveChange: {
        type: 'object',
        required: ['decision'],
        properties: {
          decision: { type: 'string', enum: ['pending', 'approved', 'rejected', 'changes_requested'] },
          comment: { type: 'string' },
        },
      },
      ScheduleChange: {
        type: 'object',
        required: ['plannedStartAt', 'plannedEndAt'],
        properties: {
          plannedStartAt: { type: 'string' },
          plannedEndAt: { type: 'string' },
        },
      },
      CreateChangeWindow: {
        type: 'object',
        required: ['name', 'startAt', 'endAt'],
        properties: {
          name: { type: 'string', minLength: 1 },
          kind: { type: 'string', enum: ['window', 'freeze'], default: 'window' },
          startAt: { type: 'string' },
          endAt: { type: 'string' },
          scope: { type: 'string' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          kind: { type: 'string' },
          read: { type: 'boolean' },
          createdAt: { type: 'string' },
        },
      },
      NotificationList: {
        type: 'object',
        properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Notification' } } },
      },
      GeneratorSettings: {
        type: 'object',
        properties: {
          techStack: { type: 'array', items: { type: 'string' } },
          authMode: { type: 'string', enum: ['jwt', 'sso', 'jwt_sso'] },
          defaultDatabase: { type: 'string', enum: ['turso', 'azure_sql', 'postgres', 'sqlite'] },
          productionDatabase: { type: 'string', enum: ['turso', 'azure_sql', 'postgres', 'sqlite'] },
          updatedAt: { type: 'string' },
        },
      },
      GeneratorSettingsInput: {
        type: 'object',
        required: ['techStack', 'authMode', 'defaultDatabase', 'productionDatabase'],
        properties: {
          techStack: { type: 'array', items: { type: 'string' }, minItems: 1 },
          authMode: { type: 'string', enum: ['jwt', 'sso', 'jwt_sso'] },
          defaultDatabase: { type: 'string', enum: ['turso', 'azure_sql', 'postgres', 'sqlite'] },
          productionDatabase: { type: 'string', enum: ['turso', 'azure_sql', 'postgres', 'sqlite'] },
        },
      },
    },
  },
};

export default spec;
