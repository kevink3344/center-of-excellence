import { eq } from 'drizzle-orm';
import { db } from '../db';
import { requirements, projects } from '../db/schema';
import { ApiError } from '../middleware/error';
import { createRequirementSchema } from '@eidh/shared';

export async function listRequirements(req: any, res: any) {
  const rows = await db.query.requirements.findMany({
    where: eq(requirements.projectId, req.params.id),
    with: { assignee: true },
  });
  res.json({ data: rows });
}

export async function createRequirement(req: any, res: any) {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, req.params.id) });
  if (!project) throw new ApiError(404, 'NOT_FOUND', 'Project not found');

  const body = req.validated?.body as ReturnType<typeof createRequirementSchema.parse>;
  const [row] = await db
    .insert(requirements)
    .values({ ...body, projectId: req.params.id })
    .returning();
  res.status(201).json({ data: row });
}
