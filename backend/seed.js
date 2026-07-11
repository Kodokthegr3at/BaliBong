const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

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
    const categories = [
      { id: 1, slug: 'makanan_berat' },
      { id: 2, slug: 'makanan_sayur' },
      { id: 3, slug: 'manisan' },
      { id: 4, slug: 'ala_carte' },
      { id: 5, slug: 'rekomendasi' }
    ];
    
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
    const catTranslations = [
      { category_id: 1, lang: 'id', name: 'Makanan Berat' },
      { category_id: 1, lang: 'ja', name: 'メインディッシュ' },
      { category_id: 1, lang: 'zh', name: '主食' },
      { category_id: 1, lang: 'ko', name: '식사류' },
      { category_id: 1, lang: 'es', name: 'Platos Fuertes' },

      { category_id: 2, lang: 'id', name: 'Makanan Sayur' },
      { category_id: 2, lang: 'ja', name: '野菜料理' },
      { category_id: 2, lang: 'zh', name: '蔬菜类' },
      { category_id: 2, lang: 'ko', name: '야채 요리' },
      { category_id: 2, lang: 'es', name: 'Platos de Verduras' },

      { category_id: 3, lang: 'id', name: 'Manisan' },
      { category_id: 3, lang: 'ja', name: 'デザート' },
      { category_id: 3, lang: 'zh', name: '甜点' },
      { category_id: 3, lang: 'ko', name: '디저트' },
      { category_id: 3, lang: 'es', name: 'Postres' },

      { category_id: 4, lang: 'id', name: 'Ala Carte' },
      { category_id: 4, lang: 'ja', name: 'アラカルト' },
      { category_id: 4, lang: 'zh', name: '单点' },
      { category_id: 4, lang: 'ko', name: '일품 요리' },
      { category_id: 4, lang: 'es', name: 'A la Carta' },

      { category_id: 5, lang: 'id', name: 'Rekomendasi' },
      { category_id: 5, lang: 'ja', name: 'おすすめ' },
      { category_id: 5, lang: 'zh', name: '推荐' },
      { category_id: 5, lang: 'ko', name: '추천 메뉴' },
      { category_id: 5, lang: 'es', name: 'Recomendados' }
    ];
    
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
    const info = [
      { key: 'about', lang: 'id', content: 'Bali Bong adalah restoran dengan menu masakan Indonesia (khususnya Bali) yang menyajikan masakan tradisional yang lezat dan otentik.' },
      { key: 'about', lang: 'ja', content: 'バリボン（Bali Bong）は、美味しくて本格的なインドネシア料理（特にバリ料理）を提供するレストランです。' },
      { key: 'about', lang: 'zh', content: 'Bali Bong 是一家提供美味正宗印尼料理（尤其是巴厘岛料理）的餐厅。' },
      { key: 'about', lang: 'ko', content: 'Bali Bong은 맛있고 정통 인도네시아 요리(특히 발리 요리)를 제공하는 레스토랑입니다.' },
      { key: 'about', lang: 'es', content: 'Bali Bong es un restaurante que ofrece deliciosa y auténtica comida indonesia, especialmente cocina de Bali.' },
      
      { key: 'transportation', lang: 'id', content: 'Berlokasi di pusat kota Bali Bong. Dapat diakses dengan taksi (15 menit dari bandara) atau bus rute 10.' },
      { key: 'transportation', lang: 'ja', content: 'バリボン中心部に位置しています。タクシー（空港から15分）または路線バス10番でアクセス可能です。' },
      { key: 'transportation', lang: 'zh', content: '位于巴厘岛市中心。可搭乘出租车（距离机场15分钟路程）或10路公交车前往。' },
      { key: 'transportation', lang: 'ko', content: '발리 시내 중심부에 위치하고 있습니다. 택시(공항에서 15분 거리)나 10번 버스를 이용해 오실 수 있습니다.' },
      { key: 'transportation', lang: 'es', content: 'Ubicado en el centro de Bali Bong. Accesible en taxi (a 15 minutos del aeropuerto) o autobús línea 10.' },
      
      { key: 'contact', lang: 'id', content: 'Telepon: +62 361 123456 | Email: info@balibong.com | Alamat: Jl. Raya Bali Bong No. 88, Kuta, Bali' },
      { key: 'contact', lang: 'ja', content: '電話：+62 361 123456 | メール：info@balibong.com | 住所：Jl. Raya Bali Bong No. 88, Kuta, Bali' },
      { key: 'contact', lang: 'zh', content: '电话：+62 361 123456 | 电子邮件：info@balibong.com | 地址：Jl. Raya Bali Bong No. 88, Kuta, Bali' },
      { key: 'contact', lang: 'ko', content: '전화번호: +62 361 123456 | 이메일: info@balibong.com | 주소: Jl. Raya Bali Bong No. 88, Kuta, Bali' },
      { key: 'contact', lang: 'es', content: 'Teléfono: +62 361 123456 | Correo electrónico: info@balibong.com | Dirección: Jl. Raya Bali Bong No. 88, Kuta, Bali' },
      
      { key: 'hours', lang: 'id', content: 'Setiap Hari: 11:00 - 23:00 (Pemesanan Terakhir 22:30)' },
      { key: 'hours', lang: 'ja', content: '毎日：11:00 - 23:00（ラストオーダー 22:30）' },
      { key: 'hours', lang: 'zh', content: '每天：11:00 - 23:00（截止点餐 22:30）' },
      { key: 'hours', lang: 'ko', content: '매일: 11:00 - 23:00 (라스트 오더 22:30)' },
      { key: 'hours', lang: 'es', content: 'Todos los días: 11:00 - 23:00 (Último pedido 22:30)' }
    ];
    
    for (const item of info) {
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
    const menuRaw = [
      // Makanan Berat
      { cat: 1, name: 'Bali Spicy Chicken', price: 1280, translations: { ja: 'バリ風スパイシーチキン', zh: '巴厘岛香辣鸡', ko: '발리 스타일 매운 치킨', es: 'Pollo Picante de Bali' } },
      { cat: 1, name: 'Ayam dan Tempe Goreng', price: 1180, translations: { ja: '鶏肉とテンペの唐揚げ', zh: '炸鸡与印尼豆豉', ko: '치킨과 템페 튀김', es: 'Pollo y Tempeh Frito' } },
      { cat: 1, name: 'Mie Ayam', price: 1180, translations: { ja: 'チキンラーメン', zh: '鸡肉面', ko: '미 아얌 (인도네시아식 닭고기 국수)', es: 'Fideos de Pollo (Mie Ayam)' } },
      { cat: 1, name: 'Ayam Geprek', price: 1280, translations: { ja: 'アヤムゲプレック (スパイシー唐揚げ)', zh: '印尼碎辣炸鸡', ko: '아얌 게프렉 (매운 치킨)', es: 'Pollo Smashed Picante' } },
      { cat: 1, name: 'Bali Bong Hamburg', price: 990, translations: { ja: 'バリボン・ハンバーグ', zh: '巴厘岛汉堡肉排', ko: '발리 봉 함박스테이크', es: 'Hamburguesa Bali Bong' } },
      { cat: 1, name: 'Pho Goreng (Standard)', price: 1080, translations: { ja: '焼きフォー (並)', zh: '炒河粉 (标准)', ko: '볶음 쌀국수 (보통)', es: 'Fideos Pho Fritos (Estándar)' } },
      { cat: 1, name: 'Bali Bong Original Coconut Mapo Toufu', price: 990, translations: { ja: 'バリボン特製ココナッツ麻婆豆腐', zh: '巴厘岛椰香麻婆豆腐', ko: '발리 봉 오리지널 코코넛 마파두부', es: 'Mapo Tofu de Coco Original' } },
      { cat: 1, name: 'Bubur Ayam', price: 1180, translations: { ja: 'インドネシア風鶏粥', zh: '鸡肉粥', ko: '인도네시아식 닭죽', es: 'Gacha de Pollo (Bubur Ayam)' } },
      { cat: 1, name: 'Cumi-Cumi Goreng', price: 990, translations: { ja: 'イカの唐揚げ', zh: '炸鱿鱼', ko: '오징어 튀김', es: 'Calamar Frito' } },
      { cat: 1, name: 'Gulai Kambing', price: 1300, translations: { ja: 'ヤギ肉のカレー煮込み', zh: '咖喱羊肉', ko: '염소고기 굴라이 (카레)', es: 'Gulai de Cabra' } },
      { cat: 1, name: 'Tumis Leher Ayam', price: 990, translations: { ja: '鶏ネック of 炒め物', zh: '炒鸡颈肉', ko: '닭목살 볶음', es: 'Cuello de Pollo Salteado' } },
      { cat: 1, name: 'Sayap Ayam Pedas', price: 990, translations: { ja: 'スパイシーチキンウィング', zh: '辣鸡翅', ko: '매콤 닭날개 구이', es: 'Alitas de Pollo Picantes' } },
      { cat: 1, name: 'Ayam Bumbu Bali', price: 1080, translations: { ja: 'バリ風スパイス鶏肉煮込み', zh: '巴厘岛香料鸡肉', ko: '발리식 양념 치킨', es: 'Pollo en Salsa Bali' } },
      { cat: 1, name: 'Maboroshi no Java Curry', price: 1080, translations: { ja: '幻のジャワカレー', zh: '幻之爪哇咖喱', ko: '환상의 자바 카레', es: 'Curry de Java de Ensueño' } },
      { cat: 1, name: 'Nasi Goreng', price: 1180, translations: { ja: 'ナシゴレン', zh: '印尼炒饭', ko: '나시고랭', es: 'Arroz Frito (Nasi Goreng)' } },
      { cat: 1, name: 'Mie Goreng', price: 1180, translations: { ja: 'ミーゴレン', zh: '印尼炒面', ko: '미고랭', es: 'Fideos Fritos (Mie Goreng)' } },
      { cat: 1, name: 'Bihun Goreng', price: 1180, translations: { ja: 'ビーフンゴレン', zh: '炒米粉', ko: '비훈고랭', es: 'Bihun Frito' } },
      { cat: 1, name: 'Ayam Goreng Bali Bong', price: 990, translations: { ja: 'バリボンフライドチキン', zh: '巴厘岛炸鸡', ko: '발리 봉 프라이드 치킨', es: 'Pollo Frito Bali Bong' } },
      { cat: 1, name: 'Ayam Bakar', price: 1180, translations: { ja: '鶏肉の炭火焼き', zh: '烤鸡', ko: '아얌 바카르', es: 'Pollo a la Parrilla' } },
      { cat: 1, name: 'Opor Ayam', price: 990, translations: { ja: '鶏肉のココナッツミルク煮', zh: '椰汁鸡', ko: '오포르 아얌', es: 'Pollo en Leche de Coco (Opor Ayam)' } },
      { cat: 1, name: 'Telor Balado', price: 990, translations: { ja: 'ゆde卵のチリソース和え', zh: '辣酱鸡蛋', ko: '계란 발라도', es: 'Huevo Balado' } },
      { cat: 1, name: 'Tempe Manis', price: 750, translations: { ja: '甘辛テンペ炒め', zh: '甜味印尼豆豉', ko: '달콤한 템페 볶음', es: 'Tempeh Dulce' } },
      { cat: 1, name: 'Tempe Laksa', price: 750, translations: { ja: 'テンペラクサ', zh: '印尼豆豉叻沙', ko: '템페 락사', es: 'Tempeh Laksa' } },
      { cat: 1, name: 'Udang Cah Terong', price: 680, translations: { ja: 'エビとナスの炒め物', zh: '茄子炒虾', ko: '새우 가지 볶음', es: 'Camarones Salteados con Berenjena' } },
      { cat: 1, name: 'Tempe Goreng', price: 680, translations: { ja: 'テンペの唐揚げ', zh: '炸印尼豆豉', ko: '템페 튀김', es: 'Tempeh Frito' } },
      { cat: 1, name: 'Perkedel Kentang', price: 680, translations: { ja: 'インドネシア風ポテトコロッケ', zh: '马铃薯饼', ko: '인도네시아식 감자전', es: 'Croqueta de Patata' } },
      { cat: 1, name: 'Lumpia Goreng', price: 620, translations: { ja: '揚げ春巻き', zh: '炸春卷', ko: '튀긴 춘권', es: 'Rollito de Primavera Frito' } },
      { cat: 1, name: 'Perkedel Jagung', price: 690, translations: { ja: 'コーンかき揚げ', zh: '玉米饼', ko: '옥수수전', es: 'Buñuelo de Maíz' } },
      { cat: 1, name: 'Telor Dadar', price: 690, translations: { ja: 'インドネシア風オムレツ', zh: '煎蛋卷', ko: '인도네시아식 계란말이', es: 'Tortilla de Huevo' } },
      { cat: 1, name: 'Sate Ayam (4 tusuk)', price: 990, translations: { ja: '焼き鳥 (4本)', zh: '鸡肉沙爹 (4串)', ko: '닭꼬치 (4꼬치)', es: 'Sate de Pollo (4 brochetas)' } },
      { cat: 1, name: 'Sate Ayam (2 tusuk)', price: 500, translations: { ja: '焼き鳥 (2本)', zh: '鸡肉沙爹 (2串)', ko: '닭꼬치 (2꼬치)', es: 'Sate de Pollo (2 brochetas)' } },
      { cat: 1, name: 'Sate Kambing (4 tusuk)', price: 980, translations: { ja: 'ヤギ肉の串焼き (4本)', zh: '羊肉沙爹 (4串)', ko: '양꼬치 (4꼬치)', es: 'Sate de Cabra (4 brochetas)' } },
      { cat: 1, name: 'Sate Kambing (2 tusuk)', price: 500, translations: { ja: 'ヤギ肉の串焼き (2本)', zh: '羊肉沙爹 (2串)', ko: '양꼬치 (2꼬치)', es: 'Sate de Cabra (2 brochetas)' } },
      { cat: 1, name: 'Sate Lilit (4 tusuk)', price: 990, translations: { ja: 'サテ・リリット (4本)', zh: '巴厘岛鱼肉沙爹 (4串)', ko: '사떼 릴릿 (4꼬치)', es: 'Sate Lilit (4 brochetas)' } },
      { cat: 1, name: 'Sate Lilit (2 tusuk)', price: 500, translations: { ja: 'サテ・リリット (2本)', zh: '巴厘岛鱼肉沙爹 (2串)', ko: '사떼 릴릿 (2꼬치)', es: 'Sate Lilit (2 brochetas)' } },
      { cat: 1, name: 'Sate Campur (masing-masing jenis 2 tusuk, total 6 tusuk)', price: 1480, translations: { ja: 'サテ盛り合わせ (6本)', zh: '混合沙爹 (共6串)', ko: '모듬 사떼 (총 6꼬치)', es: 'Sate Mixto (total 6 brochetas)' } },
      { cat: 1, name: 'Soto Ayam', price: 1180, translations: { ja: 'ソトアヤム (鶏スープ)', zh: '鸡肉汤面', ko: '소토 아얌', es: 'Sopa de Pollo (Soto Ayam)' } },
      { cat: 1, name: 'Ayam dan Sayur Rice Noodle', price: 1180, translations: { ja: '鶏肉と野菜のライスヌードル', zh: '鸡肉蔬菜米粉', ko: '닭고기 야채 쌀국수', es: 'Fideos de Arroz con Pollo y Verduras' } },
      { cat: 1, name: 'Bakso', price: 1180, translations: { ja: 'バクソ (肉団子スープ)', zh: '肉丸汤', ko: '박소', es: 'Sopa de Albóndigas (Bakso)' } },
      { cat: 1, name: 'Mie Laksa', price: 1180, translations: { ja: 'ミーラクサ', zh: '叻沙面', ko: '미 락사', es: 'Fideos Laksa' } },
      { cat: 1, name: 'Gaprao', price: 1080, translations: { ja: 'ガパオライス', zh: '打抛猪肉饭', ko: '바질 돼지고기 덮밥', es: 'Arroz con Cerdo y Albahaca' } },
      { cat: 1, name: 'Bali Bong Chicken Soup Curry', price: 1200, translations: { ja: 'バリボン・スープカレー (鶏肉)', zh: '巴厘岛鸡肉汤咖喱', ko: '발리 봉 치킨 스프 카레', es: 'Sopa de Curry con Pollo Bali Bong' } },
      { cat: 1, name: 'Udon Coconut Curry', price: 1080, translations: { ja: 'ココナッツカレーうどん', zh: '椰香咖喱乌冬面', ko: '코코넛 카레 우동', es: 'Fideos Udon con Curry de Coco' } },
      { cat: 1, name: 'Pho Goreng (Spesial)', price: 1180, translations: { ja: '焼きフォー (大/スペシャル)', zh: '炒河粉 (大份)', ko: '볶음 쌀국수 (스페셜)', es: 'Fideos Pho Fritos (Especial)' } },
      { cat: 1, name: 'Ayam dan Sayur Pho', price: 1180, translations: { ja: '鶏肉と野菜のフォー', zh: '鸡肉蔬菜河粉', ko: '닭고기 야채 쌀국수 (포)', es: 'Pho de Pollo y Verduras' } },
      { cat: 1, name: 'Coconut Curry Pho', price: 1180, translations: { ja: 'ココナッツカレーフォー', zh: '椰香咖喱河粉', ko: '코코넛 카레 포', es: 'Pho de Curry de Coco' } },
      { cat: 1, name: 'Tom Yum Pho', price: 1180, translations: { ja: 'トムヤムフォー', zh: '冬阴功河粉', ko: '똠얌 쌀국수 (포)', es: 'Pho Tom Yum' } },

      // Makanan Sayur
      { cat: 2, name: 'Gado-Gado', price: 880, translations: { ja: 'ガドガド (ピーナッツソース和え)', zh: '印尼加多加多沙拉', ko: '가도가도', es: 'Gado-Gado' } },
      { cat: 2, name: 'Bali Bong Original Salad', price: 880, translations: { ja: 'バリボン・オリジナルサラダ', zh: '巴厘岛原创沙拉', ko: '발리 봉 오리지널 샐러드', es: 'Ensalada Original Bali Bong' } },
      { cat: 2, name: 'Lumpia Sayur', price: 880, translations: { ja: '野菜春巻き', zh: '蔬菜春卷', ko: '야채 춘권', es: 'Rollito de Primavera de Verduras' } },
      { cat: 2, name: 'Tumis Kangkung', price: 980, translations: { ja: '空心菜の炒め物', zh: '炒空心菜', ko: '모닝글로리 볶음', es: 'Salteado de Kangkung' } },
      { cat: 2, name: 'Capcay Sayur', price: 880, translations: { ja: '野菜チャプチャイ', zh: '什锦蔬菜', ko: '찹차이', es: 'Salteado de Verduras (Capcay)' } },
      { cat: 2, name: 'Pare Goreng', price: 880, translations: { ja: 'ゴーヤのチャンプルー風炒め', zh: '炒苦瓜', ko: '여주 볶음', es: 'Calabaza Amarga Frita' } },

      // Manisan
      { cat: 3, name: 'Pisang Goreng (dengan es krim)', price: 550, translations: { ja: '揚げバナナ (アイス添え)', zh: '炸香蕉 (配冰淇淋)', ko: '바나나 튀김 (아이스크림)', es: 'Plátano Frito (con helado)' } },
      { cat: 3, name: 'Coconut Tapioka', price: 550, translations: { ja: 'ココナッツタピオカ', zh: '椰香西米露', ko: '코코넛 타피오카', es: 'Tapioca de Coco' } },
      { cat: 3, name: 'Ice Cream', price: 300, translations: { ja: 'アイスクリーム', zh: '冰淇淋', ko: '아이스크림', es: 'Helado' } },
      { cat: 3, name: 'Waffle Ice Cream', price: 550, translations: { ja: 'ワッフルアイスクリーム', zh: 'ワッフルアイスクリーム', ko: '와플 아이스크림', es: 'Gofre con Helado' } },

      // Ala Carte
      { cat: 4, name: 'Udang Goreng Pedas', price: 680, translations: { ja: 'エビのスパイシー唐揚げ', zh: '辣炸虾', ko: '매콤 새우 튀김', es: 'Camarones Fritos Picantes' } },
      { cat: 4, name: 'Kentang Sambal Keju', price: 490, translations: { ja: 'ポテトのサンバルチーズがけ', zh: '印尼辣酱起司薯条', ko: '감자튀김 삼발 치즈', es: 'Patatas con Sambal y Queso' } },
      { cat: 4, name: 'Mini Ayam Geprek', price: 690, translations: { ja: 'ミニ・アヤムゲプレック', zh: '迷你印尼碎辣炸鸡', ko: '미니 아얌 게프렉', es: 'Mini Pollo Smashed Picante' } },
      { cat: 4, name: 'Kentang Balado', price: 450, translations: { ja: 'フライドポテト・バラドソース和え', zh: '辣酱薯条', ko: '감자튀김 발라도', es: 'Patatas Fritas en Salsa Balado' } },
      { cat: 4, name: 'Ikan Asam Manis', price: 580, translations: { ja: '魚の甘酢あんかけ', zh: '糖醋鱼', ko: '생선 탕수육', es: 'Pescado Agridulce' } },
      { cat: 4, name: 'Udang Laksa', price: 680, translations: { ja: 'エビのラクサ', zh: '虾肉叻沙', ko: '새우 락사', es: 'Camarones Laksa' } },
      { cat: 4, name: 'Kerupuk Udang', price: 300, translations: { ja: 'エビせんべい', zh: '虾片', ko: '새우칩', es: 'Galletas de Camarón' } },
      { cat: 4, name: 'Acar', price: 300, translations: { ja: 'インドネシア風ピクルス', zh: '印尼泡菜', ko: '아차르', es: 'Encurtidos' } },
      { cat: 4, name: 'Emping Melinjo', price: 300, translations: { ja: 'グネモンの実のチップス', zh: '珍果脆片', ko: '엠핑 멜린조', es: 'Chips de Emping' } },

      // Rekomendasi
      { cat: 5, name: 'Nasi Campur', price: 1600, translations: { ja: 'ナシチャンプル', zh: '印尼什锦饭', ko: '나시 짬푸르', es: 'Nasi Campur (Arroz Mixto)' }, isRec: true },
      { cat: 5, name: 'Bali Bong Omurice', price: 1380, translations: { ja: 'バリボン・オムライス', zh: '巴厘岛原创蛋包饭', ko: '발리 봉 오므라이스', es: 'Omurice Bali Bong' }, isRec: true },
      { cat: 5, name: 'Rendang', price: 1500, translations: { ja: 'ルンダン (牛肉スパイシー煮込み)', zh: '巴东烩牛肉', ko: '렌당', es: 'Rendang de Ternera' }, isRec: true }
    ];

    // Seed Menu Items and Translations
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
        const langs = ['ja', 'zh', 'ko', 'es'];
        for (const lang of langs) {
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
