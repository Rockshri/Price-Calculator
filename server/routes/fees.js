const { Router } = require('express');
const db = require('../config/db');
const { getReferralFee, getClosingFee, getShippingFee } = require('../services/feeService');

const router = Router();

router.get('/referral', async (req, res, next) => {
  try {
    const { category, price } = req.query;
    const fee = await getReferralFee(db, category, parseFloat(price));
    res.json({ fee });
  } catch (err) { next(err); }
});

router.get('/closing', async (req, res, next) => {
  try {
    const { price, type = 'easy_ship' } = req.query;
    const fee = await getClosingFee(db, parseFloat(price), type);
    res.json({ fee });
  } catch (err) { next(err); }
});

router.get('/shipping', async (req, res, next) => {
  try {
    const { weight } = req.query;
    const fee = await getShippingFee(db, parseFloat(weight));
    res.json({ fee });
  } catch (err) { next(err); }
});

module.exports = router;
