import { Router } from 'express';
import { listTickets, createTicket, updateTicket } from '../controllers/tickets';
import { validate } from '../middleware/validate';
import { createTicketSchema, updateTicketSchema } from '@eidh/shared';

const router = Router();

// GET /api/v1/support/tickets
router.get('/', listTickets);
// POST /api/v1/support/tickets
router.post('/', validate(createTicketSchema, 'body'), createTicket);
// PATCH /api/v1/support/tickets/:id
router.patch('/:id', validate(updateTicketSchema, 'body'), updateTicket);

export default router;
