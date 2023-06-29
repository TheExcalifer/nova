const express = require('express');
const routes = express.Router();

//validator
const nuronValidator = require('../middleware/validator/nuron-validator');

// controllers
const nuronController = require('../controllers/nuron');

// authenticator
const isAuth = require('../middleware/is-auth');

routes.post('/signup', nuronValidator.signup, nuronController.signup);
routes.post('/login', nuronValidator.login, nuronController.login);
routes.post('/contact-us', nuronValidator.contactUs, nuronController.contactUs);

module.exports = routes;
