
import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import {
  authenticate,
  isAdmin,
} from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', orderController.create);
router.get('/my', orderController.myOrders);

router.get('/', isAdmin, orderController.allOrders);
router.put('/:id/status', isAdmin, orderController.updateStatus);

export default router;
