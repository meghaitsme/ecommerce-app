const orderSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, index: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
  }],
  subtotal: Number,
  shipping: Number,
  total: Number,
  status: { type: String, enum: ['pending','paid','shipped','delivered','cancelled'], default: 'pending' },
  shippingAddress: { line1: String, city: String, state: String, zip: String, country: String },
}, { timestamps: true });