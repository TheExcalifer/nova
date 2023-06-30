const express = require('express');
const routes = express.Router();

//validator
const userValidator = require('../middleware/validator/user-validator');

// controllers
const userController = require('../controllers/user');

// authenticator
const isAuth = require('../middleware/is-auth');
routes.post('/edit/profile-image', isAuth, userController.editProfileImage);
routes.post('/edit/cover-image', isAuth, userController.editCoverImage);

module.exports = routes;
