const { Router } = require('express');
const db = require('../config/db');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT r.*, p.sr_no, p.product_name, p.manufacturing_cost,
             p.weight_gm, p.length_cm, p.width_cm, p.height_cm, p.category_name
      FROM   calculation_results r
      JOIN   products p ON p.id = r.product_id
      ORDER  BY p.sr_no`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:product_id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM calculation_results WHERE product_id=$1 ORDER BY calculated_at DESC LIMIT 1',
      [req.params.product_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No results for this product' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/', async (req, res, next) => {
  try {
    await db.query('DELETE FROM calculation_results');
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
