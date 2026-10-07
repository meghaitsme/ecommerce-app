const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/ecommerce');
  const u = await mongoose.connection.db.collection('users').findOne({ email: 'amit@shop.com' });
  console.log('User found:', JSON.stringify(u, null, 2));
  await mongoose.disconnect();
})();