const express = require('express');
const routes = express.Router();

// Controllers
const novaController = require('../controllers/nova');

routes.post('/signup', novaController.signup);
routes.post('/login', novaController.login);

routes.post('/contact-us', novaController.contactUs);

routes.post('/newsletter', novaController.newsletter);

routes.get('/categories', novaController.getCategories);

routes.get('/product/:id', novaController.getProduct);
routes.get('/related-product/:categoryId', novaController.getRelatedProductByCategory);
routes.post('/recent-view', novaController.getRecentView);

routes.post('/products', novaController.getProducts);
routes.get('/products-price', novaController.getProductsPrice);

routes.get('/live-bidding', novaController.getLiveBidding);

module.exports = routes;
