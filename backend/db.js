// Neon's serverless driver is a drop-in replacement for pg's Pool/Client that
// uses HTTP/WebSocket transport instead of a raw TCP connection — the latter
// doesn't reliably survive Neon's compute-suspend cold starts within a
// serverless function's short lifetime, which caused frequent, hard-to-debug
// false fallbacks to the local JSON store in production.
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { categories, catTranslations, restaurantInfo, menuRaw, TRANSLATION_LANGS } = require('./seed-data');

const dbPath = path.join(__dirname, 'data_fallback.json');

// The JSON fallback exists purely so this project can run locally without a
// real Postgres instance. It is never a production failure mode: once
// DATABASE_URL is configured, Postgres is authoritative and a query error
// propagates to the caller as a real error instead of silently substituting
// fake data. (A one-time connection test used to decide this instead — if
// that single attempt was slow, e.g. Neon waking from a suspended compute,
// the whole serverless instance stayed wrongly stuck on the fallback for its
// entire lifetime, serving fake data indefinitely even though Postgres was
// actually fine on the very next request.)
const useFallback = !process.env.DATABASE_URL;

const pool = useFallback ? null : new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});

// Initial mock data structure, built from the same seed data Postgres uses
// (backend/seed-data.js) so the local fallback can never drift from
// production's categories/translations the way the old hardcoded copy did.
const defaultData = {
  restaurant_info: restaurantInfo.slice(),
  menu_categories: categories.slice(),
  menu_category_translations: catTranslations.slice(),
  menu_items: [],
  menu_item_translations: [],
  qr_codes: [],
  admin_users: [
    {
      id: 1,
      email: process.env.ADMIN_EMAIL || 'admin@balibong.com',
      password_hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'adminbalibong123', 10),
      role: 'admin'
    }
  ]
};

function initializeFallbackData() {
  if (!fs.existsSync(dbPath)) {
    console.log('📝 Creating initial local JSON database...');

    let itemId = 1;
    let transId = 1;

    for (const item of menuRaw) {
      defaultData.menu_items.push({
        id: itemId,
        category_id: item.cat,
        price: item.price,
        image_url: null,
        is_recommended: item.isRec || false,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Insert ID translation
      defaultData.menu_item_translations.push({
        id: transId++,
        menu_item_id: itemId,
        lang: 'id',
        name: item.name,
        description: item.description || `Deskripsi untuk ${item.name}`
      });

      // Insert other translations
      for (const lang of TRANSLATION_LANGS) {
        defaultData.menu_item_translations.push({
          id: transId++,
          menu_item_id: itemId,
          lang: lang,
          name: item.translations[lang] || item.name,
          description: `Description for ${item.name} in ${lang}`
        });
      }

      itemId++;
    }

    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
  }
}

if (useFallback) {
  console.warn('⚠️  DATABASE_URL is not set. Using the local JSON fallback database (development only).');
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('⚠️  ADMIN_PASSWORD is not set — the fallback admin account is using a well-known default password. Set ADMIN_PASSWORD in your .env before deploying.');
  }
  initializeFallbackData();
} else {
  console.log('✅ DATABASE_URL is configured — using PostgreSQL for every query.');
}

async function query(text, params) {
  if (useFallback) {
    // Basic fallback parser for development without Postgres
    initializeFallbackData();
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // Simplified SQL query handler for simple queries
    const textLower = text.toLowerCase().trim();

    if (textLower.startsWith('select') && textLower.includes('restaurant_info')) {
      // SELECT * FROM restaurant_info WHERE lang = $1
      let rows = data.restaurant_info;
      if (params && params.length > 0) {
        rows = rows.filter(r => r.lang === params[0]);
      }
      return { rows };
    }

    if (textLower.startsWith('select') && textLower.includes('from menu_categories') && !textLower.includes('from menu_items')) {
      // Return categories with names based on language
      // Typically:
      // SELECT mc.id, mc.slug, mct.name FROM menu_categories mc JOIN menu_category_translations mct ON mc.id = mct.category_id WHERE mct.lang = $1
      const lang = params && params.length > 0 ? params[0] : 'id';
      const rows = data.menu_categories.map(c => {
        const trans = data.menu_category_translations.find(t => t.category_id === c.id && t.lang === lang);
        const ja = data.menu_category_translations.find(t => t.category_id === c.id && t.lang === 'ja');
        return {
          id: c.id,
          slug: c.slug,
          name: trans ? trans.name : c.slug,
          name_ja: ja ? ja.name : null
        };
      });
      return { rows };
    }

    if (textLower.startsWith('select') && textLower.includes('from menu_items')) {
      // Join menu_items with translations
      // SELECT mi.*, mit.name, mit.description, mc.slug as category_slug FROM menu_items mi JOIN menu_item_translations mit ON mi.id = mit.menu_item_id JOIN menu_categories mc ON mi.category_id = mc.id WHERE mit.lang = $1
      const lang = params && params.length > 0 ? params[0] : 'id';
      const rows = data.menu_items.map(item => {
        const trans = data.menu_item_translations.find(t => t.menu_item_id === item.id && t.lang === lang);
        const ja = data.menu_item_translations.find(t => t.menu_item_id === item.id && t.lang === 'ja');
        const cat = data.menu_categories.find(c => c.id === item.category_id);
        return {
          ...item,
          name: trans ? trans.name : `Item ${item.id}`,
          name_ja: ja ? ja.name : null,
          description: trans ? trans.description : '',
          category_slug: cat ? cat.slug : ''
        };
      });
      return { rows };
    }

    if (textLower.startsWith('select') && textLower.includes('admin_users')) {
      // SELECT * FROM admin_users WHERE email = $1
      if (params && params.length > 0) {
        const email = params[0];
        const rows = data.admin_users.filter(u => u.email === email);
        return { rows };
      }
    }

    if (textLower.startsWith('insert into qr_codes')) {
      // INSERT INTO qr_codes (table_label, target_url, qr_image_url) VALUES ($1, $2, $3) RETURNING *
      const newQr = {
        id: data.qr_codes.length + 1,
        table_label: params[0],
        target_url: params[1],
        qr_image_url: params[2],
        created_at: new Date().toISOString()
      };
      data.qr_codes.push(newQr);
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      return { rows: [newQr] };
    }

    if (textLower.startsWith('select') && textLower.includes('qr_codes')) {
      // SELECT * FROM qr_codes
      return { rows: data.qr_codes };
    }

    // Default empty array if query not recognized
    return { rows: [] };
  } else {
    return pool.query(text, params);
  }
}

module.exports = {
  query,
  pool,
  useFallback: () => useFallback
};
