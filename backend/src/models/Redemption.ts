import mongoose, { Schema, model, models } from "mongoose";

const redemptionSchema = new Schema({
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },
  userId: { type: String, required: true },
  orderId: { type: String, required: true },
  discountApplied: { type: Number, required: true },
  status: { type: String, enum: ["applied", "refunded"], default: "applied" },
  redeemedAt: { type: Date, default: Date.now },
});

redemptionSchema.index({ couponId: 1, orderId: 1 }, { unique: true });
redemptionSchema.index({ couponId: 1, userId: 1 });

const Redemption = models.Redemption || model("Redemption", redemptionSchema);
export default Redemption;