
import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middlewares/auth.middleware.js';
import { validateCoupon } from '../services/couponService.js';

const router = Router();

router.post(
  '/apply',
  authenticate,
  async (req: AuthRequest, res, next): Promise<void> => {
    try {
      const code =
        typeof req.body?.code === 'string'
          ? req.body.code.trim().toUpperCase()
          : '';

      const cartTotal = Number(req.body?.cartTotal);

      if (!code || code.length > 50) {
        res.status(400).json({
          success: false,
          message: 'Please provide a valid coupon code',
        });
        return;
      }

      if (!Number.isFinite(cartTotal) || cartTotal < 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid cart total',
        });
        return;
      }

      const result = await validateCoupon(code, cartTotal);

      res.status(200).json({
        success: true,
        discount: result.discount,
        message: 'Coupon validated',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
