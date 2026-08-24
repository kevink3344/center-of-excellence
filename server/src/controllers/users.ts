import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { ApiError } from '../middleware/error';

// Currently authenticated user (spec §8 GET /users/me).
export async function me(req: any, res: any) {
  // Dev stub; in prod this reads the JWT sub → DB.
  res.json({ data: req.user ?? { id: 'dev-0001', role: 'executive' } });
}

export async function listUsers(_req: any, res: any) {
  const rows = await db.query.users.findMany({ columns: { id: true, email: true, name: true, role: true } });
  res.json({ data: rows });
}
