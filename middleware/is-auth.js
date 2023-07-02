const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  try {
    const token = req.get('Authorization');
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, '4LZpJPii2NW4NFJxTwueL76XnqZPn4Qr');
    } catch (error) {
      return res.status(401).json({authentication: 'You are not autheticated' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(500).json({ msg: 'Error occured' });
  }
};
