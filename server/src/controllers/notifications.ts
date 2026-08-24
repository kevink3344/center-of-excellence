import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { notifications } from '../db/schema';
import { ApiError } from '../middleware/error';

export async function listNotifications(req: any, res: any) {
  const rows = await db.query.notifications.findMany({
    where: eq(notifications.userId, req.user?.id),
    orderBy: (n, { desc }) => [desc(n.createdAt)],
  });
  res.json({ data: rows });
}

export async function getUnreadCount(req: any, res: any) {
  const rows = await db.query.notifications.findMany({
    where: and(eq(notifications.userId, req.user?.id), eq(notifications.read, false)),
  });
  res.json({ data: { count: rows.length } });
}

export async function markRead(req: any, res: any) {
  const [row] = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, req.params.id))
    .returning();
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Notification not found');
  res.json({ data: row });
}

export async function markAllRead(req: any, res: any) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, req.user?.id))
    .returning();
  res.json({ data: { ok: true } });
}
