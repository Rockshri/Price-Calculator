const { Router } = require('express');
const db = require('../config/db');
const { buildPricePoints, calculateAllCosts } = require('../services/calculatorService');
const { findBestScenario } = require('../services/bestScenarioService');
const { runBatch } = require('../services/batchService');

const router = Router();

async function loadFeeData() {
  const [referral, closing, shipping] = await Promise.all([
    db.query('SELECT * FROM referral_fees'),
    db.query('SELECT * FROM closing_fees ORDER BY min_price'),
    db.query('SELECT * FROM shipping_costs ORDER BY min_weight_kg'),
  ]);
  return { referral: referral.rows, closing: closing.rows, shipping: shipping.rows };
}

async function loadSettings() {
  const { rows } = await db.query('SELECT key, value FROM calculator_settings');
  const raw = {};
  rows.forEach(r => { const n = parseFloat(r.value); raw[r.key] = isNaN(n) ? r.value : n; });
  return {
    gstRate:             raw.gst_rate,
    returnRate:          raw.return_rate,
    marketingRate:       raw.marketing_rate,
    avgStorageDays:      raw.avg_storage_days,
    storageRatePerDay:   raw.storage_rate_per_day,
    primaryTransport:    raw.primary_transport,
    bulkPackaging:       raw.bulk_packaging,
    inwardCharges:       raw.inward_charges,
    outwardCharges:      raw.outward_charges,
    returnHandling:      raw.return_handling,
    returnLogisticsCost: raw.return_logistics_cost,
    productPackagingRate:raw.product_packaging_rate,
    fulfillmentType:     raw.fulfillment_type,
  };
}

// POST /api/calculator/single — one product, one price point
router.post('/single', async (req, res, next) => {
  try {
    const { product, listingPriceGST } = req.body;
    const [settings, feeData] = await Promise.all([loadSettings(), loadFeeData()]);
    const result = calculateAllCosts(product, listingPriceGST, settings, feeData);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/calculator/scenarios — all 26 scenarios + best
// Accepts optional settingsOverride to support what-if sensitivity analysis
router.post('/scenarios', async (req, res, next) => {
  try {
    const { product, settingsOverride = {} } = req.body;
    const [dbSettings, feeData] = await Promise.all([loadSettings(), loadFeeData()]);
    const settings = { ...dbSettings, ...settingsOverride };
    const pricePoints = buildPricePoints(product.manufacturingCost);
    const scenarios   = pricePoints.map(price => ({
      ...calculateAllCosts(product, price, settings, feeData),
    }));
    const best = await findBestScenario(scenarios, product, db);
    const profitOnCost = product.manufacturingCost
      ? best.netProfit / product.manufacturingCost : 0;
    res.json({ best, scenarios, profitOnCost, pricePoints });
  } catch (err) { next(err); }
});

// POST /api/calculator/batch — replaces VBA RunAllProducts
router.post('/batch', async (req, res, next) => {
  try {
    const results = await runBatch(db);
    res.json({ count: results.length, results });
  } catch (err) { next(err); }
});

module.exports = router;
