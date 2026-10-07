const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/ecommerce');
  const r = await mongoose.connection.db.collection('users').updateOne(
    { email: 'buyer2026@shop.com' },
    { $set: { role: 'admin' } }
  );
  console.log('Updated:', r.modifiedCount);
  await mongoose.disconnect();
})();