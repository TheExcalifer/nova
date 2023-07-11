const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
app.use(bodyParser.json());

// routes
const nuronRoutes = require('./routes/nuron');
const userRoutes = require('./routes/user');

app.use('/user', userRoutes);

app.use('/', nuronRoutes);

// app.use((error, req, res, next) => {
//   console.log('reach error handle');
//   res.json({ msg: 'error' });
// });

app.listen(3000);
