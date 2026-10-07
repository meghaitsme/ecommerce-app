import Order from '../models/Order.model';
import Cart from '../models/Cart.model';

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