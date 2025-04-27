require('dotenv').config();
const jwt = require('jsonwebtoken');

const verifyJWT = (token) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; 
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { verifyJWT };
