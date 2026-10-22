import { Request, Response } from 'express';
import Cart from '../models/Cart.model';
import { AuthRequest } from '../middlewares/auth.middleware';

const getCartQuery = (req: Request) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  const guestId = req.headers['x-guest-id'] as string;
  if (!userId && !guestId) return null;
  return userId ? { user: userId } : { guestId };
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const query = getCartQuery(req);
    if (!query) return res.status(200).json({ items: [], total: 0 });
    const cart = await Cart.findOne(query).populate('items.product');
    return res.status(200).json(cart ?? { items: [], total: 0 });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching cart' });
  }
};

export const add = async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    const query = getCartQuery(req);
    if (!query) return res.status(400).json({ message: 'No user or guest ID provided' });

    let cart = await Cart.findOne(query);
    if (!cart) cart = new Cart({ ...query, items: [], total: 0 });

    const itemIndex = cart.items.findIndex((p: any) => p.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, price: req.body.price });
    }
    cart.total = cart.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    return res.status(500).json({ message: 'Error adding to cart' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const query = getCartQuery(req);
    if (!query) return res.status(400).json({ message: 'No user or guest ID' });

    const cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find((p: any) => p.product.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items = cart.items.filter((p: any) => p.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }
    cart.total = cart.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating cart' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const query = getCartQuery(req);
    if (!query) return res.status(400).json({ message: 'No user or guest ID' });

    const cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter((p: any) => p.product.toString() !== productId);
    cart.total = cart.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    return res.status(500).json({ message: 'Error removing from cart' });
  }
};