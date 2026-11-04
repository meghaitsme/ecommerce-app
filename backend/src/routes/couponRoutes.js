const express = require("express");
const router = express.Router();
// Assuming your compiled couponService is in dist/services/couponService.js
const { redeemCoupon } = require("../dist/services/couponService"); 

router.post("/apply", async (req, res) => {
  try {
    const { code, userId, orderId, cartTotal } = req.body;
    
    // Call the function you wrote
    const result = await redeemCoupon(code, userId, orderId, cartTotal);
    
    res.json({ success: true, discount: result.discount });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;