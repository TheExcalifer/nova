const express = require('express');
const routes = express.Router();

// controllers
const nuronController = require('../controllers/nuron');

// authenticator
const isAuth = require('../middleware/is-auth');

routes.post('/signup', nuronController.signup);
routes.post('/login', nuronController.login);
routes.post('/contact-us', nuronController.contactUs);
routes.post('/newsletter', nuronController.newsletter);
routes.post('/create-nft', isAuth, nuronController.createNFT);
routes.get('/categories', nuronController.getCategories);
routes.get('/product/:id', nuronController.getProduct);
routes.post('/favorite', isAuth, nuronController.favorite);

module.exports = routes;
