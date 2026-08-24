import { eq } from 'drizzle-orm';
import { db } from '../db';
import { supportTickets, projects } from '../db/schema';
import { ApiError } from '../middleware/error';
import { createTicketSchema, updateTicketSchema } from '@eidh/shared';

export async function listTickets(req: any, res: any) {
  const { status, projectId, mine } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  if (mine === 'true') where.assigneeId = req.user?.id;
  const rows = await db.query.supportTickets.findMany({
    where: Object.keys(where).length ? where : undefined,
    with: { project: true, assignee: true, reportedBy: true },
  });
  res.json({ data: rows });
}

export async function createTicket(req: any, res: any) {
  const body = req.validated?.body as ReturnType<typeof createTicketSchema.parse>;
  // If a project is referenced, ensure it exists.
  if (body.projectId) {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, body.projectId) });
    if (!project) throw new ApiError(404, 'NOT_FOUND', 'Project not found');
  }
  const [row] = await db
    .insert(supportTickets)
    .values({ ...body, reportedBy: req.user?.id })
    .returning();
  res.status(201).json({ data: row });
}

export async function updateTicket(req: any, res: any) {
  const body = req.validated?.body as ReturnType<typeof updateTicketSchema.parse>;
  const [row] = await db
    .update(supportTickets)
    .set(body)
    .where(eq(supportTickets.id, req.params.id))
    .returning();
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Ticket not found');
  res.json({ data: row });
}
