const express = require('express');
const routes = express.Router();

// controllers
const userController = require('../controllers/user');

// authenticator
const isAuth = require('../middleware/is-auth');

routes.post('/edit/profile-image', isAuth, userController.editProfileImage);
routes.post('/edit/cover-image', isAuth, userController.editCoverImage);
routes.put('/edit/profile-information', isAuth, userController.editProfileInformation);
routes.put('/edit/password', isAuth, userController.changePassword);
routes.get('/me', isAuth, userController.getMe);

module.exports = routes;
