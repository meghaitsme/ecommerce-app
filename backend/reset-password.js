const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    rl.question('Enter email: ', (email) => {
      rl.question('Enter new password: ', async (newPassword) => {
        try {
          const User = require('./dist/models/User.model').default || require('./dist/models/User.model');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          const result = await User.updateOne({ email }, { $set: { password: hashedPassword } });
          if (result.modifiedCount === 1) console.log('\nSuccess! Password updated.');
          else console.log('\nFailed. User not found.');
        } catch (err) { console.error(err.message); } 
        finally { rl.close(); mongoose.disconnect(); }
      });
    });
  } catch (err) { console.error(err.message); rl.close(); }
};
run();
