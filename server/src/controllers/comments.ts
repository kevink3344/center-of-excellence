import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { comments } from '../db/schema';
import { ApiError } from '../middleware/error';
import { createCommentSchema } from '@eidh/shared';

export async function listComments(req: any, res: any) {
  const { entityType, entityId } = req.query;
  const rows = await db.query.comments.findMany({
    where: and(eq(comments.entityType, entityType), eq(comments.entityId, entityId)),
    with: { author: true },
    orderBy: (c, { asc }) => [asc(c.createdAt)],
  });
  res.json({ data: rows });
}

export async function createComment(req: any, res: any) {
  const body = req.validated?.body as ReturnType<typeof createCommentSchema.parse>;
  const [row] = await db
    .insert(comments)
    .values({ ...body, authorId: req.user?.id })
    .returning();
  res.status(201).json({ data: row });
}
