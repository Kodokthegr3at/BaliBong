const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/menu?lang=id
router.get('/', async (req, res) => {
  const lang = req.query.lang || 'id';

  try {
    // 1. Fetch categories
    const categoriesQuery = `
      SELECT mc.id, mc.slug, mct.name, ja.name as name_ja 
      FROM menu_categories mc 
      JOIN menu_category_translations mct ON mc.id = mct.category_id 
      LEFT JOIN menu_category_translations ja ON mc.id = ja.category_id AND ja.lang = 'ja'
      WHERE mct.lang = $1
      ORDER BY mc.id
    `;
    const categoriesResult = await db.query(categoriesQuery, [lang]);

    // 2. Fetch menu items
    // mi.* rather than a column list so the menu keeps loading on a database
    // that hasn't run the spicy_level/is_vegetarian migration yet.
    // name_ja is the secondary Japanese label the redesign shows under each dish.
    const itemsQuery = `
      SELECT mi.*, mit.name, mit.description, ja.name as name_ja, mc.slug as category_slug 
      FROM menu_items mi 
      JOIN menu_item_translations mit ON mi.id = mit.menu_item_id 
      LEFT JOIN menu_item_translations ja ON mi.id = ja.menu_item_id AND ja.lang = 'ja'
      JOIN menu_categories mc ON mi.category_id = mc.id 
      WHERE mit.lang = $1
      ORDER BY mi.category_id, mi.id
    `;
    const itemsResult = await db.query(itemsQuery, [lang]);

    res.json({
      categories: categoriesResult.rows,
      items: itemsResult.rows
    });
  } catch (err) {
    console.error('Error fetching menu:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/menu/:id?lang=id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const lang = req.query.lang || 'id';

  try {
    const queryStr = `
      SELECT mi.id, mi.category_id, mi.price, mi.image_url, mi.allergy_info, mi.is_recommended, mi.is_available, mit.name, mit.description, mc.slug as category_slug 
      FROM menu_items mi 
      JOIN menu_item_translations mit ON mi.id = mit.menu_item_id 
      JOIN menu_categories mc ON mi.category_id = mc.id 
      WHERE mi.id = $1 AND mit.lang = $2
    `;
    const result = await db.query(queryStr, [id, lang]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching menu item ${id}:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
