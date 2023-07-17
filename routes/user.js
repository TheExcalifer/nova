const express = require('express');
const routes = express.Router();

// Controllers
const userController = require('../controllers/user');

// JWT Authenticator
const isAuth = require('../middleware/is-auth');

routes.post('/edit/profile-image', isAuth, userController.editProfileImage);
routes.post('/edit/cover-image', isAuth, userController.editCoverImage);
routes.put('/edit/profile-information', isAuth, userController.editProfileInformation);
routes.put('/edit/password', isAuth, userController.changePassword);

routes.get('/me', isAuth, userController.getMe);

routes.post('/create-nft', isAuth, userController.createNFT);

routes.post('/favorite', isAuth, userController.favorite);
routes.post('/unfavorite', isAuth, userController.unfavorite);
routes.post('/bid', isAuth, userController.bid);

module.exports = routes;
