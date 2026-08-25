import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import openApiSpec from '../openapi';

const router = Router();

// Serve the raw OpenAPI JSON (so tools/Swagger can fetch it).
router.get('/api-docs.json', (_req, res) => {
  res.json(openApiSpec);
});

// Serve the interactive Swagger UI.
router.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'EIDH API Docs',
    customCss: '.swagger-ui .topbar { display: none; }',
    explorer: true,
  }),
);

export default router;
