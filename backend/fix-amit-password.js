const mongoose = require('mongoose');

const NEW_PASSWORD = 'amit123';
const TARGET_EMAIL = 'amit@shop.com';

(async () => {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);
  console.log('Generated hash:', hash);

  await mongoose.connect('mongodb://127.0.0.1:27017/ecommerce');
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: TARGET_EMAIL },
    { $set: { password: hash } }
  );
  console.log('Matched:', result.matchedCount);
  console.log('Modified:', result.modifiedCount);

  await mongoose.disconnect();
  console.log('Done.');
})();