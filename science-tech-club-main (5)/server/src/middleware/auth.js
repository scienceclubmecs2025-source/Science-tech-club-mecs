const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tDgSDMJFrSmZUPs8mAon7UDi59BYFdgtkL0ptwDzk5JtM5kFA7O1SjUAlzEzvUzdG50NhLrHk2aRHDOgPmR+Rg==');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
