import { Router } from 'express';
import {
  getGeneratorSettingsHandler,
  updateGeneratorSettingsHandler,
} from '../controllers/settings';
import { generatorSettingsSchema } from '@eidh/shared';
import { validate } from '../middleware/validate';

const router = Router();

// GET /api/v1/settings/generator — read generator defaults.
router.get('/generator', getGeneratorSettingsHandler);

// PUT /api/v1/settings/generator — update generator defaults.
router.put('/generator', validate(generatorSettingsSchema, 'body'), updateGeneratorSettingsHandler);

export default router;
