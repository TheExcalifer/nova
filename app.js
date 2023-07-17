const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.static(path.join((__dirname, 'public'))));

app.use(bodyParser.json());

// routes
const nuronRoutes = require('./routes/nuron');
const userRoutes = require('./routes/user');

app.use('/user', userRoutes);

app.use('/', nuronRoutes);

app.listen(3000);
