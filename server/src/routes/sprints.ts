import { Router } from 'express';
import {
  listSprints,
  createSprint,
  listDeployments,
  createDeployment,
} from '../controllers/sprints';
import { validate } from '../middleware/validate';
import { createSprintSchema, createDeploymentSchema } from '@eidh/shared';

const router = Router({ mergeParams: true });

// GET /api/v1/projects/:id/sprints
router.get('/sprints', listSprints);
// POST /api/v1/projects/:id/sprints
router.post('/sprints', validate(createSprintSchema, 'body'), createSprint);
// GET /api/v1/projects/:id/deployments
router.get('/deployments', listDeployments);
// POST /api/v1/projects/:id/deployments
router.post('/deployments', validate(createDeploymentSchema, 'body'), createDeployment);

export default router;
