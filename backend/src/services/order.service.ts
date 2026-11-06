
import mongoose, { Types } from 'mongoose';

import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';

import { emailService } from './email.service.js';

const SHIPPING_COST = 2;

const createError = (status: number, message: string) => {
  return Object.assign(new Error(message), { status });
};

interface ShippingAddress {
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface OrderItemData {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export const createOrder = async (
  userId: string,
  shippingAddress: ShippingAddress
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw createError(401, 'Invalid user ID');
  }

  if (!shippingAddress || typeof shippingAddress !== 'object') {
    throw createError(400, 'Shipping address is required');
  }

  const requiredAddressFields: (keyof ShippingAddress)[] = [
    'line1',
    'city',
    'state',
    'zip',
    'country',
  ];

  for (const field of requiredAddressFields) {
    if (
      typeof shippingAddress[field] !== 'string' ||
      !shippingAddress[field].trim()
    ) {
      throw createError(400, `Valid ${field} is required`);
    }
  }

  const userObjectId = new Types.ObjectId(userId);
  const session = await mongoose.startSession();

  let createdOrder: any = null;

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: userObjectId })
        .session(session)
        .populate('items.product');

      if (!cart || !cart.items || cart.items.length === 0) {
        throw createError(400, 'Cart is empty');
      }

      // Combine duplicate product entries before checking stock.
      const groupedItems = new Map<
        string,
        { product: any; quantity: number }
      >();

      for (const cartItem of cart.items as any[]) {
        const product = cartItem.product;
        const quantity = Number(cartItem.quantity);

        if (!product || !product._id) {
          throw createError(400, 'A cart product no longer exists');
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
          throw createError(400, 'Invalid product quantity');
        }

        const productId = product._id.toString();
        const existing = groupedItems.get(productId);

        if (existing) {
          existing.quantity += quantity;
        } else {
          groupedItems.set(productId, { product, quantity });
        }
      }

      const orderItems: OrderItemData[] = [];
      let subtotal = 0;

      for (const [productId, entry] of groupedItems) {
        const product = entry.product;
        const quantity = entry.quantity;

        const currentProduct = await Product.findById(productId)
          .session(session);

        if (!currentProduct) {
          throw createError(404, `${product.name} is no longer available`);
        }

        const currentPrice = Number(currentProduct.price);
        const availableStock = Number(currentProduct.stock);

        if (!Number.isFinite(currentPrice) || currentPrice < 0) {
          throw createError(400, `Invalid price for ${currentProduct.name}`);
        }

        if (
          !Number.isInteger(availableStock) ||
          availableStock < quantity
        ) {
          throw createError(
            400,
            `Insufficient stock for ${currentProduct.name}`
          );
        }

        // Conditional update prevents overselling.
        const stockUpdate = await Product.updateOne(
          {
            _id: currentProduct._id,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          { session }
        );

        if (stockUpdate.modifiedCount !== 1) {
          throw createError(
            409,
            `Stock changed for ${currentProduct.name}. Please try again`
          );
        }

        orderItems.push({
          productId: currentProduct._id as Types.ObjectId,
          name: currentProduct.name,
          price: currentPrice,
          quantity,
        });

        subtotal += currentPrice * quantity;
      }

      subtotal = Number(subtotal.toFixed(2));

      const shipping = SHIPPING_COST;
      const total = Number((subtotal + shipping).toFixed(2));

      const orders = await Order.create(
        [
          {
            user: userObjectId,
            items: orderItems,
            subtotal,
            shipping,
            total,
            shippingAddress: {
              line1: shippingAddress.line1.trim(),
              city: shippingAddress.city.trim(),
              state: shippingAddress.state.trim(),
              zip: shippingAddress.zip.trim(),
              country: shippingAddress.country.trim(),
            },
            status: 'pending',
          },
        ],
        { session }
      );

      createdOrder = orders[0];

      // Clear the cart only when the order transaction succeeds.
      await Cart.updateOne(
        { _id: cart._id, user: userObjectId },
        {
          $set: {
            items: [],
            total: 0,
          },
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  if (!createdOrder) {
    throw createError(500, 'Order could not be created');
  }

  // Send email after the database transaction commits.
  try {
    const user = await User.findById(userObjectId).select('name email');

    if (user?.email) {
      await emailService.sendOrderConfirmation(
        user.email,
        user.name || 'Customer',
        createdOrder._id.toString(),
        createdOrder.total
      );

      await emailService.notifySeller(
        createdOrder._id.toString(),
        user.name || 'Customer',
        createdOrder.total
      );
    }
  } catch (error) {
    // Email failure must not undo a successfully created order.
    console.error('Order email failed:', error);
  }

  return createdOrder;
};

export const getUserOrders = (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw createError(400, 'Invalid user ID');
  }

  return Order.find({ user: new Types.ObjectId(userId) })
    .populate('items.productId', 'name image')
    .sort({ createdAt: -1 });
};

export const getAllOrders = () => {
  return Order.find()
    .populate('user', 'name email')
    .populate('items.productId', 'name image')
    .sort({ createdAt: -1 });
};

export const updateOrderStatus = async (
  id: string,
  status: string
) => {
  if (!Types.ObjectId.isValid(id)) {
    throw createError(400, 'Invalid order ID');
  }

  const allowedStatuses = [
    'pending',
    'paid',
    'shipped',
    'delivered',
    'cancelled',
  ];

  if (!allowedStatuses.includes(status)) {
    throw createError(400, 'Invalid order status');
  }

  const order = await Order.findByIdAndUpdate(
    id,
    { $set: { status } },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!order) {
    throw createError(404, 'Order not found');
  }

  return order;
};
