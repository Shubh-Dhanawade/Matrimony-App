const jwt = require('jsonwebtoken');

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
    next();
  } catch (error) {
    console.log('[HARD_DEBUG] Token Invalid:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
