const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data_fallback.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Add Categories
const newCategories = [
  { id: 6, slug: 'soft_drink' },
  { id: 7, slug: 'beer' },
  { id: 8, slug: 'cocktail' }
];
newCategories.forEach(cat => {
  if (!db.menu_categories.find(c => c.id === cat.id)) {
    db.menu_categories.push(cat);
  }
});

// Add Category Translations
const catTrans = [
  { category_id: 6, lang: 'id', name: 'Minuman Ringan' },
  { category_id: 6, lang: 'ja', name: 'ソフトドリンク' },
  { category_id: 6, lang: 'zh', name: '软饮料' },
  { category_id: 6, lang: 'ko', name: '청량 음료' },
  { category_id: 6, lang: 'es', name: 'Refresco' },

  { category_id: 7, lang: 'id', name: 'Bir' },
  { category_id: 7, lang: 'ja', name: 'ビール' },
  { category_id: 7, lang: 'zh', name: '啤酒' },
  { category_id: 7, lang: 'ko', name: '맥주' },
  { category_id: 7, lang: 'es', name: 'Cerveza' },

  { category_id: 8, lang: 'id', name: 'Koktail' },
  { category_id: 8, lang: 'ja', name: 'カクテル' },
  { category_id: 8, lang: 'zh', name: '鸡尾酒' },
  { category_id: 8, lang: 'ko', name: '칵테일' },
  { category_id: 8, lang: 'es', name: 'Cóctel' },
];

catTrans.forEach(ct => {
  if (!db.menu_category_translations.find(t => t.category_id === ct.category_id && t.lang === ct.lang)) {
    db.menu_category_translations.push(ct);
  }
});

// Add some sample items
const newItems = [
  { id: 1001, category_id: 6, price: 300, image_url: null, allergy_info: null, is_recommended: false, is_available: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1002, category_id: 7, price: 600, image_url: null, allergy_info: null, is_recommended: true, is_available: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 1003, category_id: 8, price: 900, image_url: null, allergy_info: null, is_recommended: true, is_available: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

newItems.forEach(item => {
  if (!db.menu_items.find(i => i.id === item.id)) {
    db.menu_items.push(item);
  }
});

const itemTrans = [
  { menu_item_id: 1001, lang: 'id', name: 'Es Teh Manis', description: 'Teh manis dingin yang menyegarkan.' },
  { menu_item_id: 1001, lang: 'ja', name: 'アイススイートティー', description: 'さわやかな冷たい甘いお茶。' },
  { menu_item_id: 1002, lang: 'id', name: 'Bintang Beer', description: 'Bir lokal Indonesia yang terkenal.' },
  { menu_item_id: 1002, lang: 'ja', name: 'ビンタンビール', description: '有名なインドネシアのローカルビール。' },
  { menu_item_id: 1003, lang: 'id', name: 'Bali Sunset Cocktail', description: 'Koktail eksotis khas Bali.' },
  { menu_item_id: 1003, lang: 'ja', name: 'バリサンセットカクテル', description: 'バリのトロピカルカクテル。' }
];

const langs = ['id', 'ja', 'zh', 'ko', 'es'];
itemTrans.forEach(it => {
  if (!db.menu_item_translations.find(t => t.menu_item_id === it.menu_item_id && t.lang === it.lang)) {
    db.menu_item_translations.push(it);
  }
});
langs.forEach(lang => {
  [1001, 1002, 1003].forEach(id => {
    if (!db.menu_item_translations.find(t => t.menu_item_id === id && t.lang === lang)) {
      const fallback = itemTrans.find(t => t.menu_item_id === id && t.lang === 'id');
      db.menu_item_translations.push({
        menu_item_id: id,
        lang: lang,
        name: fallback.name,
        description: fallback.description
      });
    }
  });
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Database updated successfully.');
