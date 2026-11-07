
import { Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import { AuthRequest } from '../middlewares/auth.middleware';

// GET /api/products
export const list = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('\n========== LIST PRODUCTS ==========');
  console.log('[Product Controller] Request received');
  console.log('[Product Controller] Query:', req.query);

  try {
    const { category, search, page, limit } = req.query;

    const filter: Record<string, any> = {};

    if (category) {
      filter['category.path'] = category;
    }

    if (search && typeof search === 'string') {
      filter.$text = { $search: search };
    }

    console.log('[Product Controller] Filter:', filter);

    const data = await productService.listProducts(
      filter,
      Number(page) || 1,
      Number(limit) || 12
    );

    console.log('[Product Controller] Products fetched:', data.items.length);
    console.log('[Product Controller] Total products:', data.total);
    console.log('[Product Controller] Pagination:', {
      page: data.page,
      pages: data.pages,
    });

    res.status(200).json({
      success: true,
      ...data,
    });

  } catch (err) {
    console.error('[Product Controller] List error:', err);
    next(err);
  }
};

// GET /api/products/:id
export const getOne = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('\n========== GET SINGLE PRODUCT ==========');
  console.log('[Product Controller] Product ID:', req.params.id);

  try {
    const product = await productService.getProduct(req.params.id);

    console.log('[Product Controller] Product found:', product._id);
    console.log('[Product Controller] Product name:', product.name);

    res.status(200).json({
      success: true,
      product,
    });

  } catch (err) {
    console.error('[Product Controller] Get product error:', err);
    next(err);
  }
};

// POST /api/products
export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('\n========== CREATE PRODUCT ==========');
  console.log('[Product Controller] Request body:', req.body);
  console.log('[Product Controller] User ID:', req.user?.id);

  try {
    if (!req.user?.id) {
      console.warn('[Product Controller] Unauthorized create request');

      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const product = await productService.createProduct(
      req.body,
      req.user.id
    );

    console.log('[Product Controller] Product created:', product._id);
    console.log('[Product Controller] Product name:', product.name);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });

  } catch (err) {
    console.error('[Product Controller] Create error:', err);
    next(err);
  }
};

// PUT /api/products/:id
export const update = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('\n========== UPDATE PRODUCT ==========');
  console.log('[Product Controller] Product ID:', req.params.id);
  console.log('[Product Controller] Update data:', req.body);

  try {
    const product = await productService.updateProduct(
      req.params.id,
      req.body
    );

    console.log('[Product Controller] Product updated:', product._id);
    console.log('[Product Controller] Updated name:', product.name);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });

  } catch (err) {
    console.error('[Product Controller] Update error:', err);
    next(err);
  }
};

// DELETE /api/products/:id
export const remove = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('\n========== DELETE PRODUCT ==========');
  console.log('[Product Controller] Product ID:', req.params.id);

  try {
    await productService.deleteProduct(req.params.id);

    console.log('[Product Controller] Product deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (err) {
    console.error('[Product Controller] Delete error:', err);
    next(err);
  }
};
