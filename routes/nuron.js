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

routes.get('/categories', nuronController.getCategories);

routes.get('/product/:id', nuronController.getProduct);
routes.get('/related-product/:categoryId', nuronController.getRelatedProductByCategory);
routes.post('/recent-view', nuronController.getRecentView);

routes.post('/products', nuronController.getProducts);
routes.get('/products-price', nuronController.getProductsPrice);

module.exports = routes;
