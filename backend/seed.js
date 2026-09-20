const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();
const { categories, catTranslations, restaurantInfo, menuRaw, TRANSLATION_LANGS } = require('./seed-data');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  console.log('🌱 Starting database seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Run Schema
    console.log('Executing schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);

    // 2. Seed Categories
    console.log('Seeding categories...');
    for (const cat of categories) {
      await client.query(
        `INSERT INTO menu_categories (id, slug)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug`,
        [cat.id, cat.slug]
      );
    }

    // 3. Seed Category Translations
    console.log('Seeding category translations...');
    for (const trans of catTranslations) {
      await client.query(
        `INSERT INTO menu_category_translations (category_id, lang, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (category_id, lang) DO UPDATE SET name = EXCLUDED.name`,
        [trans.category_id, trans.lang, trans.name]
      );
    }

    // 4. Seed Restaurant Info
    console.log('Seeding restaurant info...');
    for (const item of restaurantInfo) {
      await client.query(
        `INSERT INTO restaurant_info (key, lang, content)
         VALUES ($1, $2, $3)
         ON CONFLICT (key, lang) DO UPDATE SET content = EXCLUDED.content`,
        [item.key, item.lang, item.content]
      );
    }

    // 5. Seed Admin User
    console.log('Seeding admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@balibong.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminbalibong123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await client.query(
      `INSERT INTO admin_users (email, password_hash, role)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [adminEmail, passwordHash]
    );

    // 6. Seed Initial Menu Items
    console.log('Seeding initial menu items and translations...');
    for (const item of menuRaw) {
      // Check if menu item already seeded
      const existCheck = await client.query(
        `SELECT mi.id FROM menu_items mi
         JOIN menu_item_translations mit ON mi.id = mit.menu_item_id
         WHERE mit.lang = 'id' AND mit.name = $1`,
        [item.name]
      );

      if (existCheck.rows.length === 0) {
        const itemRes = await client.query(
          `INSERT INTO menu_items (category_id, price, is_recommended, is_available)
           VALUES ($1, $2, $3, true) RETURNING id`,
          [item.cat, item.price, item.isRec || false]
        );
        const newItemId = itemRes.rows[0].id;

        // Seed ID Translation
        await client.query(
          `INSERT INTO menu_item_translations (menu_item_id, lang, name, description)
           VALUES ($1, 'id', $2, $3)`,
          [newItemId, item.name, `Deskripsi untuk ${item.name}`]
        );

        // Seed other languages
        for (const lang of TRANSLATION_LANGS) {
          const name = item.translations[lang] || item.name;
          await client.query(
            `INSERT INTO menu_item_translations (menu_item_id, lang, name, description)
             VALUES ($1, $2, $3, $4)`,
            [newItemId, lang, name, `Description for ${item.name} in ${lang}`]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
