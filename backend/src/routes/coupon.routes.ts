// src/routes/coupon.routes.ts
import { Router, Request, Response } from 'express';
import { redeemCoupon } from '../services/couponService.js'; // Assuming your service is here

const router = Router();

router.post('/apply', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, userId, orderId, cartTotal } = req.body;
    
    // Call the Mongoose function we built earlier
    const result = await redeemCoupon(code, userId, orderId, cartTotal);
    
    res.json({ success: true, discount: result.discount });
  } catch (error: any) {
    // This catches "INVALID_CODE", "EXPIRED", etc., and sends it to the frontend
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;