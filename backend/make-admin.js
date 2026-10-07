const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/ecommerce');
  const email = 'buyer2026@shop.com';
  const r = await mongoose.connection.db.collection('users').updateOne(
    { email },
    { $set: { role: 'admin' } }
  );
  console.log('Matched:', r.matchedCount, 'Modified:', r.modifiedCount);
  const u = await mongoose.connection.db.collection('users').findOne({ email });
  console.log('Role now:', u.role);
  await mongoose.disconnect();
})();