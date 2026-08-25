import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import {
  applicationIdeas,
  projects,
  projectMembers,
  requirements,
  notifications,
} from '../db/schema';
import { ApiError } from '../middleware/error';
import {
  appDesignSchema,
  createIdeaSchema,
  generateIdeaSchema,
  publishIdeaSchema,
  updateIdeaSchema,
  type GenerateIdeaInput,
  type CreateIdeaInput,
  type UpdateIdeaInput,
  type PublishIdeaInput,
} from '@eidh/shared';
import { defaultModel, modelCatalog } from '../ai/provider';
import { generateIdeaDesign } from '../ai/ideas';
import { getGeneratorSettings } from '../config/generatorSettings';

// Validate the requested model against the catalog (prevent arbitrary injection).
function validateModel(model?: string): string {
  const catalog = modelCatalog();
  const chosen = model || defaultModel();
  const match = catalog.find((m) => m.id === chosen) || catalog[0];
  return match?.id ?? chosen;
}

// POST /api/v1/ideas/generate — generate an AppDesign for the wizard answers.
// Tries AI with the selected model; on failure the client falls back to its
// deterministic engine (503 AI_UNAVAILABLE).
export async function generateIdea(req: any, res: any) {
  const body = req.validated?.body as GenerateIdeaInput;
  // Support both { ideaText, ...answers } and { idea, answers } shapes.
  const ideaText = body.ideaText || (body as any).ideaText;
  if (!ideaText) throw new ApiError(400, 'VALIDATION_ERROR', 'ideaText is required');
  const model = validateModel(body.model);

  try {
    const settings = await getGeneratorSettings();
    const design = await generateIdeaDesign(ideaText, body, model, settings);
    res.json({ data: design, meta: { model } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Idea generation failed';
    throw new ApiError(503, 'AI_UNAVAILABLE', message || 'AI service unavailable');
  }
}

// POST /api/v1/ideas — save a generated design as a draft.
export async function createIdea(req: any, res: any) {
  const body = req.validated?.body as CreateIdeaInput;
  const design = appDesignSchema.parse(body.design);
  const [row] = await db
    .insert(applicationIdeas)
    .values({
      authorId: req.user?.id,
      title: body.title,
      ideaText: body.ideaText,
      model: body.model,
      userClass: body.userClass,
      appSize: body.appSize,
      audience: body.audience,
      connectivity: body.connectivity,
      design: JSON.stringify(design),
      status: 'draft',
    })
    .returning();
  res.status(201).json({ data: row });
}

// GET /api/v1/ideas — list drafts (optionally filter by status / authorId).
export async function listIdeas(req: any, res: any) {
  const conds = [];
  if (req.query.status) conds.push(eq(applicationIdeas.status, req.query.status));
  if (req.query.authorId) conds.push(eq(applicationIdeas.authorId, req.query.authorId));

  const rows = await db.query.applicationIdeas.findMany({
    where: conds.length ? and(...conds) : undefined,
    orderBy: (i, { desc }) => [desc(i.createdAt)],
  });
  res.json({ data: rows });
}

// GET /api/v1/ideas/:id — get one draft (full design).
export async function getIdea(req: any, res: any) {
  const row = await db.query.applicationIdeas.findFirst({
    where: eq(applicationIdeas.id, req.params.id),
  });
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Idea not found');
  res.json({ data: row });
}

// PATCH /api/v1/ideas/:id — update a draft (edit design).
export async function updateIdea(req: any, res: any) {
  const data = req.validated?.body as UpdateIdeaInput;
  const patch: any = { ...data };
  if (data.design && typeof data.design !== 'string') {
    patch.design = JSON.stringify(data.design);
  }
  patch.updatedAt = new Date().toISOString();
  const [row] = await db
    .update(applicationIdeas)
    .set(patch)
    .where(eq(applicationIdeas.id, req.params.id))
    .returning();
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Idea not found');
  res.json({ data: row });
}

// POST /api/v1/ideas/:id/publish — publish draft → create project (+ seed reqs).
export async function publishIdea(req: any, res: any) {
  const body = req.validated?.body as PublishIdeaInput;
  const idea = await db.query.applicationIdeas.findFirst({
    where: eq(applicationIdeas.id, req.params.id),
  });
  if (!idea) throw new ApiError(404, 'NOT_FOUND', 'Idea not found');
  if (idea.status === 'published') throw new ApiError(409, 'CONFLICT', 'IDEA_ALREADY_PUBLISHED');
  if (idea.status === 'archived') throw new ApiError(409, 'CONFLICT', 'Idea is archived');

  const design = JSON.parse(idea.design) as ReturnType<typeof appDesignSchema.parse>;

  // Derive score & priority heuristics from the design estimate.
  const effortMap: Record<string, number> = { XS: 5, S: 4, M: 3, L: 2, XL: 1 };
  const effortScore = design.estimate ? effortMap[design.estimate.effort] : 3;
  const priority = body.priority || (design.estimate?.weeks && design.estimate.weeks <= 8 ? 'high' : 'medium');

  let projectId: string;
  if (body.projectId) {
    // Publish into an existing project (assume caller verified it exists).
    projectId = body.projectId;
  } else {
    const ptitle = body.title || idea.title;
    const [project] = await db
      .insert(projects)
      .values({
        title: ptitle,
        description: body.description || design.summary,
        status: 'intake',
        priority,
        score: Math.round((body.businessValue ?? 5) * effortScore),
        budget: body.budget,
        businessUnitId: body.businessUnitId,
        requestorId: idea.authorId,
      })
      .returning();
    projectId = project.id;
  }

  // Optionally seed requirements from design.readyStories.
  if (design.readyStories?.length && !body.projectId) {
    for (const s of design.readyStories) {
      await db.insert(requirements).values({
        projectId,
        title: s.title,
        type: 'user_story',
        story: s.story,
        acceptanceCriteria: s.acceptance.join('\n'),
        status: 'backlog',
      });
    }
  }

  // Update the draft → published.
  const [updatedIdea] = await db
    .update(applicationIdeas)
    .set({ status: 'published', publishedProjectId: projectId, updatedAt: new Date().toISOString() })
    .where(eq(applicationIdeas.id, idea.id))
    .returning();

  // Notify the author.
  await db.insert(notifications).values({
    userId: idea.authorId,
    kind: 'idea_published',
    title: 'Idea published',
    body: `Your idea '${idea.title}' was published as a project.`,
    entityType: 'project',
    entityId: projectId,
  });

  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  res.json({ data: { idea: updatedIdea, project } });
}

// DELETE /api/v1/ideas/:id — archive a draft.
export async function deleteIdea(req: any, res: any) {
  const [row] = await db
    .update(applicationIdeas)
    .set({ status: 'archived', updatedAt: new Date().toISOString() })
    .where(eq(applicationIdeas.id, req.params.id))
    .returning();
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Idea not found');
  res.json({ data: row });
}
