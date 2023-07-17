const express = require('express');
const routes = express.Router();

// Controllers
const nuronController = require('../controllers/nuron');

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

routes.get('/live-bidding', nuronController.getLiveBidding);

module.exports = routes;
