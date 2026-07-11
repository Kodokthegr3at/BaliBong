const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, 'data_fallback.json');
let useFallback = false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 2000, // Quick fail if postgres not running
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.warn('⚠️  PostgreSQL connection failed. Falling back to local JSON database:');
    console.warn(`   Reason: ${err.message}`);
    useFallback = true;
    initializeFallbackData();
  } else {
    console.log('✅ Connected to PostgreSQL database successfully.');
    release();
  }
});

// Initial mock data structure
const defaultData = {
  restaurant_info: [
    { key: 'about', lang: 'id', content: 'Konsep Bali Bong adalah tempat berkumpul untuk semua orang dengan sambutan hangat dari chef tercinta kami, Bli (sebutan "Bang" dalam bahasa Bali) Nyoman. Di sini Anda bisa bertukar ilmu bahasa dengan orang Jepang dan teman internasional, dan sudah pasti makanannya juga enak-enak. Visi dan misi kami memiliki filosofis yang mendalam: "Yang Penting Happy".' },
    { key: 'about', lang: 'ja', content: 'バリボンのコンセプトは、愛されるシェフ「ブリ（バリ語で兄）」ニョマンの温かい歓迎とともに、みんなが集まる場所です。ここで日本人や国際的な友人と言葉を交わすことができ、もちろん料理もとても美味しいです。私たちの深い哲学を持つビジョンとミッションは「ハッピーであることが一番大切」です。' },
    { key: 'about', lang: 'zh', content: 'Bali Bong 的理念是一个大家聚在一起的地方，受到我们敬爱的厨师 Bli（巴厘语中的“哥哥”）Nyoman 的热烈欢迎。在这里，您可以与日本和国际朋友交流语言，当然，食物也非常美味。我们拥有深刻哲理的愿景和使命是：“最重要的是开心”。' },
    { key: 'about', lang: 'ko', content: '발리 봉의 콘셉트는 사랑받는 셰프 블리(발리어로 "형") 뇨만의 따뜻한 환영과 함께 모두가 모이는 장소입니다. 이곳에서 일본인 및 다국적 친구들과 언어를 교환할 수 있으며, 물론 음식도 아주 맛있습니다. 우리의 깊은 철학을 담은 비전과 미션은 "행복한 것이 가장 중요하다"입니다.' },
    { key: 'about', lang: 'es', content: 'El concepto de Bali Bong es un lugar de encuentro para todos, con una cálida bienvenida por parte de nuestro querido chef Bli (hermano en balinés) Nyoman. Aquí puedes intercambiar idiomas con amigos japoneses e internacionales y, por supuesto, la comida es deliciosa. Nuestra visión y misión, que tiene una profunda filosofía, es: "Lo importante es ser feliz".' },
    
    { key: 'transportation', lang: 'id', content: '4 menit berjalan kaki dari Stasiun Abiko di Midosuji Line. (388 meter dari Abiko)' },
    { key: 'transportation', lang: 'ja', content: '御堂筋線あびこ駅から徒歩4分（あびこ駅から388m）' },
    { key: 'transportation', lang: 'zh', content: '从御堂筋线我孙子站（Abiko Sta.）步行 4 分钟。（距离我孙子站 388 米）' },
    { key: 'transportation', lang: 'ko', content: '미도스지선 아비코역(Abiko Sta.)에서 도보 4분 거리. (아비코역에서 388m)' },
    { key: 'transportation', lang: 'es', content: 'A 4 minutos a pie de la estación de Abiko en la línea Midosuji. (A 388 metros de Abiko)' },
    
    { key: 'contact', lang: 'id', content: 'Telepon: 06-6695-6267 | Alamat: 大阪府大阪市住吉区苅田3-16-11' },
    { key: 'contact', lang: 'ja', content: '電話番号: 06-6695-6267 | 住所: 大阪府大阪市住吉区苅田3-16-11' },
    { key: 'contact', lang: 'zh', content: '电话：06-6695-6267 | 地址：大阪府大阪市住吉区苅田3-16-11' },
    { key: 'contact', lang: 'ko', content: '전화번호: 06-6695-6267 | 주소: 大阪府大阪市住吉区苅田3-16-11' },
    { key: 'contact', lang: 'es', content: 'Teléfono: 06-6695-6267 | Dirección: 大阪府大阪市住吉区苅田3-16-11' },
    
    { key: 'hours', lang: 'id', content: 'Senin, Selasa, Kamis-Minggu: 11:30 - 14:30 & 17:30 - 00:00. Tutup: Rabu.' },
    { key: 'hours', lang: 'ja', content: '月・火・木〜日: 11:30 - 14:30, 17:30 - 00:00. 定休日: 水曜日' },
    { key: 'hours', lang: 'zh', content: '周一、周二、周四至周日：11:30 - 14:30 & 17:30 - 00:00。 休息日：周三' },
    { key: 'hours', lang: 'ko', content: '월, 화, 목~일: 11:30 - 14:30 & 17:30 - 00:00. 휴무일: 수요일' },
    { key: 'hours', lang: 'es', content: 'Lunes, Martes, Jueves-Domingo: 11:30 - 14:30 y 17:30 - 00:00. Cerrado: Miércoles.' }
  ],
  menu_categories: [
    { id: 5, slug: 'rekomendasi' },
    { id: 1, slug: 'makanan_berat' },
    { id: 2, slug: 'makanan_sayur' },
    { id: 3, slug: 'manisan' },
    { id: 4, slug: 'ala_carte' },
    { id: 6, slug: 'minuman_ringan' },
    { id: 7, slug: 'bir' },
    { id: 8, slug: 'koktail' }
  ],
  menu_category_translations: [
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
    { category_id: 5, lang: 'es', name: 'Recomendados' },

    { category_id: 6, lang: 'id', name: 'Minuman Ringan' },
    { category_id: 6, lang: 'ja', name: 'ソフトドリンク' },
    { category_id: 6, lang: 'zh', name: '软饮料' },
    { category_id: 6, lang: 'ko', name: '소프트 드링크' },
    { category_id: 6, lang: 'es', name: 'Refrescos' },

    { category_id: 7, lang: 'id', name: 'Bir' },
    { category_id: 7, lang: 'ja', name: 'ビール' },
    { category_id: 7, lang: 'zh', name: '啤酒' },
    { category_id: 7, lang: 'ko', name: '맥주' },
    { category_id: 7, lang: 'es', name: 'Cerveza' },

    { category_id: 8, lang: 'id', name: 'Koktail' },
    { category_id: 8, lang: 'ja', name: 'カクテル' },
    { category_id: 8, lang: 'zh', name: '鸡尾酒' },
    { category_id: 8, lang: 'ko', name: '칵테일' },
    { category_id: 8, lang: 'es', name: 'Cócteles' }
  ],
  menu_items: [],
  menu_item_translations: [],
  qr_codes: [],
  admin_users: [
    {
      id: 1,
      email: process.env.ADMIN_EMAIL || 'admin@balibong.com',
      // Hash for 'adminbalibong123' using bcryptjs (pre-hashed to avoid synchronous bcrypt dependency on start)
      password_hash: '$2a$10$MIt2pu94cbLKiE4ZhhSgo./be9L4tUf7z1VqluZ9CS.nK9UBiYjve',
      role: 'admin'
    }
  ]
};

function initializeFallbackData() {
  if (!fs.existsSync(dbPath)) {
    console.log('📝 Creating initial local JSON database...');
    // Seed menu items
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
      { cat: 1, name: 'Tumis Leher Ayam', price: 990, translations: { ja: '鶏ネックの炒め物', zh: '炒鸡颈肉', ko: '닭목살 볶음', es: 'Cuello de Pollo Salteado' } },
      { cat: 1, name: 'Sayap Ayam Pedas', price: 990, translations: { ja: 'スパイシーチキンウィング', zh: '辣鸡翅', ko: '매콤 닭날개 구이', es: 'Alitas de Pollo Picantes' } },
      { cat: 1, name: 'Ayam Bumbu Bali', price: 1080, translations: { ja: 'バリ風スパイス鶏肉煮込み', zh: '巴厘岛香料鸡肉', ko: '발리식 양념 치킨', es: 'Pollo en Salsa Bali' } },
      { cat: 1, name: 'Maboroshi no Java Curry', price: 1080, translations: { ja: '幻のジャワカレー', zh: '幻之爪哇咖喱', ko: '환상의 자바 카레', es: 'Curry de Java de Ensueño' } },
      { cat: 1, name: 'Nasi Goreng', price: 1180, translations: { ja: 'ナシゴレン (インドネシア風炒飯)', zh: '印尼炒饭', ko: '나시고랭 (인도네시아식 볶음밥)', es: 'Arroz Frito (Nasi Goreng)' } },
      { cat: 1, name: 'Mie Goreng', price: 1180, translations: { ja: 'ミーゴレン (インドネシア風焼きそば)', zh: '印尼炒面', ko: '미고랭 (인도네시아식 볶음국수)', es: 'Fideos Fritos (Mie Goreng)' } },
      { cat: 1, name: 'Bihun Goreng', price: 1180, translations: { ja: 'ビーフンゴレン', zh: '炒米粉', ko: '비훈고랭 (볶음 쌀국수)', es: 'Bihun Frito' } },
      { cat: 1, name: 'Ayam Goreng Bali Bong', price: 990, translations: { ja: 'バリボンフライドチキン', zh: '巴厘岛炸鸡', ko: '발리 봉 프라이드 치킨', es: 'Pollo Frito Bali Bong' } },
      { cat: 1, name: 'Ayam Bakar', price: 1180, translations: { ja: '鶏肉の炭火焼き', zh: '烤鸡', ko: '아얌 바카르 (닭구이)', es: 'Pollo a la Parrilla' } },
      { cat: 1, name: 'Opor Ayam', price: 990, translations: { ja: '鶏肉のココナッツミルク煮', zh: '椰汁鸡', ko: '오포르 아얌 (코코넛 치킨 스프)', es: 'Pollo en Leche de Coco (Opor Ayam)' } },
      { cat: 1, name: 'Telor Balado', price: 990, translations: { ja: 'ゆで卵のチリソース和え', zh: '辣酱鸡蛋', ko: '계란 발라도 (매운 계란)', es: 'Huevo Balado (Huevo con Chile)' } },
      { cat: 1, name: 'Tempe Manis', price: 750, translations: { ja: '甘辛テンペ炒め', zh: '甜味印尼豆豉', ko: '달콤한 템페 볶음', es: 'Tempeh Dulce' } },
      { cat: 1, name: 'Tempe Laksa', price: 750, translations: { ja: 'テンペラクサ', zh: '印尼豆豉叻沙', ko: '템페 락사', es: 'Tempeh Laksa' } },
      { cat: 1, name: 'Udang Cah Terong', price: 680, translations: { ja: 'エビとナスの炒め物', zh: '茄子炒虾', ko: '새우 가지 볶음', es: 'Camarones Salteados con Berenjena' } },
      { cat: 1, name: 'Tempe Goreng', price: 680, translations: { ja: 'テンペの唐揚げ', zh: '炸印尼豆豉', ko: '템페 튀김', es: 'Tempeh Frito' } },
      { cat: 1, name: 'Perkedel Kentang', price: 680, translations: { ja: 'インドネシア風ポテトコロッケ', zh: '马铃薯饼', ko: '인도네시아식 감자전', es: 'Croqueta de Patata' } },
      { cat: 1, name: 'Lumpia Goreng', price: 620, translations: { ja: '揚げ春巻き', zh: '炸春卷', ko: '튀긴 춘권', es: 'Rollito de Primavera Frito' } },
      { cat: 1, name: 'Perkedel Jagung', price: 690, translations: { ja: 'コーンかき揚げ', zh: '玉米饼', ko: '옥수수전', es: 'Buñuelo de Maíz' } },
      { cat: 1, name: 'Telor Dadar', price: 690, translations: { ja: 'インドネシア風オムレツ', zh: '煎蛋卷', ko: '인도네시아식 계란말이', es: 'Tortilla de Huevo' } },
      { cat: 1, name: 'Sate Ayam (4 tusuk)', price: 990, translations: { ja: '焼き鳥 (4本)', zh: '鸡肉沙爹 (4串)', ko: '닭꼬치 (사떼 아얌 4꼬치)', es: 'Sate de Pollo (4 brochetas)' } },
      { cat: 1, name: 'Sate Ayam (2 tusuk)', price: 500, translations: { ja: '焼き鳥 (2本)', zh: '鸡肉沙爹 (2串)', ko: '닭꼬치 (사떼 아얌 2꼬치)', es: 'Sate de Pollo (2 brochetas)' } },
      { cat: 1, name: 'Sate Kambing (4 tusuk)', price: 980, translations: { ja: 'ヤギ肉の串焼き (4本)', zh: '羊肉沙爹 (4串)', ko: '양꼬치 (사떼 깜빙 4꼬치)', es: 'Sate de Cabra (4 brochetas)' } },
      { cat: 1, name: 'Sate Kambing (2 tusuk)', price: 500, translations: { ja: 'ヤギ肉 di串焼き (2本)', zh: '羊肉沙爹 (2串)', ko: '양꼬치 (사떼 깜빙 2꼬치)', es: 'Sate de Cabra (2 brochetas)' } },
      { cat: 1, name: 'Sate Lilit (4 tusuk)', price: 990, translations: { ja: 'サテ・リリット (白身魚のつくね串焼き 4本)', zh: '巴厘岛鱼肉沙爹 (4串)', ko: '사떼 릴릿 (발리식 생선꼬치 4꼬치)', es: 'Sate Lilit (4 brochetas)' } },
      { cat: 1, name: 'Sate Lilit (2 tusuk)', price: 500, translations: { ja: 'サテ・リリット (白身魚のつくね串焼き 2本)', zh: '巴厘岛鱼肉沙爹 (2串)', ko: '사떼 릴릿 (발리식 생선꼬치 2꼬치)', es: 'Sate Lilit (2 brochetas)' } },
      { cat: 1, name: 'Sate Campur (masing-masing jenis 2 tusuk, total 6 tusuk)', price: 1480, translations: { ja: 'サテ盛り合わせ (各2本、計6本)', zh: '混合沙爹 (各2串，共6串)', ko: '모듬 사떼 (각 2꼬치, 총 6꼬치)', es: 'Sate Mixto (2 de cada, total 6 brochetas)' } },
      { cat: 1, name: 'Soto Ayam', price: 1180, translations: { ja: 'ソトアヤム (鶏肉のスパイススープ)', zh: '鸡肉汤面', ko: '소토 아얌 (닭고기 스프)', es: 'Sopa de Pollo (Soto Ayam)' } },
      { cat: 1, name: 'Ayam dan Sayur Rice Noodle', price: 1180, translations: { ja: '鶏肉と野菜のライスヌードル', zh: '鸡肉蔬菜米粉', ko: '닭고기 야채 쌀국수', es: 'Fideos de Arroz con Pollo y Verduras' } },
      { cat: 1, name: 'Bakso', price: 1180, translations: { ja: 'バクソ (肉団子スープ)', zh: '肉丸汤', ko: '박소 (인도네시아식 미트볼 국수)', es: 'Sopa de Albóndigas (Bakso)' } },
      { cat: 1, name: 'Mie Laksa', price: 1180, translations: { ja: 'ミーラクサ', zh: '叻沙面', ko: '미 락사', es: 'Fideos Laksa' } },
      { cat: 1, name: 'Gaprao', price: 1080, translations: { ja: 'ガパオライス', zh: '打抛猪肉饭', ko: '바질 돼지고기 덮밥 (팟카프라우)', es: 'Arroz con Cerdo y Albahaca (Gaprao)' } },
      { cat: 1, name: 'Bali Bong Chicken Soup Curry', price: 1200, translations: { ja: 'バリボン・スープカレー (鶏肉)', zh: '巴厘岛鸡肉汤咖喱', ko: '발리 봉 치킨 스프 카레', es: 'Sopa de Curry con Pollo Bali Bong' } },
      { cat: 1, name: 'Udon Coconut Curry', price: 1080, translations: { ja: 'ココナッツカレーうどん', zh: '椰香咖喱乌冬面', ko: '코코넛 카레 우동', es: 'Fideos Udon con Curry de Coco' } },
      { cat: 1, name: 'Pho Goreng (Spesial)', price: 1180, translations: { ja: '焼きフォー (大/スペシャル)', zh: '炒河粉 (豪华/大份)', ko: '볶음 쌀국수 (스페셜)', es: 'Fideos Pho Fritos (Especial)' } },
      { cat: 1, name: 'Ayam dan Sayur Pho', price: 1180, translations: { ja: '鶏肉と野菜のフォー', zh: '鸡肉蔬菜河粉', ko: '닭고기 야채 쌀국수 (포)', es: 'Pho de Pollo y Verduras' } },
      { cat: 1, name: 'Coconut Curry Pho', price: 1180, translations: { ja: 'ココナッツカレーフォー', zh: '椰香咖喱河粉', ko: '코코넛 카레 포', es: 'Pho de Curry de Coco' } },
      { cat: 1, name: 'Tom Yum Pho', price: 1180, translations: { ja: 'トムヤムフォー', zh: '冬阴功河粉', ko: '똠얌 쌀국수 (포)', es: 'Pho Tom Yum' } },

      // Makanan Sayur
      { cat: 2, name: 'Gado-Gado', price: 880, translations: { ja: 'ガドガド (温野菜のピーナッツソース和え)', zh: '印尼加多加多沙拉', ko: '가도가도 (인도네시아식 샐러드)', es: 'Gado-Gado (Ensalada con salsa de cacahuete)' } },
      { cat: 2, name: 'Bali Bong Original Salad', price: 880, translations: { ja: 'バリボン・オリジナルサラダ', zh: '巴厘岛原创沙拉', ko: '발리 봉 오리지널 샐러드', es: 'Ensalada Original Bali Bong' } },
      { cat: 2, name: 'Lumpia Sayur', price: 880, translations: { ja: '野菜春巻き', zh: '蔬菜春卷', ko: '야채 춘권', es: 'Rollito de Primavera de Verduras' } },
      { cat: 2, name: 'Tumis Kangkung', price: 980, translations: { ja: '空心菜の炒め物', zh: '炒空心菜', ko: '모닝글로리 볶음 (공심채 볶음)', es: 'Salteado de Espinaca de Agua (Kangkung)' } },
      { cat: 2, name: 'Capcay Sayur', price: 880, translations: { ja: '野菜チャプチャイ (インドネシア風八宝菜)', zh: '什锦蔬菜', ko: '찹차이 (인도네시아식 야채 볶음)', es: 'Salteado de Verduras Mixtas (Capcay)' } },
      { cat: 2, name: 'Pare Goreng', price: 880, translations: { ja: 'ゴーヤのチャンプルー風炒め', zh: '炒苦瓜', ko: '여주 볶음', es: 'Calabaza Amarga Frita (Pare)' } },

      // Manisan
      { cat: 3, name: 'Pisang Goreng (dengan es krim)', price: 550, translations: { ja: '揚げバナナ (アイスクリーム添え)', zh: '炸香蕉 (配冰淇淋)', ko: '바나나 튀김 (아이스크림 곁들임)', es: 'Plátano Frito (con helado)' } },
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
      { cat: 4, name: 'Acar', price: 300, translations: { ja: 'インドネシア風ピクルス', zh: '印尼泡菜', ko: '아차르 (피클)', es: 'Encurtidos (Acar)' } },
      { cat: 4, name: 'Emping Melinjo', price: 300, translations: { ja: 'グネモンの実のチップス', zh: '珍果脆片', ko: '엠핑 멜린조 (칩)', es: 'Chips de Emping' }, description: 'Emping melinjo' },

      // Rekomendasi
      { cat: 5, name: 'Nasi Campur', price: 1600, translations: { ja: 'ナシチャンプル (おかず盛り合わせご飯)', zh: '印尼什锦饭', ko: '나시 짬푸르 (인도네시아식 백반)', es: 'Arroz Mixto (Nasi Campur)' }, isRec: true },
      { cat: 5, name: 'Bali Bong Omurice', price: 1380, translations: { ja: 'バリボン・オムライス', zh: '巴厘岛原创蛋包饭', ko: '발리 봉 오므라이스', es: 'Omurice Bali Bong' }, isRec: true },
      { cat: 5, name: 'Rendang', price: 1500, translations: { ja: 'ルンダン (牛肉のスパイス煮込み)', zh: '巴东烩牛肉', ko: '렌당 (소고기 향신料 조림)', es: 'Rendang de Ternera (Curry seco)' }, isRec: true },
      
      // Minuman Ringan
      { cat: 6, name: 'Jus Jeruk', price: 400, translations: { ja: 'オレンジジュース', zh: '橙汁', ko: '오렌지 주스', es: 'Jugo de Naranja' } },
      { cat: 6, name: 'Teh Manis', price: 300, translations: { ja: '甘い紅茶', zh: '甜茶', ko: '스위트 티', es: 'Té Dulce' } },
      
      // Bir
      { cat: 7, name: 'Bintang Beer', price: 600, translations: { ja: 'ビンタンビール', zh: '星琥啤酒', ko: '빈탕 맥주', es: 'Cerveza Bintang' } },
      
      // Koktail
      { cat: 8, name: 'Arak Bali Attack', price: 800, translations: { ja: 'アラックバリアタック', zh: '巴厘岛米酒特调', ko: '아락 발리 어택', es: 'Arak Bali Attack' } }
    ];

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
      const langs = ['ja', 'zh', 'ko', 'es'];
      for (const lang of langs) {
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
        return {
          id: c.id,
          slug: c.slug,
          name: trans ? trans.name : c.slug
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
        const cat = data.menu_categories.find(c => c.id === item.category_id);
        return {
          ...item,
          name: trans ? trans.name : `Item ${item.id}`,
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
