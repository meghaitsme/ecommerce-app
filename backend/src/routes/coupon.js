// routes/coupon.js
const express = require("express");
const router = express.Router();
const { redeemCoupon } = require("../services/couponService");

router.post("/apply-coupon", async (req, res) => {
  const { code, orderId, cartTotal } = req.body;
  try {
    const { discount } = await redeemCoupon(code, req.user.id, orderId, cartTotal);
    res.json({ ok: true, discount });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

module.exports = router;