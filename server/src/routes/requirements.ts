import { Router } from 'express';
import { listRequirements, createRequirement } from '../controllers/requirements';
import { validate } from '../middleware/validate';
import { createRequirementSchema } from '@eidh/shared';

const router = Router({ mergeParams: true });

// GET /api/v1/projects/:id/requirements
router.get('/requirements', listRequirements);
// POST /api/v1/projects/:id/requirements
router.post('/requirements', validate(createRequirementSchema, 'body'), createRequirement);

export default router;
