require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { errorHandler } = require('./middleware/errorHandler');
const auth             = require('./middleware/authMiddleware');
const authRouter       = require('./routes/auth');
const categoriesRouter = require('./routes/categories');
const productsRouter   = require('./routes/products');
const calculatorRouter = require('./routes/calculator');
const resultsRouter    = require('./routes/results');
const feesRouter       = require('./routes/fees');
const settingsRouter   = require('./routes/settings');

const app = express();

app.use(cors());
app.use(express.json());

// Public
app.use('/api/auth', authRouter);

// Protected
app.use('/api/categories', auth, categoriesRouter);
app.use('/api/products',   auth, productsRouter);
app.use('/api/calculator', auth, calculatorRouter);
app.use('/api/results',    auth, resultsRouter);
app.use('/api/fees',       auth, feesRouter);
app.use('/api/settings',   auth, settingsRouter);

app.use(errorHandler);

module.exports = app;
