'use strict';

// 3rd party middleware
const express = require('express');
const cors = require('cors');

// Custom middleware
const notFound = require('./middleware/error-handlers/404');
const errorHandler = require('./middleware/error-handlers/500');

// Routers
const authRouter = require('./auth/routes');

const todoRouter = require('./routes/todos');
const profileRouter = require('./routes/profiles');

const app = express();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('openapi.yml');

// App level middleware
app.use(cors());
// app.use(logger);

// Accept json or form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRouter);
app.use('/api/todos', todoRouter);
app.use('/api/profile', profileRouter);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.status(200).send('Welcome to the server!');
});

// Catch-all route (404)
app.use('*', notFound);

// Default error handler (500)
app.use(errorHandler);

module.exports = { app };
