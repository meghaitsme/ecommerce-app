const express = require('express');
const router = express.Router();
const firebaseAuth = require('../middleware/firebaseAuth');
const Order = require('../models/Order');
const Product = require('../models/Product');

router.post('/', firebaseAuth, async (req, res) => {
  const { items, shippingAddress } = req.body;
  try {
    // Re-price server-side — never trust client prices
    const ids = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids } });
    const priceMap = Object.fromEntries(products.map(p => [p._id.toString(), p.price]));

    const lineItems = items.map(i => ({
      productId: i.productId,
      name: products.find(p => p._id.toString() === i.productId)?.name,
      price: priceMap[i.productId],
      quantity: i.quantity,
    }));

    const subtotal = lineItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 50 ? 0 : 5;
    const total = subtotal + shipping;

    const order = await Order.create({
      firebaseUid: req.firebaseUser.uid,
      items: lineItems,
      subtotal, shipping, total,
      shippingAddress,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', firebaseAuth, async (req, res) => {
  const orders = await Order.find({ firebaseUid: req.firebaseUser.uid }).sort({ createdAt: -1 });
  res.json(orders);
});

module.exports = router;