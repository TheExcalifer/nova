const express = require('express');
const routes = express.Router();

//validator
const userValidator = require('../middleware/validator/user-validator');
const nuronValidator = require('../middleware/validator/nuron-validator');
// controllers
const userController = require('../controllers/user');

// authenticator
const isAuth = require('../middleware/is-auth');

routes.post('/edit/profile-image', isAuth, userController.editProfileImage);
routes.post('/edit/cover-image', isAuth, userController.editCoverImage);
routes.put(
  '/edit/profile-information',
  isAuth,
  userValidator.editProfileInformation,
  userController.editProfileInformation
);
routes.put(
  '/edit/password',
  isAuth,
  userValidator.changePassword,
  userController.changePassword
);

module.exports = routes;
