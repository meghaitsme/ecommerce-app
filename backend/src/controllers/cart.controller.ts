import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as cartService from '../services/cart.service';

export const getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cart = await cartService.getOrCreateCart(req.user!.id);
    await cart.populate('items.product');
    res.json(cart);
  } catch (err) { next(err); }
};

export const add = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user!.id, productId, quantity || 1);
    res.json(cart);
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { quantity } = req.body;
    const cart = await cartService.updateCartItem(req.user!.id, req.params.productId, quantity);
    res.json(cart);
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cart = await cartService.removeFromCart(req.user!.id, req.params.productId);
    res.json(cart);
  } catch (err) { next(err); }
};