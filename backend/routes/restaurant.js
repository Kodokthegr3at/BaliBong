const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/restaurant-info?lang=id
router.get('/', async (req, res) => {
  const lang = req.query.lang || 'id';
  
  try {
    const result = await db.query(
      'SELECT key, content FROM restaurant_info WHERE lang = $1',
      [lang]
    );
    
    // Convert array of keys to an object
    const info = {};
    result.rows.forEach(row => {
      info[row.key] = row.content;
    });

    // Make sure we have the required keys
    const requiredKeys = ['about', 'transportation', 'contact', 'hours'];
    requiredKeys.forEach(key => {
      if (!info[key]) {
        info[key] = '';
      }
    });

    res.json(info);
  } catch (err) {
    console.error('Error fetching restaurant info:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
