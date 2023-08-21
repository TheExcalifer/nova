const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  try {
    const token = req.get('Authorization');
    const JWT_SECRET = process.env.JWT_SECRET;
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({authentication: 'You are not autheticated' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(500).json({ msg: 'Error occured' });
  }
};
