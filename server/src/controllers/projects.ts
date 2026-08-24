import { eq } from 'drizzle-orm';
import { db } from '../db';
import { projects, projectMembers, businessUnits } from '../db/schema';
import { ApiError } from '../middleware/error';
import { createProjectSchema, updateProjectSchema } from '@eidh/shared';

export async function listProjects(req: any, res: any) {
  const { status, businessUnitId, priority } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (businessUnitId) where.businessUnitId = businessUnitId;
  if (priority) where.priority = priority;

  const rows = await db.query.projects.findMany({
    where: Object.keys(where).length ? where : undefined,
    with: { businessUnit: true, requestor: true, pm: true },
  });
  res.json({ data: rows });
}

export async function getProject(req: any, res: any) {
  const row = await db.query.projects.findFirst({
    where: eq(projects.id, req.params.id),
    with: {
      businessUnit: true,
      requestor: true,
      pm: true,
      members: { with: { user: true } },
      requirements: { with: { assignee: true } },
      sprints: true,
      deployments: true,
      tickets: true,
    },
  });
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Project not found');
  res.json({ data: row });
}

export async function createProject(req: any, res: any) {
  const body = req.validated?.body as ReturnType<typeof createProjectSchema.parse>;
  const { businessValue, effort, ...rest } = body;
  // WSJF-style score derived from business value & effort (spec §8.2).
  const effortMap: Record<string, number> = { XS: 5, S: 4, M: 3, L: 2, XL: 1 };
  const score = Math.round((businessValue ?? 0) * (effort ? effortMap[effort] : 1));
  const [row] = await db
    .insert(projects)
    .values({ ...rest, score })
    .returning();
  // Auto-add the requestor as a member if provided.
  if (rest.requestorId) {
    await db.insert(projectMembers).values({ projectId: row.id, userId: rest.requestorId });
  }
  res.status(201).json({ data: row });
}

export async function updateProject(req: any, res: any) {
  const data = req.validated?.body as ReturnType<typeof updateProjectSchema.parse>;
  const [row] = await db.update(projects).set(data).where(eq(projects.id, req.params.id)).returning();
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Project not found');
  res.json({ data: row });
}

export async function deleteProject(req: any, res: any) {
  await db.delete(projects).where(eq(projects.id, req.params.id));
  res.status(204).end();
}
