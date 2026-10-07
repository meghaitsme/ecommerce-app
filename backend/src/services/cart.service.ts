import Cart from '../models/Cart.model';
import Product from '../models/Product.model';

export const getOrCreateCart = async (userId: string) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [], total: 0 });
  return cart;
};

export const addToCart = async (userId: string, productId: string, quantity: number) => {
  const cart = await getOrCreateCart(userId);
  const product = await Product.findById(productId);
  if (!product) throw { status: 404, message: 'Product not found' };

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (item) item.quantity += quantity;
  else cart.items.push({ product: product._id, quantity, price: product.price });

  cart.total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  await cart.save();
  return cart.populate('items.product');
};

export const updateCartItem = async (userId: string, productId: string, quantity: number) => {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  if (quantity > 0) {
    const product = await Product.findById(productId);
    if (!product) throw { status: 404, message: 'Product not found' };
    cart.items.push({ product: product._id, quantity, price: product.price });
  }
  cart.total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  await cart.save();
  return cart.populate('items.product');
};

export const removeFromCart = (userId: string, productId: string) =>
  updateCartItem(userId, productId, 0);

export const clearCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.total = 0;
  await cart.save();
  return cart;
};