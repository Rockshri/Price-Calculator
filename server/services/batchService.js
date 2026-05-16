const { buildPricePoints, calculateAllCosts } = require('./calculatorService');
const { findBestScenario } = require('./bestScenarioService');

async function runBatch(db) {
  const products = (await db.query(
    'SELECT * FROM products WHERE is_active = TRUE ORDER BY sr_no'
  )).rows;

  const settingsRows = (await db.query('SELECT key, value FROM calculator_settings')).rows;
  const rawSettings  = {};
  settingsRows.forEach(r => {
    const num = parseFloat(r.value);
    rawSettings[r.key] = isNaN(num) ? r.value : num;
  });

  const s = {
    gstRate:              rawSettings.gst_rate,
    returnRate:           rawSettings.return_rate,
    marketingRate:        rawSettings.marketing_rate,
    avgStorageDays:       rawSettings.avg_storage_days,
    storageRatePerDay:    rawSettings.storage_rate_per_day,
    primaryTransport:     rawSettings.primary_transport,
    bulkPackaging:        rawSettings.bulk_packaging,
    inwardCharges:        rawSettings.inward_charges,
    outwardCharges:       rawSettings.outward_charges,
    returnHandling:       rawSettings.return_handling,
    returnLogisticsCost:  rawSettings.return_logistics_cost,
    productPackagingRate: rawSettings.product_packaging_rate,
    fulfillmentType:      rawSettings.fulfillment_type,
  };

  const feeData = {
    referral: (await db.query('SELECT * FROM referral_fees')).rows,
    closing:  (await db.query('SELECT * FROM closing_fees ORDER BY min_price')).rows,
    shipping: (await db.query('SELECT * FROM shipping_costs ORDER BY min_weight_kg')).rows,
  };

  // Delete existing results before batch insert
  await db.query('DELETE FROM calculation_results');

  const results = [];

  for (const product of products) {
    // Skip if any dimension is zero (mirrors VBA guard)
    if (!product.length_cm || !product.width_cm || !product.height_cm) continue;

    const prod = {
      manufacturingCost: Number(product.manufacturing_cost),
      weightGm:          Number(product.weight_gm),
      lengthCm:          Number(product.length_cm),
      widthCm:           Number(product.width_cm),
      heightCm:          Number(product.height_cm),
      categoryName:      product.category_name,
    };

    const pricePoints = buildPricePoints(prod.manufacturingCost);
    const scenarios   = pricePoints.map((price, i) => ({
      scenarioNo:      i + 1,
      ...calculateAllCosts(prod, price, s, feeData),
    }));

    const best = await findBestScenario(scenarios, prod, db);

    const profitOnCost = prod.manufacturingCost !== 0
      ? best.netProfit / prod.manufacturingCost
      : 0;

    await db.query(`
      INSERT INTO calculation_results (
        product_id, fulfillment_type,
        best_listing_price, best_selling_price,
        seller_side_costs, fulfilment_cost, amazon_charges, return_charges,
        net_profit, margin_pct, profit_on_cost_pct,
        fallback_level, is_optimal, recommendation, price_band, all_scenarios
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        product.id, s.fulfillmentType,
        best.listingPriceGST,       best.sellingPrice,
        best.sellerCosts,           best.fulfilmentCost,
        best.amazonCharges,         best.returnCharges,
        best.netProfit,             best.margin,            profitOnCost,
        best.fallbackLevel,         best.isOptimal,
        JSON.stringify(best.recommendation),
        JSON.stringify(best.priceBand),
        JSON.stringify(scenarios),
      ]
    );

    results.push({ productName: product.product_name, best, profitOnCost });
  }

  return results;
}

module.exports = { runBatch };
