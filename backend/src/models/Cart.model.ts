import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  user?: mongoose.Types.ObjectId;
  guestId?: string;
  items: ICartItem[];
  total: number;
}

const CartSchema = new Schema<ICart>(
  {
user: { type: Schema.Types.ObjectId, ref: 'User', required: false, unique: true, sparse: true },
guestId: { type: String, required: false, unique: true, sparse: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
      },
    ],
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICart>('Cart', CartSchema);