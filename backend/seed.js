const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('@neondatabase/serverless');
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
      { id: 1, slug: 'ayam' },
      { id: 2, slug: 'sayuran_tahu_tempe' },
      { id: 3, slug: 'manisan' },
      { id: 4, slug: 'camilan' },
      { id: 5, slug: 'kambing_sapi' },
      { id: 6, slug: 'minuman' },
      { id: 7, slug: 'seafood' },
      { id: 8, slug: 'sate' },
      { id: 9, slug: 'nasi_mie_sup' }
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
      { category_id: 1, lang: 'id', name: 'Ayam' },
      { category_id: 1, lang: 'en', name: 'Chicken' },
      { category_id: 1, lang: 'ja', name: '鶏肉料理' },
      { category_id: 1, lang: 'zh', name: '鸡肉料理' },
      { category_id: 1, lang: 'ko', name: '닭요리' },
      { category_id: 1, lang: 'es', name: 'Pollo' },

      { category_id: 2, lang: 'id', name: 'Sayuran & Tahu-Tempe' },
      { category_id: 2, lang: 'en', name: 'Vegetables & Tofu-Tempeh' },
      { category_id: 2, lang: 'ja', name: '野菜・豆腐・テンペ' },
      { category_id: 2, lang: 'zh', name: '蔬菜与豆腐豆豉' },
      { category_id: 2, lang: 'ko', name: '채소 & 두부-템페' },
      { category_id: 2, lang: 'es', name: 'Verduras y Tofu-Tempeh' },

      { category_id: 3, lang: 'id', name: 'Manisan' },
      { category_id: 3, lang: 'en', name: 'Desserts' },
      { category_id: 3, lang: 'ja', name: 'デザート' },
      { category_id: 3, lang: 'zh', name: '甜点' },
      { category_id: 3, lang: 'ko', name: '디저트' },
      { category_id: 3, lang: 'es', name: 'Postres' },

      { category_id: 4, lang: 'id', name: 'Camilan' },
      { category_id: 4, lang: 'en', name: 'Snacks & Sides' },
      { category_id: 4, lang: 'ja', name: 'おつまみ・軽食' },
      { category_id: 4, lang: 'zh', name: '小吃配菜' },
      { category_id: 4, lang: 'ko', name: '스낵 & 사이드' },
      { category_id: 4, lang: 'es', name: 'Aperitivos y Acompañamientos' },

      { category_id: 5, lang: 'id', name: 'Kambing & Sapi' },
      { category_id: 5, lang: 'en', name: 'Goat & Beef' },
      { category_id: 5, lang: 'ja', name: 'ヤギ肉・牛肉' },
      { category_id: 5, lang: 'zh', name: '羊肉与牛肉' },
      { category_id: 5, lang: 'ko', name: '염소고기 & 소고기' },
      { category_id: 5, lang: 'es', name: 'Cabra y Res' },

      { category_id: 6, lang: 'id', name: 'Minuman' },
      { category_id: 6, lang: 'en', name: 'Drinks' },
      { category_id: 6, lang: 'ja', name: 'ドリンク' },
      { category_id: 6, lang: 'zh', name: '饮品' },
      { category_id: 6, lang: 'ko', name: '음료' },
      { category_id: 6, lang: 'es', name: 'Bebidas' },

      { category_id: 7, lang: 'id', name: 'Seafood' },
      { category_id: 7, lang: 'en', name: 'Seafood' },
      { category_id: 7, lang: 'ja', name: 'シーフード' },
      { category_id: 7, lang: 'zh', name: '海鲜' },
      { category_id: 7, lang: 'ko', name: '해산물' },
      { category_id: 7, lang: 'es', name: 'Mariscos' },

      { category_id: 8, lang: 'id', name: 'Sate' },
      { category_id: 8, lang: 'en', name: 'Satay' },
      { category_id: 8, lang: 'ja', name: 'サテ（串焼き）' },
      { category_id: 8, lang: 'zh', name: '沙爹串' },
      { category_id: 8, lang: 'ko', name: '사떼(꼬치)' },
      { category_id: 8, lang: 'es', name: 'Sate (Brochetas)' },

      { category_id: 9, lang: 'id', name: 'Nasi, Mie & Sup' },
      { category_id: 9, lang: 'en', name: 'Rice, Noodles & Soup' },
      { category_id: 9, lang: 'ja', name: 'ご飯・麺・スープ' },
      { category_id: 9, lang: 'zh', name: '饭面汤类' },
      { category_id: 9, lang: 'ko', name: '밥·면·수프' },
      { category_id: 9, lang: 'es', name: 'Arroz, Fideos y Sopas' }
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
      { key: 'about', lang: 'id', content: 'Bali Bong adalah rumah kedua untuk siapa saja yang mampir — disambut hangat oleh Bli (panggilan akrab untuk "Bang" dalam bahasa Bali) Nyoman, chef yang menghidangkan cita rasa Bali dengan caranya sendiri. Di sini, obrolan mengalir lintas bahasa: tamu Jepang dan teman-teman dari berbagai negara duduk berdampingan, saling bertukar kata sambil menikmati hidangan yang sama sekali tidak main-main. Satu hal yang selalu jadi pegangan kami: Yang Penting Happy.' },
      { key: 'about', lang: 'ja', content: 'バリボンは、ふらっと立ち寄れる第二の我が家のような場所。温かく迎えてくれるのは、バリ語で「兄」を意味する「ブリ」ニョマン——バリの味を自分のスタイルで届けるシェフです。ここでは言葉の壁を越えて会話が弾み、日本人のお客様と世界各国からの友人たちが隣り合わせで、言葉を交わしながら侮れない料理を楽しみます。私たちが大切にしているのはただひとつ、「Yang Penting Happy（大事なのはハッピーであること）」。' },
      { key: 'about', lang: 'zh', content: 'Bali Bong 是任何人都能随意走进的第二个家——热情迎接你的是被称为"布里"（巴厘语中"哥哥"之意）的主厨尼曼，他以自己的方式呈现巴厘风味。在这里，对话跨越语言的界限自由流淌：日本客人与来自世界各地的朋友们并肩而坐，一边交流词汇，一边享用绝对不容小觑的美食。我们始终坚持一个简单的理念：Yang Penting Happy（重要的是开心）。' },
      { key: 'about', lang: 'ko', content: '발리 봉은 누구나 편하게 들를 수 있는 두 번째 집 같은 곳입니다. 발리어로 \'형\'을 뜻하는 \'블리\' 뇨만이 따뜻하게 맞아주며, 그만의 방식으로 발리의 맛을 선보입니다. 이곳에서는 언어의 장벽을 넘어 대화가 오가고, 일본인 손님과 세계 각국에서 온 친구들이 나란히 앉아 말을 주고받으며 결코 만만치 않은 요리를 즐깁니다. 우리가 지키는 단 하나의 철학은, \'중요한 건 행복한 것(Yang Penting Happy)\'입니다.' },
      { key: 'about', lang: 'es', content: 'Bali Bong es como un segundo hogar al que cualquiera puede entrar sin más. Quien te recibe con calidez es Bli (que en balinés significa "hermano") Nyoman, el chef que sirve los sabores de Bali a su propia manera. Aquí las conversaciones cruzan idiomas sin problema: clientes japoneses y amigos de todo el mundo se sientan codo con codo, intercambiando palabras mientras disfrutan de una comida que no tiene nada que envidiar. Solo tenemos una filosofía: Yang Penting Happy (lo importante es ser feliz).' },
      { key: 'about', lang: 'en', content: 'Bali Bong is a second home for anyone who walks in — welcomed warmly by Bli (an affectionate Balinese word for "brother") Nyoman, the chef who serves Balinese flavors his own way. Here, conversation flows across languages: Japanese guests and friends from all over the world sit side by side, trading words while enjoying food that is anything but ordinary. One thing we always hold onto: Yang Penting Happy (the important thing is to be happy).' },

      { key: 'transportation', lang: 'id', content: '4 menit berjalan kaki dari Stasiun Abiko di Midosuji Line. (388 meter dari Abiko)' },
      { key: 'transportation', lang: 'ja', content: '御堂筋線あびこ駅から徒歩4分（あびこ駅から388m）' },
      { key: 'transportation', lang: 'zh', content: '从御堂筋线我孙子站（Abiko Sta.）步行 4 分钟。（距离我孙子站 388 米）' },
      { key: 'transportation', lang: 'ko', content: '미도스지선 아비코역(Abiko Sta.)에서 도보 4분 거리. (아비코역에서 388m)' },
      { key: 'transportation', lang: 'es', content: 'A 4 minutos a pie de la estación de Abiko en la línea Midosuji. (A 388 metros de Abiko)' },
      { key: 'transportation', lang: 'en', content: '4 minutes on foot from Abiko Station on the Midosuji Line. (388 meters from Abiko)' },

      { key: 'contact', lang: 'id', content: 'Telepon: 06-6695-6267 | Alamat: 大阪府大阪市住吉区苅田3-16-11' },
      { key: 'contact', lang: 'ja', content: '電話番号: 06-6695-6267 | 住所: 大阪府大阪市住吉区苅田3-16-11' },
      { key: 'contact', lang: 'zh', content: '电话：06-6695-6267 | 地址：大阪府大阪市住吉区苅田3-16-11' },
      { key: 'contact', lang: 'ko', content: '전화번호: 06-6695-6267 | 주소: 大阪府大阪市住吉区苅田3-16-11' },
      { key: 'contact', lang: 'es', content: 'Teléfono: 06-6695-6267 | Dirección: 大阪府大阪市住吉区苅田3-16-11' },
      { key: 'contact', lang: 'en', content: 'Phone: 06-6695-6267 | Address: 大阪府大阪市住吉区苅田3-16-11' },

      { key: 'hours', lang: 'id', content: 'Senin, Selasa, Kamis-Minggu: 11:30 - 14:30 & 17:30 - 00:00. Tutup: Rabu.' },
      { key: 'hours', lang: 'ja', content: '月・火・木〜日: 11:30 - 14:30, 17:30 - 00:00. 定休日: 水曜日' },
      { key: 'hours', lang: 'zh', content: '周一、周二、周四至周日：11:30 - 14:30 & 17:30 - 00:00。 休息日：周三' },
      { key: 'hours', lang: 'ko', content: '월, 화, 목~일: 11:30 - 14:30 & 17:30 - 00:00. 휴무일: 수요일' },
      { key: 'hours', lang: 'es', content: 'Lunes, Martes, Jueves-Domingo: 11:30 - 14:30 y 17:30 - 00:00. Cerrado: Miércoles.' },
      { key: 'hours', lang: 'en', content: 'Monday, Tuesday, Thursday-Sunday: 11:30 - 14:30 & 17:30 - 00:00. Closed: Wednesday.' }
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
      { cat: 1, name: 'Bali Spicy Chicken', price: 1280, translations: { en: 'Bali Spicy Chicken', ja: 'バリ風スパイシーチキン', zh: '巴厘岛香辣鸡', ko: '발리 스타일 매운 치킨', es: 'Pollo Picante de Bali' } },
      { cat: 1, name: 'Ayam dan Tempe Goreng', price: 1180, translations: { en: 'Fried Chicken and Tempeh', ja: '鶏肉とテンペの唐揚げ', zh: '炸鸡与印尼豆豉', ko: '치킨과 템페 튀김', es: 'Pollo y Tempeh Frito' } },
      { cat: 1, name: 'Mie Ayam', price: 1180, translations: { en: 'Chicken Noodles (Mie Ayam)', ja: 'チキンラーメン', zh: '鸡肉面', ko: '미 아얌 (인도네시아식 닭고기 국수)', es: 'Fideos de Pollo (Mie Ayam)' } },
      { cat: 1, name: 'Ayam Geprek', price: 1280, translations: { en: 'Ayam Geprek (Smashed Spicy Fried Chicken)', ja: 'アヤムゲプレック (スパイシー唐揚げ)', zh: '印尼碎辣炸鸡', ko: '아얌 게프렉 (매운 치킨)', es: 'Pollo Smashed Picante' } },
      { cat: 9, name: 'Bali Bong Hamburg', price: 990, translations: { en: 'Bali Bong Hamburg Steak', ja: 'バリボン・ハンバーグ', zh: '巴厘岛汉堡肉排', ko: '발리 봉 함박스테이크', es: 'Hamburguesa Bali Bong' } },
      { cat: 9, name: 'Pho Goreng (Standard)', price: 1080, translations: { en: 'Fried Pho Noodles (Standard)', ja: '焼きフォー (並)', zh: '炒河粉 (标准)', ko: '볶음 쌀국수 (보통)', es: 'Fideos Pho Fritos (Estándar)' } },
      { cat: 2, name: 'Bali Bong Original Coconut Mapo Toufu', price: 990, translations: { en: 'Bali Bong Original Coconut Mapo Tofu', ja: 'バリボン特製ココナッツ麻婆豆腐', zh: '巴厘岛椰香麻婆豆腐', ko: '발리 봉 오리지널 코코넛 마파두부', es: 'Mapo Tofu de Coco Original' } },
      { cat: 1, name: 'Bubur Ayam', price: 1180, translations: { en: 'Chicken Rice Porridge (Bubur Ayam)', ja: 'インドネシア風鶏粥', zh: '鸡肉粥', ko: '인도네시아식 닭죽', es: 'Gacha de Pollo (Bubur Ayam)' } },
      { cat: 7, name: 'Cumi-Cumi Goreng', price: 990, translations: { en: 'Fried Squid', ja: 'イカの唐揚げ', zh: '炸鱿鱼', ko: '오징어 튀김', es: 'Calamar Frito' } },
      { cat: 5, name: 'Gulai Kambing', price: 1300, translations: { en: 'Goat Curry (Gulai Kambing)', ja: 'ヤギ肉のカレー煮込み', zh: '咖喱羊肉', ko: '염소고기 굴라이 (카레)', es: 'Gulai de Cabra' } },
      { cat: 1, name: 'Tumis Leher Ayam', price: 990, translations: { en: 'Stir-Fried Chicken Neck', ja: '鶏ネック of 炒め物', zh: '炒鸡颈肉', ko: '닭목살 볶음', es: 'Cuello de Pollo Salteado' } },
      { cat: 1, name: 'Sayap Ayam Pedas', price: 990, translations: { en: 'Spicy Chicken Wings', ja: 'スパイシーチキンウィング', zh: '辣鸡翅', ko: '매콤 닭날개 구이', es: 'Alitas de Pollo Picantes' } },
      { cat: 1, name: 'Ayam Bumbu Bali', price: 1080, translations: { en: 'Chicken in Balinese Spice Sauce', ja: 'バリ風スパイス鶏肉煮込み', zh: '巴厘岛香料鸡肉', ko: '발리식 양념 치킨', es: 'Pollo en Salsa Bali' } },
      { cat: 9, name: 'Maboroshi no Java Curry', price: 1080, translations: { en: 'Legendary Java Curry (Maboroshi)', ja: '幻のジャワカレー', zh: '幻之爪哇咖喱', ko: '환상의 자바 카레', es: 'Curry de Java de Ensueño' } },
      { cat: 9, name: 'Nasi Goreng', price: 1180, translations: { en: 'Fried Rice (Nasi Goreng)', ja: 'ナシゴレン', zh: '印尼炒饭', ko: '나시고랭', es: 'Arroz Frito (Nasi Goreng)' } },
      { cat: 9, name: 'Mie Goreng', price: 1180, translations: { en: 'Fried Noodles (Mie Goreng)', ja: 'ミーゴレン', zh: '印尼炒面', ko: '미고랭', es: 'Fideos Fritos (Mie Goreng)' } },
      { cat: 9, name: 'Bihun Goreng', price: 1180, translations: { en: 'Fried Rice Vermicelli (Bihun Goreng)', ja: 'ビーフンゴレン', zh: '炒米粉', ko: '비훈고랭', es: 'Bihun Frito' } },
      { cat: 1, name: 'Ayam Goreng Bali Bong', price: 990, translations: { en: 'Bali Bong Fried Chicken', ja: 'バリボンフライドチキン', zh: '巴厘岛炸鸡', ko: '발리 봉 프라이드 치킨', es: 'Pollo Frito Bali Bong' } },
      { cat: 1, name: 'Ayam Bakar', price: 1180, translations: { en: 'Grilled Chicken (Ayam Bakar)', ja: '鶏肉の炭火焼き', zh: '烤鸡', ko: '아얌 바카르', es: 'Pollo a la Parrilla' } },
      { cat: 1, name: 'Opor Ayam', price: 990, translations: { en: 'Chicken in Coconut Milk (Opor Ayam)', ja: '鶏肉のココナッツミルク煮', zh: '椰汁鸡', ko: '오포르 아얌', es: 'Pollo en Leche de Coco (Opor Ayam)' } },
      { cat: 9, name: 'Telor Balado', price: 990, translations: { en: 'Eggs in Chili Sauce (Telor Balado)', ja: 'ゆde卵のチリソース和え', zh: '辣酱鸡蛋', ko: '계란 발라도', es: 'Huevo Balado' } },
      { cat: 2, name: 'Tempe Manis', price: 750, translations: { en: 'Sweet Fried Tempeh', ja: '甘辛テンペ炒め', zh: '甜味印尼豆豉', ko: '달콤한 템페 볶음', es: 'Tempeh Dulce' } },
      { cat: 2, name: 'Tempe Laksa', price: 750, translations: { en: 'Tempeh Laksa', ja: 'テンペラクサ', zh: '印尼豆豉叻沙', ko: '템페 락사', es: 'Tempeh Laksa' } },
      { cat: 7, name: 'Udang Cah Terong', price: 680, translations: { en: 'Stir-Fried Shrimp with Eggplant', ja: 'エビとナスの炒め物', zh: '茄子炒虾', ko: '새우 가지 볶음', es: 'Camarones Salteados con Berenjena' } },
      { cat: 2, name: 'Tempe Goreng', price: 680, translations: { en: 'Fried Tempeh', ja: 'テンペの唐揚げ', zh: '炸印尼豆豉', ko: '템페 튀김', es: 'Tempeh Frito' } },
      { cat: 4, name: 'Perkedel Kentang', price: 680, translations: { en: 'Potato Croquette (Perkedel)', ja: 'インドネシア風ポテトコロッケ', zh: '马铃薯饼', ko: '인도네시아식 감자전', es: 'Croqueta de Patata' } },
      { cat: 4, name: 'Lumpia Goreng', price: 620, translations: { en: 'Fried Spring Rolls', ja: '揚げ春巻き', zh: '炸春卷', ko: '튀긴 춘권', es: 'Rollito de Primavera Frito' } },
      { cat: 4, name: 'Perkedel Jagung', price: 690, translations: { en: 'Corn Fritters (Perkedel Jagung)', ja: 'コーンかき揚げ', zh: '玉米饼', ko: '옥수수전', es: 'Buñuelo de Maíz' } },
      { cat: 9, name: 'Telor Dadar', price: 690, translations: { en: 'Indonesian Omelet', ja: 'インドネシア風オムレツ', zh: '煎蛋卷', ko: '인도네시아식 계란말이', es: 'Tortilla de Huevo' } },
      { cat: 8, name: 'Sate Ayam (4 tusuk)', price: 990, translations: { en: 'Chicken Satay (4 skewers)', ja: '焼き鳥 (4本)', zh: '鸡肉沙爹 (4串)', ko: '닭꼬치 (4꼬치)', es: 'Sate de Pollo (4 brochetas)' } },
      { cat: 8, name: 'Sate Ayam (2 tusuk)', price: 500, translations: { en: 'Chicken Satay (2 skewers)', ja: '焼き鳥 (2本)', zh: '鸡肉沙爹 (2串)', ko: '닭꼬치 (2꼬치)', es: 'Sate de Pollo (2 brochetas)' } },
      { cat: 8, name: 'Sate Kambing (4 tusuk)', price: 980, translations: { en: 'Goat Satay (4 skewers)', ja: 'ヤギ肉の串焼き (4本)', zh: '羊肉沙爹 (4串)', ko: '양꼬치 (4꼬치)', es: 'Sate de Cabra (4 brochetas)' } },
      { cat: 8, name: 'Sate Kambing (2 tusuk)', price: 500, translations: { en: 'Goat Satay (2 skewers)', ja: 'ヤギ肉の串焼き (2本)', zh: '羊肉沙爹 (2串)', ko: '양꼬치 (2꼬치)', es: 'Sate de Cabra (2 brochetas)' } },
      { cat: 8, name: 'Sate Lilit (4 tusuk)', price: 990, translations: { en: 'Sate Lilit (4 skewers)', ja: 'サテ・リリット (4本)', zh: '巴厘岛鱼肉沙爹 (4串)', ko: '사떼 릴릿 (4꼬치)', es: 'Sate Lilit (4 brochetas)' } },
      { cat: 8, name: 'Sate Lilit (2 tusuk)', price: 500, translations: { en: 'Sate Lilit (2 skewers)', ja: 'サテ・リリット (2本)', zh: '巴厘岛鱼肉沙爹 (2串)', ko: '사떼 릴릿 (2꼬치)', es: 'Sate Lilit (2 brochetas)' } },
      { cat: 8, name: 'Sate Campur (masing-masing jenis 2 tusuk, total 6 tusuk)', price: 1480, translations: { en: 'Mixed Satay (2 of each type, 6 skewers total)', ja: 'サテ盛り合わせ (6本)', zh: '混合沙爹 (共6串)', ko: '모듬 사떼 (총 6꼬치)', es: 'Sate Mixto (total 6 brochetas)' } },
      { cat: 1, name: 'Soto Ayam', price: 1180, translations: { en: 'Chicken Soup (Soto Ayam)', ja: 'ソトアヤム (鶏スープ)', zh: '鸡肉汤面', ko: '소토 아얌', es: 'Sopa de Pollo (Soto Ayam)' } },
      { cat: 1, name: 'Ayam dan Sayur Rice Noodle', price: 1180, translations: { en: 'Chicken and Vegetable Rice Noodles', ja: '鶏肉と野菜のライスヌードル', zh: '鸡肉蔬菜米粉', ko: '닭고기 야채 쌀국수', es: 'Fideos de Arroz con Pollo y Verduras' } },
      { cat: 9, name: 'Bakso', price: 1180, translations: { en: 'Meatball Soup (Bakso)', ja: 'バクソ (肉団子スープ)', zh: '肉丸汤', ko: '박소', es: 'Sopa de Albóndigas (Bakso)' } },
      { cat: 9, name: 'Mie Laksa', price: 1180, translations: { en: 'Laksa Noodles', ja: 'ミーラクサ', zh: '叻沙面', ko: '미 락사', es: 'Fideos Laksa' } },
      { cat: 9, name: 'Gaprao', price: 1080, translations: { en: 'Basil Pork Rice (Gaprao)', ja: 'ガパオライス', zh: '打抛猪肉饭', ko: '바질 돼지고기 덮밥', es: 'Arroz con Cerdo y Albahaca' } },
      { cat: 1, name: 'Bali Bong Chicken Soup Curry', price: 1200, translations: { en: 'Bali Bong Chicken Soup Curry', ja: 'バリボン・スープカレー (鶏肉)', zh: '巴厘岛鸡肉汤咖喱', ko: '발리 봉 치킨 스프 카레', es: 'Sopa de Curry con Pollo Bali Bong' } },
      { cat: 9, name: 'Udon Coconut Curry', price: 1080, translations: { en: 'Udon Coconut Curry', ja: 'ココナッツカレーうどん', zh: '椰香咖喱乌冬面', ko: '코코넛 카레 우동', es: 'Fideos Udon con Curry de Coco' } },
      { cat: 9, name: 'Pho Goreng (Spesial)', price: 1180, translations: { en: 'Fried Pho Noodles (Special)', ja: '焼きフォー (大/スペシャル)', zh: '炒河粉 (大份)', ko: '볶음 쌀국수 (스페셜)', es: 'Fideos Pho Fritos (Especial)' } },
      { cat: 1, name: 'Ayam dan Sayur Pho', price: 1180, translations: { en: 'Chicken and Vegetable Pho', ja: '鶏肉と野菜のフォー', zh: '鸡肉蔬菜河粉', ko: '닭고기 야채 쌀국수 (포)', es: 'Pho de Pollo y Verduras' } },
      { cat: 9, name: 'Coconut Curry Pho', price: 1180, translations: { en: 'Coconut Curry Pho', ja: 'ココナッツカレーフォー', zh: '椰香咖喱河粉', ko: '코코넛 카레 포', es: 'Pho de Curry de Coco' } },
      { cat: 9, name: 'Tom Yum Pho', price: 1180, translations: { en: 'Tom Yum Pho', ja: 'トムヤムフォー', zh: '冬阴功河粉', ko: '똠얌 쌀국수 (포)', es: 'Pho Tom Yum' } },

      // Makanan Sayur
      { cat: 2, name: 'Gado-Gado', price: 880, translations: { en: 'Gado-Gado (Vegetables in Peanut Sauce)', ja: 'ガドガド (ピーナッツソース和え)', zh: '印尼加多加多沙拉', ko: '가도가도', es: 'Gado-Gado' } },
      { cat: 2, name: 'Bali Bong Original Salad', price: 880, translations: { en: 'Bali Bong Original Salad', ja: 'バリボン・オリジナルサラダ', zh: '巴厘岛原创沙拉', ko: '발리 봉 오리지널 샐러드', es: 'Ensalada Original Bali Bong' } },
      { cat: 2, name: 'Lumpia Sayur', price: 880, translations: { en: 'Vegetable Spring Rolls', ja: '野菜春巻き', zh: '蔬菜春卷', ko: '야채 춘권', es: 'Rollito de Primavera de Verduras' } },
      { cat: 2, name: 'Tumis Kangkung', price: 980, translations: { en: 'Stir-Fried Water Spinach (Kangkung)', ja: '空心菜の炒め物', zh: '炒空心菜', ko: '모닝글로리 볶음', es: 'Salteado de Kangkung' } },
      { cat: 2, name: 'Capcay Sayur', price: 880, translations: { en: 'Mixed Vegetable Stir-Fry (Capcay)', ja: '野菜チャプチャイ', zh: '什锦蔬菜', ko: '찹차이', es: 'Salteado de Verduras (Capcay)' } },
      { cat: 2, name: 'Pare Goreng', price: 880, translations: { en: 'Fried Bitter Gourd', ja: 'ゴーヤのチャンプルー風炒め', zh: '炒苦瓜', ko: '여주 볶음', es: 'Calabaza Amarga Frita' } },

      // Manisan
      { cat: 3, name: 'Pisang Goreng (dengan es krim)', price: 550, translations: { en: 'Fried Banana (with ice cream)', ja: '揚げバナナ (アイス添え)', zh: '炸香蕉 (配冰淇淋)', ko: '바나나 튀김 (아이스크림)', es: 'Plátano Frito (con helado)' } },
      { cat: 3, name: 'Coconut Tapioka', price: 550, translations: { en: 'Coconut Tapioca', ja: 'ココナッツタピオカ', zh: '椰香西米露', ko: '코코넛 타피오카', es: 'Tapioca de Coco' } },
      { cat: 3, name: 'Ice Cream', price: 300, translations: { en: 'Ice Cream', ja: 'アイスクリーム', zh: '冰淇淋', ko: '아이스크림', es: 'Helado' } },
      { cat: 3, name: 'Waffle Ice Cream', price: 550, translations: { en: 'Waffle with Ice Cream', ja: 'ワッフルアイスクリーム', zh: 'ワッフルアイスクリーム', ko: '와플 아이스크림', es: 'Gofre con Helado' } },

      // Ala Carte
      { cat: 7, name: 'Udang Goreng Pedas', price: 680, translations: { en: 'Spicy Fried Shrimp', ja: 'エビのスパイシー唐揚げ', zh: '辣炸虾', ko: '매콤 새우 튀김', es: 'Camarones Fritos Picantes' } },
      { cat: 4, name: 'Kentang Sambal Keju', price: 490, translations: { en: 'Fries with Sambal Cheese', ja: 'ポテトのサンバルチーズがけ', zh: '印尼辣酱起司薯条', ko: '감자튀김 삼발 치즈', es: 'Patatas con Sambal y Queso' } },
      { cat: 1, name: 'Mini Ayam Geprek', price: 690, translations: { en: 'Mini Ayam Geprek', ja: 'ミニ・アヤムゲプレック', zh: '迷你印尼碎辣炸鸡', ko: '미니 아얌 게프렉', es: 'Mini Pollo Smashed Picante' } },
      { cat: 4, name: 'Kentang Balado', price: 450, translations: { en: 'Fries in Balado Sauce', ja: 'フライドポテト・バラドソース和え', zh: '辣酱薯条', ko: '감자튀김 발라도', es: 'Patatas Fritas en Salsa Balado' } },
      { cat: 7, name: 'Ikan Asam Manis', price: 580, translations: { en: 'Sweet and Sour Fish', ja: '魚の甘酢あんかけ', zh: '糖醋鱼', ko: '생선 탕수육', es: 'Pescado Agridulce' } },
      { cat: 7, name: 'Udang Laksa', price: 680, translations: { en: 'Shrimp Laksa', ja: 'エビのラクサ', zh: '虾肉叻沙', ko: '새우 락사', es: 'Camarones Laksa' } },
      { cat: 4, name: 'Kerupuk Udang', price: 300, translations: { en: 'Shrimp Crackers', ja: 'エビせんべい', zh: '虾片', ko: '새우칩', es: 'Galletas de Camarón' } },
      { cat: 4, name: 'Acar', price: 300, translations: { en: 'Pickled Vegetables (Acar)', ja: 'インドネシア風ピクルス', zh: '印尼泡菜', ko: '아차르', es: 'Encurtidos' } },
      { cat: 4, name: 'Emping Melinjo', price: 300, translations: { en: 'Melinjo Chips (Emping)', ja: 'グネモンの実のチップス', zh: '珍果脆片', ko: '엠핑 멜린조', es: 'Chips de Emping' } },

      // Rekomendasi
      { cat: 9, name: 'Nasi Campur', price: 1600, translations: { en: 'Nasi Campur (Mixed Rice Plate)', ja: 'ナシチャンプル', zh: '印尼什锦饭', ko: '나시 짬푸르', es: 'Nasi Campur (Arroz Mixto)' }, isRec: true },
      { cat: 9, name: 'Bali Bong Omurice', price: 1380, translations: { en: 'Bali Bong Omurice', ja: 'バリボン・オムライス', zh: '巴厘岛原创蛋包饭', ko: '발리 봉 오므라이스', es: 'Omurice Bali Bong' }, isRec: true },
      { cat: 5, name: 'Rendang', price: 1500, translations: { en: 'Rendang (Spiced Beef Stew)', ja: 'ルンダン (牛肉スパイシー煮込み)', zh: '巴东烩牛肉', ko: '렌당', es: 'Rendang de Ternera' }, isRec: true },

      // Minuman Ringan
      { cat: 6, name: 'Jus Jeruk', price: 400, translations: { en: 'Orange Juice', ja: 'オレンジジュース', zh: '橙汁', ko: '오렌지 주스', es: 'Jugo de Naranja' } },
      { cat: 6, name: 'Teh Manis', price: 300, translations: { en: 'Sweet Tea', ja: '甘い紅茶', zh: '甜茶', ko: '스위트 티', es: 'Té Dulce' } },

      // Bir
      { cat: 6, name: 'Bintang Beer', price: 600, translations: { en: 'Bintang Beer', ja: 'ビンタンビール', zh: '星琥啤酒', ko: '빈탕 맥주', es: 'Cerveza Bintang' } },

      // Koktail
      { cat: 6, name: 'Arak Bali Attack', price: 800, translations: { en: 'Arak Bali Attack', ja: 'アラックバリアタック', zh: '巴厘岛米酒特调', ko: '아락 발리 어택', es: 'Arak Bali Attack' } }
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
        const langs = ['en', 'ja', 'zh', 'ko', 'es'];
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
