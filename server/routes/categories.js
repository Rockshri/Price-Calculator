const { Router } = require('express');
const db = require('../config/db');

const router = Router();

// All categories
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM categories ORDER BY main_category, category_name');
    res.json(rows);
  } catch (err) { next(err); }
});

// All category pricing rules
router.get('/pricing-rules', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM category_pricing_rules ORDER BY category_name');
    res.json(rows);
  } catch (err) { next(err); }
});

// Update a pricing rule
router.put('/pricing-rules/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      min_multiplier, sweet_multiplier, max_multiplier,
      min_margin_pct, target_margin_pct,
      abs_price_floor, abs_price_ceiling,
      typical_return_rate, weight_margin, weight_conversion,
      weight_profit_inr, prefer_charm_pricing,
    } = req.body;
    const { rows } = await db.query(`
      UPDATE category_pricing_rules SET
        min_multiplier=$1, sweet_multiplier=$2, max_multiplier=$3,
        min_margin_pct=$4, target_margin_pct=$5,
        abs_price_floor=$6, abs_price_ceiling=$7,
        typical_return_rate=$8, weight_margin=$9, weight_conversion=$10,
        weight_profit_inr=$11, prefer_charm_pricing=$12,
        updated_at=NOW()
      WHERE id=$13 RETURNING *`,
      [min_multiplier, sweet_multiplier, max_multiplier,
       min_margin_pct, target_margin_pct,
       abs_price_floor, abs_price_ceiling,
       typical_return_rate, weight_margin, weight_conversion,
       weight_profit_inr, prefer_charm_pricing, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Rule not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
