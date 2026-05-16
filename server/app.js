require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { errorHandler } = require('./middleware/errorHandler');
const categoriesRouter = require('./routes/categories');
const productsRouter   = require('./routes/products');
const calculatorRouter = require('./routes/calculator');
const resultsRouter    = require('./routes/results');
const feesRouter       = require('./routes/fees');
const settingsRouter   = require('./routes/settings');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/categories', categoriesRouter);
app.use('/api/products',   productsRouter);
app.use('/api/calculator', calculatorRouter);
app.use('/api/results',    resultsRouter);
app.use('/api/fees',       feesRouter);
app.use('/api/settings',   settingsRouter);

app.use(errorHandler);

module.exports = app;
