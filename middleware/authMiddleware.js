const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  
  const token = req.header('Authorization');
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const bearerToken = token.split(' ')[1]; 
    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
    // Attach user to request
    req.user = decoded.userId;

    next();
  
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
module.exports = authMiddleware;
