import mongoose, { Schema, model, models } from "mongoose";

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ["percent", "fixed"], required: true },
  value: { type: Number, required: true, min: 0 },
  maxDiscount: { type: Number, default: null },
  minCart: { type: Number, default: 0 },
  startsAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  maxUses: { type: Number, default: null },
  maxUsesPerUser: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const Coupon = models.Coupon || model("Coupon", couponSchema);
export default Coupon;