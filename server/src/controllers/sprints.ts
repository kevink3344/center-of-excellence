import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sprints, deployments, projects } from '../db/schema';
import { ApiError } from '../middleware/error';
import { createSprintSchema, createDeploymentSchema } from '@eidh/shared';

export async function listSprints(req: any, res: any) {
  const rows = await db.query.sprints.findMany({ where: eq(sprints.projectId, req.params.id) });
  res.json({ data: rows });
}

export async function createSprint(req: any, res: any) {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, req.params.id) });
  if (!project) throw new ApiError(404, 'NOT_FOUND', 'Project not found');
  const body = req.validated?.body as ReturnType<typeof createSprintSchema.parse>;
  const [row] = await db
    .insert(sprints)
    .values({ ...body, projectId: req.params.id })
    .returning();
  res.status(201).json({ data: row });
}

export async function listDeployments(req: any, res: any) {
  const rows = await db.query.deployments.findMany({ where: eq(deployments.projectId, req.params.id) });
  res.json({ data: rows });
}

export async function createDeployment(req: any, res: any) {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, req.params.id) });
  if (!project) throw new ApiError(404, 'NOT_FOUND', 'Project not found');
  const body = req.validated?.body as ReturnType<typeof createDeploymentSchema.parse>;
  const [row] = await db
    .insert(deployments)
    .values({ ...body, projectId: req.params.id })
    .returning();
  res.status(201).json({ data: row });
}
