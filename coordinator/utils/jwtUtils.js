require("dotenv").config();
const jwt = require("jsonwebtoken");

const verifyJWT = (token) => {
  try {
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { id: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
};

module.exports = { verifyJWT };
