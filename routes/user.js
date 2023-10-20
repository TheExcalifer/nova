const express = require('express');
const routes = express.Router();

// Controllers
const userController = require('../controllers/user');

// JWT Authenticator
const isAuth = require('../middleware/is-auth');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

routes.post('/follow-status', isAuth, userController.followStatus);

routes.post('/edit/profile-image', isAuth, userController.editProfileImage);
routes.post('/edit/cover-image', isAuth, userController.editCoverImage);
routes.patch(
  '/edit/profile-information',
  isAuth,
  userController.editProfileInformation
);
routes.patch('/edit/password', isAuth, userController.changePassword);

routes.get('/me', isAuth, userController.getMe);

routes.post('/create-nft', isAuth,upload.array('productImages'), userController.createNFT);

routes.post('/favorite', isAuth, userController.favorite);
routes.post('/unfavorite', isAuth, userController.unfavorite);
routes.post('/bid', isAuth, userController.bid);

routes.post('/follow', isAuth, userController.follow);
routes.post('/unfollow', isAuth, userController.unfollow);

routes.get('/:id', userController.getUser);
module.exports = routes;
