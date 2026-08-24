import { Router } from 'express';
import { generateStory } from '../controllers/ai';
import { validate } from '../middleware/validate';
import { generateStorySchema } from '@eidh/shared';

const router = Router();

// POST /api/v1/ai/story
router.post('/story', validate(generateStorySchema, 'body'), generateStory);

export default router;
