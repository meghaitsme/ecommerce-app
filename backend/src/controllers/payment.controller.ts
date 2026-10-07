import { Request, Response, NextFunction } from 'express';
import { createPaymentIntent } from '../services/payment.service';

export const createIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, orderId } = req.body;
    if (!amount || !orderId) {
      return res.status(400).json({ message: 'amount and orderId required' });
    }
    const clientSecret = await createPaymentIntent(Number(amount), String(orderId));
    res.json({ clientSecret });
  } catch (err) {
    next(err);
  }
};