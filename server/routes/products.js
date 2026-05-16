const { Router } = require('express');
const db = require('../config/db');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM products WHERE is_active = TRUE ORDER BY sr_no'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { sr_no, product_name, category_name, weight_gm, length_cm, width_cm, height_cm, manufacturing_cost, image_url } = req.body;
    const { rows } = await db.query(`
      INSERT INTO products (sr_no, product_name, category_name, weight_gm, length_cm, width_cm, height_cm, manufacturing_cost, image_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [sr_no, product_name, category_name, weight_gm, length_cm, width_cm, height_cm, manufacturing_cost, image_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { sr_no, product_name, category_name, weight_gm, length_cm, width_cm, height_cm, manufacturing_cost, image_url } = req.body;
    const { rows } = await db.query(`
      UPDATE products SET
        sr_no=$1, product_name=$2, category_name=$3,
        weight_gm=$4, length_cm=$5, width_cm=$6, height_cm=$7,
        manufacturing_cost=$8, image_url=$9, updated_at=NOW()
      WHERE id=$10 RETURNING *`,
      [sr_no, product_name, category_name, weight_gm, length_cm, width_cm, height_cm, manufacturing_cost, image_url, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('UPDATE products SET is_active=FALSE, updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
