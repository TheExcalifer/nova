const express = require('express');
const routes = express.Router();

// Controllers
const userController = require('../controllers/user');

// JWT Authenticator
const isAuth = require('../middleware/is-auth');

routes.get('/:id', userController.getUser);
routes.post('/follow-status', isAuth, userController.followStatus);

routes.post('/edit/profile-image', isAuth, userController.editProfileImage);
routes.post('/edit/cover-image', isAuth, userController.editCoverImage);
routes.put('/edit/profile-information', isAuth, userController.editProfileInformation);
routes.put('/edit/password', isAuth, userController.changePassword);

routes.get('/me', isAuth, userController.getMe);

routes.post('/create-nft', isAuth, userController.createNFT);

routes.post('/favorite', isAuth, userController.favorite);
routes.post('/unfavorite', isAuth, userController.unfavorite);
routes.post('/bid', isAuth, userController.bid);

routes.post('/follow', isAuth, userController.follow);
routes.post('/unfollow', isAuth, userController.unfollow);

module.exports = routes;
