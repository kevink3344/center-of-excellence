import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import {
  changeRequests,
  changeTasks,
  changeApprovals,
  changeWindows,
  cabMembers,
  notifications,
} from '../db/schema';
import { ApiError } from '../middleware/error';
import {
  createChangeRequestSchema,
  updateChangeRequestSchema,
  createChangeTaskSchema,
  updateChangeTaskSchema,
  approveChangeSchema,
  scheduleChangeSchema,
  createChangeWindowSchema,
} from '@eidh/shared';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function notify(userId: string | null | undefined, kind: string, title: string, body: string, entityId?: string) {
  if (!userId) return;
  return db.insert(notifications).values({ userId, kind, title, body, entityType: 'change', entityId });
}

async function changeWindowOverlap(startAt: string, endAt: string, excludeId?: string) {
  const windows = await db.query.changeWindows.findMany({
    where: and(eq(changeWindows.kind, 'freeze')),
  });
  return windows.some((w) => {
    if (excludeId && w.id === excludeId) return false;
    const wStart = new Date(w.startAt).getTime();
    const wEnd = new Date(w.endAt).getTime();
    const s = new Date(startAt).getTime();
    const e = new Date(endAt).getTime();
    return s < wEnd && e > wStart; // overlap
  });
}

// ─────────────────────────────────────────────
// CRUD: change requests
// ─────────────────────────────────────────────
export async function listChangeRequests(req: any, res: any) {
  const { status, type, priority, projectId, requestedBy } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (priority) where.priority = priority;
  if (projectId) where.projectId = projectId;
  if (requestedBy) where.requestedBy = requestedBy;

  const rows = await db.query.changeRequests.findMany({
    where: Object.keys(where).length ? where : undefined,
    with: { project: true, requestedBy: true, serviceOwner: true, tasks: true, approvals: { with: { approver: true } } },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
  res.json({ data: rows });
}

export async function getChangeRequest(req: any, res: any) {
  const row = await db.query.changeRequests.findFirst({
    where: eq(changeRequests.id, req.params.id),
    with: {
      project: true,
      requestedBy: true,
      serviceOwner: true,
      tasks: { with: { assignee: true } },
      approvals: { with: { approver: true } },
    },
  });
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  res.json({ data: row });
}

export async function createChangeRequest(req: any, res: any) {
  const body = req.validated?.body as ReturnType<typeof createChangeRequestSchema.parse>;
  const [row] = await db
    .insert(changeRequests)
    .values({ ...body, requestedBy: req.user?.id })
    .returning();
  res.status(201).json({ data: row });
}

export async function updateChangeRequest(req: any, res: any) {
  const existing = await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, req.params.id) });
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  if (existing.status !== 'draft') throw new ApiError(409, 'CONFLICT', 'Only draft changes can be edited');

  const data = req.validated?.body as ReturnType<typeof updateChangeRequestSchema.parse>;
  const [row] = await db
    .update(changeRequests)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(changeRequests.id, req.params.id))
    .returning();
  res.json({ data: row });
}

export async function deleteChangeRequest(req: any, res: any) {
  const existing = await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, req.params.id) });
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  if (!['draft', 'cancelled'].includes(existing.status)) {
    throw new ApiError(409, 'CONFLICT', 'Only draft or cancelled changes can be deleted');
  }
  await db.delete(changeRequests).where(eq(changeRequests.id, req.params.id));
  res.status(204).end();
}

// ─────────────────────────────────────────────
// Lifecycle transitions
// ─────────────────────────────────────────────
export async function submitChange(req: any, res: any) {
  const change = await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, req.params.id) });
  if (!change) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  if (change.status !== 'draft') throw new ApiError(409, 'CONFLICT', 'Only draft changes can be submitted');
  if (['normal', 'major', 'emergency'].includes(change.type) && !change.rollbackPlan) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Rollback plan is required for this change type');
  }

  // Create pending approval rows for each CAB member (fixed roles).
  const cab = await db.query.cabMembers.findMany({ where: eq(cabMembers.memberType, 'cab_member') });
  for (const member of cab) {
    await db
      .insert(changeApprovals)
      .values({ changeId: change.id, approverId: member.userId, roleLabel: 'cab_member', stage: 1 });
  }
  // If no CAB members configured, fall through — an executive approval is still possible below.

  const [row] = await db
    .update(changeRequests)
    .set({ status: 'pending_approval', updatedAt: new Date().toISOString() })
    .where(eq(changeRequests.id, change.id))
    .returning();

  // Notify approvers of the new request.
  for (const member of cab) {
    await notify(
      member.userId,
      'approval_requested',
      'Change approval requested',
      `"${change.title}" is awaiting your approval.`,
      change.id,
    );
  }

  res.json({ data: row });
}

export async function approveChange(req: any, res: any) {
  const change = await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, req.params.id) });
  if (!change) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  if (change.status !== 'pending_approval') {
    throw new ApiError(409, 'CONFLICT', 'Change is not awaiting approval');
  }

  const body = req.validated?.body as ReturnType<typeof approveChangeSchema.parse>;
  const user = req.user;

  // Emergency path: executive-only, bypass stricter CAB quorum. Normal path can be CAB or exec.
  if (change.type === 'emergency' && user?.role !== 'executive') {
    throw new ApiError(403, 'FORBIDDEN', 'Only executives can approve emergency changes');
  }

  // Record the decision.
  const [approval] = await db
    .insert(changeApprovals)
    .values({
      changeId: change.id,
      approverId: user?.id,
      roleLabel: user?.role,
      decision: body.decision,
      comment: body.comment,
      decidedAt: new Date().toISOString(),
    })
    .returning();

  if (body.decision === 'changes_requested') {
    await db
      .update(changeRequests)
      .set({ status: 'draft', updatedAt: new Date().toISOString() })
      .where(eq(changeRequests.id, change.id))
      .returning();
    await notify(change.requestedBy, 'change_rejected', 'Changes requested', `"${change.title}" needs changes.`, change.id);
    res.json({ data: { ...change, status: 'draft' } });
    return;
  }

  if (body.decision === 'rejected') {
    await db
      .update(changeRequests)
      .set({ status: 'rejected', updatedAt: new Date().toISOString() })
      .where(eq(changeRequests.id, change.id))
      .returning();
    await notify(change.requestedBy, 'change_rejected', 'Change rejected', `"${change.title}" was rejected.`, change.id);
    res.json({ data: { ...change, status: 'rejected' } });
    return;
  }

  // approved: an executive has override authority and finalizes immediately,
  // otherwise require all CAB-member approvals to clear (emergency is exec-only).
  const executiveOverride = user?.role === 'executive';
  if (!executiveOverride) {
    const pending = await db.query.changeApprovals.findMany({
      where: and(eq(changeApprovals.changeId, change.id), eq(changeApprovals.decision, 'pending')),
    });
    if (pending.length > 0 && change.type !== 'emergency') {
      // Still waiting on other CAB members.
      res.json({ data: { ...change, status: 'pending_approval' } });
      return;
    }
  }

  const [row] = await db
    .update(changeRequests)
    .set({ status: 'approved', updatedAt: new Date().toISOString() })
    .where(eq(changeRequests.id, change.id))
    .returning();
  await notify(change.requestedBy, 'change_approved', 'Change approved', `"${change.title}" was approved.`, change.id);
  res.json({ data: row });
}

export async function scheduleChange(req: any, res: any) {
  const change = await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, req.params.id) });
  if (!change) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  if (change.status !== 'approved') throw new ApiError(409, 'CONFLICT', 'Change must be approved before scheduling');

  const body = req.validated?.body as ReturnType<typeof scheduleChangeSchema.parse>;
  const overlap = await changeWindowOverlap(body.plannedStartAt, body.plannedEndAt);
  if (overlap) throw new ApiError(409, 'CONFLICT', 'Requested window overlaps a change freeze');

  const [row] = await db
    .update(changeRequests)
    .set({ plannedStartAt: body.plannedStartAt, plannedEndAt: body.plannedEndAt, status: 'scheduled', updatedAt: new Date().toISOString() })
    .where(eq(changeRequests.id, change.id))
    .returning();
  res.json({ data: row });
}

export async function implementChange(req: any, res: any) {
  const change = await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, req.params.id) });
  if (!change) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  if (!['scheduled', 'approved'].includes(change.status)) {
    throw new ApiError(409, 'CONFLICT', 'Change must be scheduled before implementation');
  }
  const overlap = await changeWindowOverlap(change.plannedStartAt ?? new Date().toISOString(), change.plannedEndAt ?? new Date().toISOString());
  if (overlap) throw new ApiError(409, 'CONFLICT', 'Cannot implement during a change freeze');

  const [row] = await db
    .update(changeRequests)
    .set({ status: 'in_implementation', actualStartAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(changeRequests.id, change.id))
    .returning();
  res.json({ data: row });
}

export async function completeChange(req: any, res: any) {
  const change = await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, req.params.id) });
  if (!change) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  if (!['in_implementation', 'testing'].includes(change.status)) {
    throw new ApiError(409, 'CONFLICT', 'Change must be in implementation or testing to complete');
  }
  const [row] = await db
    .update(changeRequests)
    .set({ status: 'closed', actualEndAt: new Date().toISOString(), implementedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(changeRequests.id, change.id))
    .returning();
  res.json({ data: row });
}

export async function rollbackChange(req: any, res: any) {
  const change = await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, req.params.id) });
  if (!change) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  if (!['in_implementation', 'testing', 'closed'].includes(change.status)) {
    throw new ApiError(409, 'CONFLICT', 'Change cannot be rolled back from its current state');
  }
  const [row] = await db
    .update(changeRequests)
    .set({ status: 'rolled_back', actualEndAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(changeRequests.id, change.id))
    .returning();
  res.json({ data: row });
}

export async function cancelChange(req: any, res: any) {
  const change = await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, req.params.id) });
  if (!change) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  if (!['draft', 'pending_approval', 'approved', 'scheduled'].includes(change.status)) {
    throw new ApiError(409, 'CONFLICT', 'Change cannot be cancelled from its current state');
  }
  const [row] = await db
    .update(changeRequests)
    .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
    .where(eq(changeRequests.id, change.id))
    .returning();
  res.json({ data: row });
}

// ─────────────────────────────────────────────
// Tasks
// ─────────────────────────────────────────────
export async function addChangeTask(req: any, res: any) {
  const change = await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, req.params.id) });
  if (!change) throw new ApiError(404, 'NOT_FOUND', 'Change request not found');
  const body = req.validated?.body as ReturnType<typeof createChangeTaskSchema.parse>;
  const count = await db.select().from(changeTasks).all();
  const [row] = await db
    .insert(changeTasks)
    .values({ ...body, changeId: req.params.id, position: count.length })
    .returning();
  res.status(201).json({ data: row });
}

export async function updateChangeTask(req: any, res: any) {
  const body = req.validated?.body as ReturnType<typeof updateChangeTaskSchema.parse>;
  const [row] = await db
    .update(changeTasks)
    .set(body)
    .where(eq(changeTasks.id, req.params.taskId))
    .returning();
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Task not found');
  res.json({ data: row });
}

// ─────────────────────────────────────────────
// Windows
// ─────────────────────────────────────────────
export async function listChangeWindows(req: any, res: any) {
  const rows = await db.query.changeWindows.findMany({ orderBy: (w, { asc }) => [asc(w.startAt)] });
  res.json({ data: rows });
}

export async function createChangeWindow(req: any, res: any) {
  const body = req.validated?.body as ReturnType<typeof createChangeWindowSchema.parse>;
  const [row] = await db.insert(changeWindows).values(body).returning();
  res.status(201).json({ data: row });
}

export async function getChangeCalendar(req: any, res: any) {
  const [changes, windows] = await Promise.all([
    db.query.changeRequests.findMany({
      with: { project: true },
      orderBy: (c, { asc }) => [asc(c.plannedStartAt)],
    }),
    db.query.changeWindows.findMany({ orderBy: (w, { asc }) => [asc(w.startAt)] }),
  ]);
  // Only include changes that have a planned window.
  const scheduled = changes.filter((c) => c.plannedStartAt && c.plannedEndAt);
  res.json({ data: { changes: scheduled, windows } });
}
