import { Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, search, page, limit } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search as string };
    const data = await productService.listProducts(
      filter,
      Number(page) || 1,
      Number(limit) || 12
    );
    res.json(data);
  } catch (err) { next(err); }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const p = await productService.getProduct(req.params.id);
    res.json(p);
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const p = await productService.createProduct(req.body, req.user!.id);
    res.status(201).json(p);
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const p = await productService.updateProduct(req.params.id, req.body);
    res.json(p);
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};