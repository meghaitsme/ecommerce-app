import { Router } from 'express';
import { createIntent } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/intent', authenticate, createIntent);

export default router;