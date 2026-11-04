import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { redeemCoupon } from './services/couponService.js';


const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupon', couponRoutes); // <-- ADD LINE
app.post('/api/coupon/apply', async (req, res) => {
  try {
    const { code, userId, orderId, cartTotal } = req.body;
    const result = await redeemCoupon(code, userId, orderId, cartTotal);
    res.json({ success: true, discount: result.discount });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.use(errorHandler);

const start = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('MongoDB connected');
    app.listen(Number(process.env.PORT) || 5000, () => {
      console.log('Server on port ' + (process.env.PORT || 5000));
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

start();