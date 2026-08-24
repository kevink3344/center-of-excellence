import { Router } from 'express';
import { listNotifications, getUnreadCount, markRead, markAllRead } from '../controllers/notifications';

const router = Router();

// GET /api/v1/notifications
router.get('/', listNotifications);
// GET /api/v1/notifications/unread-count
router.get('/unread-count', getUnreadCount);
// PATCH /api/v1/notifications/read-all
router.patch('/read-all', markAllRead);
// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', markRead);

export default router;
