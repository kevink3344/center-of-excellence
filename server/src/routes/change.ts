import { Router } from 'express';
import {
  listChangeRequests,
  getChangeRequest,
  createChangeRequest,
  updateChangeRequest,
  deleteChangeRequest,
  submitChange,
  approveChange,
  scheduleChange,
  implementChange,
  completeChange,
  rollbackChange,
  cancelChange,
  addChangeTask,
  updateChangeTask,
  listChangeWindows,
  createChangeWindow,
  getChangeCalendar,
} from '../controllers/change';
import { validate } from '../middleware/validate';
import { requireRole } from '../middleware/auth';
import {
  createChangeRequestSchema,
  updateChangeRequestSchema,
  createChangeTaskSchema,
  updateChangeTaskSchema,
  approveChangeSchema,
  scheduleChangeSchema,
  createChangeWindowSchema,
} from '@eidh/shared';

const router = Router();

// ── Calendar & windows ──
router.get('/calendar', getChangeCalendar);
router.get('/windows', listChangeWindows);
router.post('/windows', validate(createChangeWindowSchema, 'body'), requireRole('executive', 'pm'), createChangeWindow);

// ── Change requests ──
router.get('/requests', listChangeRequests);
router.post('/requests', validate(createChangeRequestSchema, 'body'), createChangeRequest);
router.get('/requests/:id', getChangeRequest);
router.patch('/requests/:id', validate(updateChangeRequestSchema, 'body'), updateChangeRequest);
router.delete('/requests/:id', deleteChangeRequest);

// ── Lifecycle transitions ──
router.post('/requests/:id/submit', submitChange);
router.post('/requests/:id/approvals', validate(approveChangeSchema, 'body'), approveChange);
router.post('/requests/:id/schedule', validate(scheduleChangeSchema, 'body'), scheduleChange);
router.post('/requests/:id/implement', implementChange);
router.post('/requests/:id/complete', completeChange);
router.post('/requests/:id/rollback', rollbackChange);
router.post('/requests/:id/cancel', cancelChange);

// ── Tasks ──
router.post('/requests/:id/tasks', validate(createChangeTaskSchema, 'body'), addChangeTask);
router.patch('/tasks/:taskId', validate(updateChangeTaskSchema, 'body'), updateChangeTask);

export default router;
