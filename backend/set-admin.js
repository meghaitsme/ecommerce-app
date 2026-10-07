const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/ecommerce').then(async () => {
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'myadmin@shop.com' },
    { $set: { role: 'admin' } }
  );
  console.log('Updated:', result.modifiedCount);
  await mongoose.disconnect();
});