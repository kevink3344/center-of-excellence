import { Router } from 'express';
import { me, listUsers } from '../controllers/users';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/v1/users/me (spec §8.1)
router.get('/me', requireAuth, me);
// GET /api/v1/users (helpers for PM/assignee pickers)
router.get('/', listUsers);

export default router;
