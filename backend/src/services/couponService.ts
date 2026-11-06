
import Coupon from '../models/Coupon.js';

interface CouponResult {
  discount: number;
}

export async function validateCoupon(
  code: string,
  cartTotal: number
): Promise<CouponResult> {
  if (!code || !Number.isFinite(cartTotal) || cartTotal < 0) {
    throw new Error('INVALID_COUPON_REQUEST');
  }

  const normalizedCode = code.trim().toUpperCase();

  const coupon = await Coupon.findOne({
    code: normalizedCode,
    active: true,
  });

  if (!coupon) {
    throw new Error('INVALID_CODE');
  }

  const now = new Date();

  if (
    (coupon.startsAt && now < coupon.startsAt) ||
    (coupon.expiresAt && now > coupon.expiresAt)
  ) {
    throw new Error('EXPIRED');
  }

  if (cartTotal < Number(coupon.minCart || 0)) {
    throw new Error('MIN_CART_NOT_MET');
  }

  const value = Number(coupon.value);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('INVALID_COUPON_CONFIGURATION');
  }

  let discount = 0;

  if (coupon.type === 'percent') {
    if (value > 100) {
      throw new Error('INVALID_COUPON_CONFIGURATION');
    }

    discount = cartTotal * (value / 100);

    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
  } else if (coupon.type === 'fixed') {
    discount = value;
  } else {
    throw new Error('INVALID_COUPON_TYPE');
  }

  discount = Math.max(0, Math.min(discount, cartTotal));

  return {
    discount: Number(discount.toFixed(2)),
  };
}
