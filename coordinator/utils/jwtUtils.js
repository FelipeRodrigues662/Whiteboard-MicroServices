const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'segredo123';

const verifyJWT = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    throw new Error('Token inválido');
  }
};

module.exports = { verifyJWT };
