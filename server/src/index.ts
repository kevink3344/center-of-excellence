import 'express-async-errors'; // Patches Express so async route errors reach the error handler instead of crashing the process.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import projectsRouter from './routes/projects';
import requirementsRouter from './routes/requirements';
import sprintsRouter from './routes/sprints';
import supportRouter from './routes/support';
import usersRouter from './routes/users';
import commentsRouter from './routes/comments';
import aiRouter from './routes/ai';
import ideasRouter from './routes/ideas';
import settingsRouter from './routes/settings';
import changeRouter from './routes/change';
import notificationsRouter from './routes/notifications';
import apiDocsRouter from './routes/apidocs';
import { errorHandler, notFound } from './middleware/error';
import { requireAuth } from './middleware/auth';
import { env } from './config/env';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health probe (spec §8 — TODO table note).
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Protect all API routes behind auth (dev stub injects a user).
app.use('/api/v1/projects', requireAuth, projectsRouter);
app.use('/api/v1/projects/:id', requireAuth, requirementsRouter);
app.use('/api/v1/projects/:id', requireAuth, sprintsRouter);
app.use('/api/v1/support/tickets', requireAuth, supportRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/comments', requireAuth, commentsRouter);
app.use('/api/v1/ai', requireAuth, aiRouter);
app.use('/api/v1/ideas', requireAuth, ideasRouter);
app.use('/api/v1/settings', requireAuth, settingsRouter);
app.use('/api/v1/change', requireAuth, changeRouter);
app.use('/api/v1/notifications', requireAuth, notificationsRouter);

// Swagger UI + raw OpenAPI JSON (public, no auth — dev/docs only).
app.use('/', apiDocsRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 EIDH API listening on http://localhost:${env.PORT}`);
});
