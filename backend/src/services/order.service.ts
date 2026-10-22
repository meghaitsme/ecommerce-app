import Order from '../models/Order.model';
import Cart from '../models/Cart.model';
import User from '../models/User.model';
import { emailService } from './email.service';

export const createOrder = async (userId: string, shippingAddress: any) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) throw { status: 400, message: 'Cart is empty' };

  const items = cart.items.map((i: any) => ({
    product: i.product._id,
    name: i.product.name,
    price: i.price,
    quantity: i.quantity,
  }));

  const order = await Order.create({
    user: userId,
    items,
    total: cart.total,
    shippingAddress,
    status: 'pending',
  });

  // ✅ Send confirmation emails (non-blocking — order still succeeds if email fails)
  try {
    const user = await User.findById(userId);
    if (user?.email) {
      await emailService.sendOrderConfirmation(
        user.email,
        user.name ?? 'Customer',
        order._id.toString(),
        order.total
      );
      await emailService.notifySeller(
        order._id.toString(),
        user.name ?? 'Customer',
        order.total
      );
    }
  } catch (err) {
    console.error('Order email failed:', err);
  }

  return order;
};

export const getUserOrders = (userId: string) =>
  Order.find({ user: userId }).sort({ createdAt: -1 });

export const getAllOrders = () =>
  Order.find().populate('user', 'name email').sort({ createdAt: -1 });

export const updateOrderStatus = async (id: string, status: string) => {
  const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
  if (!order) throw { status: 404, message: 'Order not found' };
  return order;
};