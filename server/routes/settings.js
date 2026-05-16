const { Router } = require('express');
const db = require('../config/db');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM calculator_settings ORDER BY key');
    res.json(rows);
  } catch (err) { next(err); }
});

router.put('/:key', async (req, res, next) => {
  try {
    const { value } = req.body;
    const { rows } = await db.query(
      'UPDATE calculator_settings SET value=$1, updated_at=NOW() WHERE key=$2 RETURNING *',
      [String(value), req.params.key]
    );
    if (!rows.length) return res.status(404).json({ error: 'Setting not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
