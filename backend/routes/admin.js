const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const qrCode = require('qrcode');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Never fall back to a fixed, publicly-known secret: generate a random one if
// JWT_SECRET isn't configured. Tokens won't survive a restart in that case,
// which is fine for local testing but must not happen in a real deployment.
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set. Using a random secret for this process only — admin sessions will not survive a restart. Set JWT_SECRET in your .env before deploying.');
}
const fallbackDbPath = path.join(__dirname, '../data_fallback.json');

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
}

// Helper to read fallback DB
function readFallback() {
  return JSON.parse(fs.readFileSync(fallbackDbPath, 'utf8'));
}

// Helper to write fallback DB
function writeFallback(data) {
  fs.writeFileSync(fallbackDbPath, JSON.stringify(data, null, 2));
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// POST /api/admin/auth/login
router.post('/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let user = null;

    if (db.useFallback()) {
      const data = readFallback();
      user = data.admin_users.find(u => u.email === email);
    } else {
      const result = await db.query('SELECT * FROM admin_users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, email: user.email, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const ALLOWED_IMAGE_TYPES = { png: 'png', jpeg: 'jpg', jpg: 'jpg', webp: 'webp', gif: 'gif' };

// POST /api/admin/upload-image
// Uses Vercel Blob storage rather than the local filesystem: serverless
// functions on Vercel run on a read-only filesystem outside of /tmp, so
// fs.writeFileSync() here would fail on every deploy (EROFS).
router.post('/upload-image', authenticateToken, async (req, res) => {
  const { imageBase64, type } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });
  try {
    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return res.status(400).json({ error: 'Invalid base64 string' });
    const mimeSubtype = matches[1].toLowerCase();
    const extension = ALLOWED_IMAGE_TYPES[mimeSubtype];
    if (!extension) return res.status(400).json({ error: 'Unsupported image type' });
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${Date.now()}.${extension}`;
    const folder = type === 'assets' ? 'assets' : 'menu';
    const blob = await put(`images/${folder}/${filename}`, buffer, {
      access: 'public',
      contentType: `image/${mimeSubtype}`
    });
    res.json({ imageUrl: blob.url });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// GET /api/admin/menu (Admin: Get detailed menu items with all translations)
router.get('/menu', authenticateToken, async (req, res) => {
  try {
    if (db.useFallback()) {
      const data = readFallback();
      // Map menu items to include translations array
      const items = data.menu_items.map(item => {
        const translations = data.menu_item_translations.filter(t => t.menu_item_id === item.id);
        const transObj = {};
        translations.forEach(t => {
          transObj[`name_${t.lang}`] = t.name;
          transObj[`desc_${t.lang}`] = t.description;
        });
        return { ...item, ...transObj };
      });
      res.json(items);
    } else {
      // In PostgreSQL, fetch items and group translations
      const result = await db.query(`
        SELECT mi.*, 
               json_object_agg(mit.lang, json_build_object('name', mit.name, 'description', mit.description)) as translations
        FROM menu_items mi
        LEFT JOIN menu_item_translations mit ON mi.id = mit.menu_item_id
        GROUP BY mi.id
        ORDER BY mi.id
      `);
      
      const items = result.rows.map(row => {
        const transObj = {};
        if (row.translations) {
          Object.entries(row.translations).forEach(([lang, val]) => {
            if (val) {
              transObj[`name_${lang}`] = val.name;
              transObj[`desc_${lang}`] = val.description;
            }
          });
        }
        return { ...row, ...transObj, translations: undefined };
      });
      res.json(items);
    }
  } catch (err) {
    console.error('Error fetching admin menu:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/admin/menu (Admin: Create new menu item)
router.post('/menu', authenticateToken, async (req, res) => {
  const { category_id, price, image_url, is_recommended, is_available, allergy_info } = req.body;
  // Translations from body: name_id, desc_id, name_ja, desc_ja, etc.
  const langs = ['id', 'ja', 'zh', 'ko', 'es'];

  try {
    if (db.useFallback()) {
      const data = readFallback();
      const newId = data.menu_items.length > 0 ? Math.max(...data.menu_items.map(i => i.id)) + 1 : 1;
      
      const newItem = {
        id: newId,
        category_id: parseInt(category_id),
        price: parseInt(price),
        image_url: image_url || null,
        allergy_info: allergy_info || null,
        is_recommended: !!is_recommended,
        is_available: is_available !== undefined ? !!is_available : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      data.menu_items.push(newItem);

      let transId = data.menu_item_translations.length > 0 ? Math.max(...data.menu_item_translations.map(t => t.id)) + 1 : 1;
      langs.forEach(lang => {
        data.menu_item_translations.push({
          id: transId++,
          menu_item_id: newId,
          lang,
          name: req.body[`name_${lang}`] || req.body[`name_id`] || 'Unnamed',
          description: req.body[`desc_${lang}`] || req.body[`desc_id`] || ''
        });
      });

      writeFallback(data);
      res.status(201).json(newItem);
    } else {
      // Postgres Transaction
      await db.query('BEGIN');
      
      const itemResult = await db.query(
        `INSERT INTO menu_items (category_id, price, image_url, allergy_info, is_recommended, is_available) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [category_id, price, image_url, allergy_info, is_recommended, is_available]
      );
      const newItem = itemResult.rows[0];

      for (const lang of langs) {
        const name = req.body[`name_${lang}`] || req.body[`name_id`] || 'Unnamed';
        const description = req.body[`desc_${lang}`] || req.body[`desc_id`] || '';
        await db.query(
          `INSERT INTO menu_item_translations (menu_item_id, lang, name, description) 
           VALUES ($1, $2, $3, $4)`,
          [newItem.id, lang, name, description]
        );
      }

      await db.query('COMMIT');
      res.status(201).json(newItem);
    }
  } catch (err) {
    if (!db.useFallback()) await db.query('ROLLBACK');
    console.error('Error creating menu item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/admin/menu/:id (Admin: Update menu item)
router.put('/menu/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { category_id, price, image_url, is_recommended, is_available, allergy_info } = req.body;
  const langs = ['id', 'ja', 'zh', 'ko', 'es'];

  try {
    if (db.useFallback()) {
      const data = readFallback();
      const itemIdx = data.menu_items.findIndex(i => i.id === parseInt(id));

      if (itemIdx === -1) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      data.menu_items[itemIdx] = {
        ...data.menu_items[itemIdx],
        category_id: parseInt(category_id),
        price: parseInt(price),
        image_url: image_url !== undefined ? image_url : data.menu_items[itemIdx].image_url,
        allergy_info: allergy_info !== undefined ? allergy_info : data.menu_items[itemIdx].allergy_info,
        is_recommended: !!is_recommended,
        is_available: is_available !== undefined ? !!is_available : data.menu_items[itemIdx].is_available,
        updated_at: new Date().toISOString()
      };

      // Update translations
      langs.forEach(lang => {
        const transIdx = data.menu_item_translations.findIndex(t => t.menu_item_id === parseInt(id) && t.lang === lang);
        const name = req.body[`name_${lang}`];
        const description = req.body[`desc_${lang}`];

        if (transIdx !== -1) {
          if (name !== undefined) data.menu_item_translations[transIdx].name = name;
          if (description !== undefined) data.menu_item_translations[transIdx].description = description;
        } else {
          // Create translation if not exists
          const transId = data.menu_item_translations.length > 0 ? Math.max(...data.menu_item_translations.map(t => t.id)) + 1 : 1;
          data.menu_item_translations.push({
            id: transId,
            menu_item_id: parseInt(id),
            lang,
            name: name || '',
            description: description || ''
          });
        }
      });

      writeFallback(data);
      res.json(data.menu_items[itemIdx]);
    } else {
      await db.query('BEGIN');

      const itemResult = await db.query(
        `UPDATE menu_items 
         SET category_id = $1, price = $2, image_url = $3, allergy_info = $4, is_recommended = $5, is_available = $6, updated_at = NOW() 
         WHERE id = $7 RETURNING *`,
        [category_id, price, image_url, allergy_info, is_recommended, is_available, id]
      );

      if (itemResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Menu item not found' });
      }

      for (const lang of langs) {
        const name = req.body[`name_${lang}`];
        const description = req.body[`desc_${lang}`];
        // A partial update (e.g. only the Indonesian fields changed) must not
        // blank out or crash on languages the request simply didn't include —
        // leave those translations exactly as they were.
        if (name === undefined && description === undefined) continue;

        await db.query(
          `INSERT INTO menu_item_translations (menu_item_id, lang, name, description)
           VALUES ($1, $2, COALESCE($3, ''), $4)
           ON CONFLICT (menu_item_id, lang)
           DO UPDATE SET
             name = COALESCE($3, menu_item_translations.name),
             description = COALESCE($4, menu_item_translations.description)`,
          [id, lang, name, description]
        );
      }

      await db.query('COMMIT');
      res.json(itemResult.rows[0]);
    }
  } catch (err) {
    if (!db.useFallback()) await db.query('ROLLBACK');
    console.error('Error updating menu item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/admin/menu/:id (Admin: Delete menu item)
router.delete('/menu/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    if (db.useFallback()) {
      const data = readFallback();
      const itemIdx = data.menu_items.findIndex(i => i.id === parseInt(id));

      if (itemIdx === -1) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      data.menu_items.splice(itemIdx, 1);
      data.menu_item_translations = data.menu_item_translations.filter(t => t.menu_item_id !== parseInt(id));

      writeFallback(data);
      res.json({ success: true });
    } else {
      const result = await db.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      res.json({ success: true });
    }
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/admin/qr (Admin: Get all table QR codes)
router.get('/qr', authenticateToken, async (req, res) => {
  try {
    let qrCodes = [];
    if (db.useFallback()) {
      const data = readFallback();
      qrCodes = data.qr_codes;
    } else {
      const result = await db.query('SELECT * FROM qr_codes ORDER BY id DESC');
      qrCodes = result.rows;
    }
    res.json(qrCodes);
  } catch (err) {
    console.error('Error fetching QR codes:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/admin/qr (Admin: Generate new table QR code)
router.post('/qr', authenticateToken, async (req, res) => {
  const { table_label, target_url } = req.body;

  if (!table_label || !target_url) {
    return res.status(400).json({ error: 'Table label and target URL are required' });
  }

  try {
    // Generate QR Code as Base64 Data URL
    const qr_image_url = await qrCode.toDataURL(target_url, {
      width: 400,
      margin: 2,
    });

    let newQr = null;
    if (db.useFallback()) {
      const data = readFallback();
      newQr = {
        id: data.qr_codes.length > 0 ? Math.max(...data.qr_codes.map(q => q.id)) + 1 : 1,
        table_label,
        target_url,
        qr_image_url,
        created_at: new Date().toISOString()
      };
      data.qr_codes.push(newQr);
      writeFallback(data);
    } else {
      const result = await db.query(
        `INSERT INTO qr_codes (table_label, target_url, qr_image_url) 
         VALUES ($1, $2, $3) RETURNING *`,
        [table_label, target_url, qr_image_url]
      );
      newQr = result.rows[0];
    }

    res.status(201).json(newQr);
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/admin/restaurant-info (Admin: Update info)
router.put('/restaurant-info', authenticateToken, async (req, res) => {
  const { about, transportation, contact, hours, lang } = req.body;

  if (!lang) {
    return res.status(400).json({ error: 'Language is required' });
  }

  try {
    const keys = { about, transportation, contact, hours };

    if (db.useFallback()) {
      const data = readFallback();
      
      Object.entries(keys).forEach(([key, content]) => {
        if (content !== undefined) {
          const idx = data.restaurant_info.findIndex(info => info.key === key && info.lang === lang);
          if (idx !== -1) {
            data.restaurant_info[idx].content = content;
            data.restaurant_info[idx].updated_at = new Date().toISOString();
          } else {
            data.restaurant_info.push({
              key,
              lang,
              content,
              updated_at: new Date().toISOString()
            });
          }
        }
      });

      writeFallback(data);
      res.json({ success: true });
    } else {
      await db.query('BEGIN');

      for (const [key, content] of Object.entries(keys)) {
        if (content !== undefined) {
          await db.query(
            `INSERT INTO restaurant_info (key, lang, content, updated_at) 
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (key, lang) 
             DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
            [key, lang, content]
          );
        }
      }

      await db.query('COMMIT');
      res.json({ success: true });
    }
  } catch (err) {
    if (!db.useFallback()) await db.query('ROLLBACK');
    console.error('Error updating restaurant info:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/admin/design (Get design settings)
router.get('/design', async (req, res) => {
  try {
    if (db.useFallback()) {
      const data = readFallback();
      res.json(data.design_settings || {});
    } else {
      // In PostgreSQL, maybe fetch from a design_settings table (mocked here for simplicity if unsupported)
      res.json({});
    }
  } catch (err) {
    console.error('Error fetching design info:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/admin/design (Update design settings)
router.put('/design', authenticateToken, async (req, res) => {
  const { background_url, garuda_url, barong_url } = req.body;
  try {
    if (db.useFallback()) {
      const data = readFallback();
      if (!data.design_settings) data.design_settings = {};
      if (background_url !== undefined) data.design_settings.background_url = background_url;
      if (garuda_url !== undefined) data.design_settings.garuda_url = garuda_url;
      if (barong_url !== undefined) data.design_settings.barong_url = barong_url;
      
      writeFallback(data);
      res.json({ success: true });
    } else {
      // No-op for postgres since not fully implemented yet
      res.json({ success: true });
    }
  } catch (err) {
    console.error('Error updating design info:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
