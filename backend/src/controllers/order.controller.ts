
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import * as orderService from '../services/order.service.js';

const allowedStatuses = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const;

type OrderStatus = (typeof allowedStatuses)[number];

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const address = req.body?.shippingAddress;

    if (!address || typeof address !== 'object' || Array.isArray(address)) {
      res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
      return;
    }

    const requiredFields = [
      'line1',
      'city',
      'state',
      'zip',
      'country',
    ] as const;

    for (const field of requiredFields) {
      if (
        typeof address[field] !== 'string' ||
        !address[field].trim()
      ) {
        res.status(400).json({
          success: false,
          message: `Valid ${field} is required`,
        });
        return;
      }
    }

    const order = await orderService.createOrder(req.user.id, {
      line1: address.line1.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      zip: address.zip.trim(),
      country: address.country.trim(),
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const myOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const orders = await orderService.getUserOrders(req.user.id);

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const allOrders = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await orderService.getAllOrders();

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const status = req.body?.status;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
      return;
    }

    if (
      typeof status !== 'string' ||
      !allowedStatuses.includes(status as OrderStatus)
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid order status',
      });
      return;
    }

    const order = await orderService.updateOrderStatus(
      id,
      status as OrderStatus
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};
