// models/Product.js
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  price: { type: Number, required: true },
  compareAtPrice: Number, // For strikethrough pricing
  category: {
    id: String,
    path: [String], // e.g. ["Electronics", "Laptops"]
  },
  attributes: { type: mongoose.Schema.Types.Mixed }, // Flexible specs
  images: [{ url: String, isPrimary: Boolean }],
  inventory: {
    quantity: { type: Number, default: 0 },
    trackQuantity: Boolean,
  },
  status: { type: String, enum: ['active', 'draft', 'discontinued'], default: 'active' },
}, { timestamps: true });