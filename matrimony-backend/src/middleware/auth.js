const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('[HARD_DEBUG] Incoming Auth Header:', authHeader ? 'PRESENT' : 'MISSING');

  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    console.log('[HARD_DEBUG] Authorization Denied: No token in header');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('[HARD_DEBUG] Token Verified. User ID:', decoded.id);
    req.user = decoded;

    // Fire-and-forget: update last_active_at without awaiting to avoid blocking the API request
    db.execute('UPDATE profiles SET last_active_at = NOW() WHERE user_id = ?', [decoded.id])
      .catch(err => console.error('[AUTH_MIDDLEWARE] Failed to update last_active_at:', err.message));

    next();
  } catch (error) {
    console.log('[HARD_DEBUG] Token Invalid:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
