import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as orderService from '../services/order.service';

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.createOrder(req.user!.id, req.body.shippingAddress);
    res.status(201).json({ order });
  } catch (err) { next(err); }
};

export const myOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(await orderService.getUserOrders(req.user!.id));
  } catch (err) { next(err); }
};

export const allOrders = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(await orderService.getAllOrders());
  } catch (err) { next(err); }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(await orderService.updateOrderStatus(req.params.id, req.body.status));
  } catch (err) { next(err); }
};