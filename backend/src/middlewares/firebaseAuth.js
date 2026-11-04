// middleware/firebaseAuth.js
const admin = require('firebase-admin');
const User = require('../models/User'); // Your Mongoose model

async function firebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Upsert: Create user in MongoDB if they don't exist, or update lastSeen
    const user = await User.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        $set: {
          email: decoded.email,
          displayName: decoded.name,
          photoURL: decoded.picture,
          lastSeenAt: new Date(),
        },
        $setOnInsert: { firebaseUid: decoded.uid, role: 'user' },
      },
      { upsert: true, new: true }
    );

    req.firebaseUser = decoded;
    req.dbUser = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = firebaseAuth;