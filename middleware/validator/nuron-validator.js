const { body } = require('express-validator');
exports.signup = [
  body('firstName').trim().escape().isLength({ min: 3, max: 64 }).isString(),
  body('lastName').trim().escape().isLength({ min: 3, max: 64 }).isString(),
  body('email').trim().toLowerCase().escape().isString().normalizeEmail().isEmail().isLength({ min: 3, max: 254 }),
  body('password').trim().isLength({ min: 8, max: 128 }).isString(),
  body('rePassword')
    .trim()
    .isLength({ min: 8, max: 128 })
    .isString()
    .custom((value, { req }) => {
      return value === req.body.password;
    }),
  body('agree').custom((value) => {
    return value === true;
  }),
];
exports.login = [
  body('email').trim().toLowerCase().escape().isString().normalizeEmail().isEmail().isLength({ min: 3, max: 254 }),
  body('password').trim().isLength({ min: 8, max: 128 }).isString(),
];
exports.contactUs = [
  body('name').trim().escape().isLength({ min: 3, max: 128 }).isString(),
  body('email').trim().toLowerCase().escape().isString().normalizeEmail().isEmail().isLength({ min: 3, max: 254 }),
  body('subject').trim().escape().isLength({ min: 10, max: 64 }).isString(),
  body('message').trim().escape().isLength({ min: 10, max: 300 }).isString(),
];
exports.newsletter = [
  body('email').trim().toLowerCase().escape().isString().normalizeEmail().isEmail().isLength({ min: 3, max: 254 }),
];
