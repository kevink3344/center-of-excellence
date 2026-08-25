import { Router } from 'express';
import { getModels } from '../controllers/ai';

const router = Router();

// GET /api/v1/ai/models — list selectable AI models (from .env AI_MODELS).
router.get('/models', getModels);

export default router;
