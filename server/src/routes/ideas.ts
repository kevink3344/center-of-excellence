import { Router } from 'express';
import {
  generateIdea,
  createIdea,
  listIdeas,
  getIdea,
  updateIdea,
  publishIdea,
  deleteIdea,
} from '../controllers/ideas';
import {
  generateIdeaSchema,
  createIdeaSchema,
  updateIdeaSchema,
  publishIdeaSchema,
} from '@eidh/shared';
import { validate } from '../middleware/validate';

const router = Router();

// POST /api/v1/ideas/generate — generate an AppDesign (AI, fallback deterministic).
router.post('/generate', validate(generateIdeaSchema, 'body'), generateIdea);

// POST /api/v1/ideas — save generated design as a draft.
router.post('/', validate(createIdeaSchema, 'body'), createIdea);

// GET /api/v1/ideas — list drafts.
router.get('/', listIdeas);

// GET /api/v1/ideas/:id — get one draft.
router.get('/:id', getIdea);

// PATCH /api/v1/ideas/:id — update draft (edit design).
router.patch('/:id', validate(updateIdeaSchema, 'body'), updateIdea);

// POST /api/v1/ideas/:id/publish — publish draft → project.
router.post('/:id/publish', validate(publishIdeaSchema, 'body'), publishIdea);

// DELETE /api/v1/ideas/:id — archive a draft.
router.delete('/:id', deleteIdea);

export default router;
