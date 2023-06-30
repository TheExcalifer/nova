const express = require('express');
const bodyParser = require('body-parser');
const app = express();

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
