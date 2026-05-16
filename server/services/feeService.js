// Thin wrapper used by /api/fees/* routes for on-demand fee lookups.
const { lookupReferralFee, lookupClosingFee, lookupShippingCost } = require('./calculatorService');

async function getReferralFee(db, categoryName, listingPrice) {
  const { rows } = await db.query('SELECT * FROM referral_fees WHERE category_name = $1', [categoryName]);
  return lookupReferralFee(rows, categoryName, listingPrice);
}

async function getClosingFee(db, listingPrice, type = 'easy_ship') {
  const { rows } = await db.query('SELECT * FROM closing_fees ORDER BY min_price');
  return lookupClosingFee(rows, listingPrice, type);
}

async function getShippingFee(db, billableWeightKg) {
  const { rows } = await db.query('SELECT * FROM shipping_costs ORDER BY min_weight_kg');
  return lookupShippingCost(rows, billableWeightKg);
}

module.exports = { getReferralFee, getClosingFee, getShippingFee };
