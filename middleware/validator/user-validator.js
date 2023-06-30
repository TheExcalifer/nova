const { body } = require('express-validator');
exports.editProfileInformation = [
  body('firstName').trim().escape().isLength({ min: 3, max: 64 }).isString(),
  body('lastName').trim().escape().isLength({ min: 3, max: 64 }).isString(),
  body('email').trim().toLowerCase().escape().isString().normalizeEmail().isEmail().isLength({ min: 3, max: 254 }),
  body('bio').trim().escape().isString().isLength({ min: 0, max: 256 }),
  body('role').trim().escape().isString().isLength({ min: 0, max: 64 }),
  body('gender')
    .trim()
    .escape()
    .isString()
    .isLength({ min: 0, max: 16 })
    .custom((value, { req }) => {
      return value === 'Female' || value === 'Male' || value === 'Third Gender';
    }),
  body('currency')
    .trim()
    .escape()
    .isString()
    .isLength({ min: 0, max: 16 })
    .custom((value, { req }) => {
      return value === '($)USD' || value === 'wETH' || value === 'BIT Coin';
    }),
  body('phoneNumber').trim().escape().isString().isLength({ min: 9, max: 16 }).isMobilePhone(),
  body('location')
    .trim()
    .escape()
    .isString()
    .isLength({ min: 0, max: 32 })
    .custom((value, { req }) => {
      return value === 'United State' || value === 'KATAR' || value === 'Canada';
    }),
  body('address').trim().escape().isString().isLength({ min: 0, max: 128 }),
];