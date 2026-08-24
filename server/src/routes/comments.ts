import { Router } from 'express';
import { listComments, createComment } from '../controllers/comments';
import { validate } from '../middleware/validate';
import { createCommentSchema } from '@eidh/shared';

const router = Router();

// GET /api/v1/comments?entityType=project&entityId=...
router.get('/', listComments);
// POST /api/v1/comments
router.post('/', validate(createCommentSchema, 'body'), createComment);

export default router;
