// Universal best-scenario engine.
// Loads per-category rules from DB, falls back to DEFAULT row.
//
// Scoring uses three orthogonal axes:
//   marginScore  — how close to (or above) target margin % [capped at 1.0 — no bonus for beating target]
//   convScore    — smooth curve peaked exactly at band.sweet; penalises deviation in both directions
//   priceScore   — sweet / price: directly penalises listing above the sweet spot price
//
// The old profitScore (netProfit / maxProfitInPool) was removed because it always gave
// the highest-priced scenario a perfect 1.0, systematically pulling recommendations high.

async function findBestScenario(scenarios, product, db) {
  // STEP 1 — load category rules
  let res = await db.query(
    'SELECT * FROM category_pricing_rules WHERE category_name = $1',
    [product.categoryName]
  );
  if (!res.rows.length) {
    res = await db.query("SELECT * FROM category_pricing_rules WHERE category_name = 'DEFAULT'");
  }
  const r = res.rows[0];

  const cost = Number(product.manufacturingCost);

  // STEP 2 — compute price band
  const band = {
    min:   Math.max(cost * Number(r.min_multiplier),   Number(r.abs_price_floor   || 0)),
    sweet: cost * Number(r.sweet_multiplier),
    max:   Math.min(cost * Number(r.max_multiplier),   Number(r.abs_price_ceiling || 9999999)),
  };
  if (band.max < band.min) band.max = band.min * 2;

  // STEP 3 — 4-level fallback pool
  const targetMargin = Number(r.target_margin_pct);
  const minMargin    = Number(r.min_margin_pct);

  function inBand(s) {
    return s.listingPriceGST >= band.min && s.listingPriceGST <= band.max;
  }

  let pool;
  let fallbackLevel = null;

  // Level 1: target margin + within band (OPTIMAL)
  pool = scenarios.filter(s => s.netProfit > 0 && s.margin >= targetMargin && inBand(s));

  // Level 2: min margin + within band
  if (!pool.length) {
    pool = scenarios.filter(s => s.netProfit > 0 && s.margin >= minMargin && inBand(s));
    if (pool.length) fallbackLevel = 'BELOW_TARGET_MARGIN';
  }

  // Level 3: any positive profit within band
  if (!pool.length) {
    pool = scenarios.filter(s => s.netProfit > 0 && inBand(s));
    if (pool.length) fallbackLevel = 'THIN_MARGIN';
  }

  // Level 4: any positive profit (ignore band)
  if (!pool.length) {
    pool = scenarios.filter(s => s.netProfit > 0);
    if (pool.length) fallbackLevel = 'OUTSIDE_MARKET_BAND';
  }

  // Level 5: least loss
  if (!pool.length) {
    pool = scenarios;
    fallbackLevel = 'LOSS_MAKING';
  }

  // STEP 4 — score each candidate
  //
  // Scale for the smooth conversion curve: use the larger half-band so the
  // curve is well-behaved whether sweet is centred or skewed toward one edge.
  const halfBand = Math.max(band.sweet - band.min, band.max - band.sweet, 1);

  // conversionScore: smooth quadratic peaked exactly at band.sweet.
  // Returns 1.0 at sweet spot, ~0.25 at band edges, min 0.10 beyond.
  function conversionScore(price) {
    const t = Math.min(Math.abs(price - band.sweet) / halfBand, 1.5);
    return Math.max(0.10, 1.0 - 0.50 * t - 0.25 * t * t);
  }

  // charmBonus: +0.05 for prices within ₹10 below a psychological threshold.
  function charmBonus(price) {
    if (!r.prefer_charm_pricing) return 0;
    const thresholds = [250, 500, 750, 1000, 1500, 2000, 2500, 3000, 5000, 10000];
    return thresholds.some(t => price < t && price >= t - 10) ? 0.05 : 0;
  }

  function scoreScenario(s) {
    // marginScore: 0→1 as margin rises from 0→target. Capped at 1.0 above target
    // so over-achieving doesn't create upward price pressure.
    const marginScore = s.margin <= 0 ? 0 : Math.min(s.margin / targetMargin, 1.0);

    // convScore: smooth bell centred on band.sweet. Charm pricing adds a small bonus.
    const convScore = conversionScore(s.listingPriceGST) + charmBonus(s.listingPriceGST);

    // priceScore: sweet / price — peaks at 1.0 when listing = sweet spot, falls as
    // price rises above sweet. Prices below sweet are not penalised here (they get
    // a lower marginScore instead). This replaces the old absolute-profit score that
    // always rewarded the most expensive scenario.
    const priceScore = Math.min(band.sweet / Math.max(s.listingPriceGST, 1), 1.0);

    return (
      marginScore * Number(r.weight_margin)     +
      convScore   * Number(r.weight_conversion) +
      priceScore  * Number(r.weight_profit_inr)
    );
  }

  // STEP 5 — pick winner; prefer lower price when scores are within 1%
  const scored = pool.map(s => ({ ...s, score: scoreScenario(s) }));
  const maxScore = Math.max(...scored.map(s => s.score));
  const topCandidates = scored.filter(s => s.score >= maxScore - 0.01);
  const best = topCandidates.reduce((a, b) =>
    a.listingPriceGST <= b.listingPriceGST ? a : b
  );

  return {
    ...best,
    priceBand:     band,
    categoryRules: r,
    fallbackLevel,
    isOptimal:     fallbackLevel === null,
    recommendation: buildRecommendation(best, band, fallbackLevel, r),
  };
}

function buildRecommendation(best, band, fallback, r) {
  const margin = (best.margin * 100).toFixed(1);
  const target = (Number(r.target_margin_pct) * 100).toFixed(0);
  const price  = best.listingPriceGST;

  if (!fallback) {
    return {
      status:  'OPTIMAL',
      message: `List at ₹${price} — ${margin}% margin within market range ₹${Math.round(band.min)}–₹${Math.round(band.max)}`,
      action:  'PROCEED',
    };
  }

  const map = {
    BELOW_TARGET_MARGIN: {
      status:  'WARNING',
      message: `Best margin is ${margin}% — below your ${target}% target. Consider reducing packaging or transport cost.`,
      action:  'REVIEW_COST',
    },
    THIN_MARGIN: {
      status:  'WARNING',
      message: `Very thin margin at ₹${price}. Ensure order volume can compensate. Review all cost components.`,
      action:  'REVIEW_COST',
    },
    OUTSIDE_MARKET_BAND: {
      status:  'ALERT',
      message: `No profitable price within market band ₹${Math.round(band.min)}–₹${Math.round(band.max)}. Reduce cost or reposition product.`,
      action:  'REPRICE_OR_REDUCE_COST',
    },
    LOSS_MAKING: {
      status:  'CRITICAL',
      message: 'Loss-making at ALL price points. Do not list. Manufacturing cost must be reduced significantly.',
      action:  'DO_NOT_LIST',
    },
  };

  return map[fallback] || { status: 'UNKNOWN', message: 'Manual review required.', action: 'MANUAL_REVIEW' };
}

module.exports = { findBestScenario };
