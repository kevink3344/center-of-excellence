import { Router } from 'express';
import { listProjects, getProject, createProject, updateProject, deleteProject } from '../controllers/projects';
import { validate } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema, paginationSchema } from '@eidh/shared';

const router = Router();

// GET /api/v1/projects — list/filter (spec §8.1). Query filter by status/bu/priority via page params.
router.get('/', validate(paginationSchema, 'query'), listProjects);
// POST /api/v1/projects — create/intake
router.post('/', validate(createProjectSchema, 'body'), createProject);
// GET /api/v1/projects/:id
router.get('/:id', getProject);
// PATCH /api/v1/projects/:id
router.patch('/:id', validate(updateProjectSchema, 'body'), updateProject);
// DELETE /api/v1/projects/:id
router.delete('/:id', deleteProject);

export default router;
