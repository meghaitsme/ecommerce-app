import Coupon from "../models/Coupon";
import Redemption from "../models/Redemption";
import mongoose from "mongoose";

async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");

  await mongoose.connect(uri);
}

export async function redeemCoupon(
  code: string,
  userId: string,
  orderId: string,
  cartTotal: number
): Promise<{ discount: number }> {
  await connectDB(); // <-- Connect to MongoDB

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon || !coupon.active) throw new Error("INVALID_CODE");

  const now = new Date();
  if (now < coupon.startsAt || now > coupon.expiresAt) throw new Error("EXPIRED");
  if (cartTotal < coupon.minCart) throw new Error("MIN_CART_NOT_MET");

  // Atomic claim
  const claim = await Coupon.findOneAndUpdate(
    {
      _id: coupon._id,
      $expr: {
        $or: [
          { $eq: ["$maxUses", null] },
          { $lt: [{ $ifNull: ["$usedCount", 0] }, "$maxUses"] },
        ],
      },
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  if (!claim) throw new Error("USAGE_LIMIT_REACHED");

  // Per-user check
  const userUses = await Redemption.countDocuments({ couponId: coupon._id, userId });
  if (coupon.maxUsesPerUser != null && userUses >= coupon.maxUsesPerUser) {
    await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: -1 } });
    throw new Error("USER_LIMIT_REACHED");
  }

  let discount = coupon.type === "percent" ? cartTotal * (coupon.value / 100) : coupon.value;
  if (coupon.type === "percent" && coupon.maxDiscount != null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, cartTotal);

  try {
    await Redemption.create({ couponId: coupon._id, userId, orderId, discountApplied: discount });
  } catch (e: any) {
    if (e.code === 11000) {
      await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: -1 } });
      throw new Error("ALREADY_REDEEMED");
    }
    throw e;
  }

  return { discount };
}