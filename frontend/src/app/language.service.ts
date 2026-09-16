import { Injectable, signal, computed } from '@angular/core';

export type LanguageCode = 'id' | 'ja' | 'zh' | 'ko' | 'es';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  readonly languages: LanguageOption[] = [
    { code: 'id', name: 'Indonesia' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '简体中文' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' }
  ];

  // Current language signal
  private readonly currentLangSignal = signal<LanguageCode>(this.getInitialLanguage());

  readonly currentLang = this.currentLangSignal.asReadonly();

  readonly currentLangName = computed(() => {
    return this.languages.find(l => l.code === this.currentLang())?.name || 'Indonesia';
  });

  readonly currentLangCode = computed(() => this.currentLang().toUpperCase());

  // UI Translations
  private readonly uiTranslations: Record<LanguageCode, Record<string, string>> = {
    id: {
      about_title: 'Tentang Kami',
      transport_title: 'Akses & Transportasi',
      contact_title: 'Kontak & Informasi',
      hours_title: 'Jam Operasional',
      view_menu: 'Lihat Menu',
      back_home: 'Kembali ke Beranda',
      menu_title: 'Menu',
      search_placeholder: 'Cari hidangan lezat...',
      price_label: 'Harga',
      recommended_label: 'Menu Unggulan',
      all_categories: 'Semua Kategori',
      sold_out: 'Habis',
      admin_login: 'Login Admin',
      admin_logout: 'Keluar',
      admin_panel: 'Panel Admin',
      table_label: 'Nomor Meja',
      generate_qr: 'Buat QR Code',
      download: 'Unduh',
      save: 'Simpan',
      edit: 'Edit',
      delete: 'Hapus',
      add_item: 'Tambah Menu',
      restaurant_info_tab: 'Info Restoran',
      menu_items_tab: 'Manajemen Menu',
      qr_codes_tab: 'Kelola QR Code',
      login_btn: 'Masuk',
      email_placeholder: 'Alamat Email',
      password_placeholder: 'Kata Sandi',
      loading: 'Memuat data...',
      all_rights: 'Hak Cipta Dilindungi.',
      concept_story: 'Kisah & Konsep Kami',
      transport_how: 'Bagaimana menuju ke Bali Bong',
      our_location: 'Lokasi Kami',
      home_tab: 'Beranda',
      menu_tab: 'Menu',
      admin_tab: 'Admin',
      hero_subtitle: 'Hidangan Khas Bali & Nusantara',
      hero_desc: 'Yang Penting Happy — kehangatan sambutan dan rempah otentik Nusantara di setiap suapan hidangan khas Bali kami.',
      spices_title: '100% Kenyamanan dan Kehangatan',
      spices_desc: 'Kami berdedikasi untuk menciptakan suasana yang paling nyaman dan hangat bagi setiap pengunjung, karena kebahagiaan Anda adalah prioritas utama kami.',
      reviews_title: 'Ulasan Pelanggan',
      review_source: 'Tabelog (90 Ulasan)',
      feature_curry: 'Kari Indonesia',
      feature_family: 'Cocok untuk Keluarga',
      feature_solo: 'Makan Sendiri',
      map_button: 'Buka di Google Maps',
      review_quote: '"Ini adalah restoran favorit saya. Saya berkunjung bersama suami saat makan siang hari Sabtu... Pilihan yang sangat tepat!"',
      menu_seo_desc: 'Menu digital Bali Bong dalam 5 bahasa — masakan otentik Bali & Indonesia di Osaka. Pindai QR di meja Anda untuk melihat menu lengkap.',
      menu_seo_title: 'Menu — BALI BONG'
    },
    ja: {
      about_title: 'バリボンについて',
      transport_title: 'アクセス＆交通機関',
      contact_title: '連絡先＆情報',
      hours_title: '営業時間',
      view_menu: 'メニューを見る',
      back_home: 'ホームに戻る',
      menu_title: 'メニュー',
      search_placeholder: '美味しい料理を検索...',
      price_label: '価格',
      recommended_label: 'おすすめメニュー',
      all_categories: 'すべてのカテゴリー',
      sold_out: '売り切れ',
      admin_login: '管理者ログイン',
      admin_logout: 'ログアウト',
      admin_panel: '管理パネル',
      table_label: 'テーブル番号',
      generate_qr: 'QRコード作成',
      download: 'ダウンロード',
      save: '保存',
      edit: '編集',
      delete: '削除',
      add_item: 'メニュー追加',
      restaurant_info_tab: '店舗情報',
      menu_items_tab: 'メニュー管理',
      qr_codes_tab: 'QRコード管理',
      login_btn: 'ログイン',
      email_placeholder: 'メールアドレス',
      password_placeholder: 'パスワード',
      loading: '読み込み中...',
      all_rights: '全著作権所有。',
      concept_story: '私たちのストーリー＆コンセプト',
      transport_how: 'バリボンへの行き方',
      our_location: 'ロケーション',
      home_tab: 'ホーム',
      menu_tab: 'メニュー',
      admin_tab: '管理',
      hero_subtitle: '本格バリ・インドネシア料理',
      hero_desc: 'Yang Penting Happy（大事なのはハッピーであること）——温かいおもてなしと、本格的なヌサンタラのスパイスを、バリ料理の一口ごとに。',
      spices_title: '100%の快適さと温もり',
      spices_desc: 'すべてのお客様に最も快適で温かい雰囲気を提供することに専念しています。お客様の幸せが私たちの最優先事項だからです。',
      reviews_title: 'カスタマーレビュー',
      review_source: '食べログ (90件の口コミ)',
      feature_curry: 'インドネシアカレー',
      feature_family: '家族向け',
      feature_solo: 'お一人様歓迎',
      map_button: 'Google マップで開く',
      review_quote: '"一番好きなレストランです。土曜日のランチに夫と訪問しました... どれを選んでも間違いありません！"',
      menu_seo_desc: 'バリボンのデジタルメニュー、5言語対応 — 大阪で味わう本格バリ・インドネシア料理。テーブルのQRコードをスキャンして全メニューをご覧ください。',
      menu_seo_title: 'メニュー — BALI BONG'
    },
    zh: {
      about_title: '关于我们',
      transport_title: '交通与位置',
      contact_title: '联系与信息',
      hours_title: '营业时间',
      view_menu: '查看菜单',
      back_home: '返回首页',
      menu_title: '菜单',
      search_placeholder: '搜索美味佳肴...',
      price_label: '价格',
      recommended_label: '主厨推荐',
      all_categories: '全部类别',
      sold_out: '售罄',
      admin_login: '管理员登录',
      admin_logout: '退出登录',
      admin_panel: '管理面板',
      table_label: '桌号',
      generate_qr: '生成二维码',
      download: '下载',
      save: '保存',
      edit: '编辑',
      delete: '删除',
      add_item: '添加新菜单',
      restaurant_info_tab: '餐厅信息',
      menu_items_tab: '菜单管理',
      qr_codes_tab: '管理二维码',
      login_btn: '登录',
      email_placeholder: '电子邮件',
      password_placeholder: '密码',
      loading: '加载中...',
      all_rights: '版权所有。',
      concept_story: '我们的故事与理念',
      transport_how: '如何前往 Bali Bong',
      our_location: '我们的位置',
      home_tab: '首页',
      menu_tab: '菜单',
      admin_tab: '管理',
      hero_subtitle: '正宗巴厘岛与印尼美食',
      hero_desc: 'Yang Penting Happy（重要的是开心）——温暖的迎接与地道的努沙登加拉香料，融入我们每一口巴厘风味料理。',
      spices_title: '100% 的舒适与温暖',
      spices_desc: '我们致力于为每一位顾客创造最舒适温馨的氛围，因为您的幸福是我们最大的追求。',
      reviews_title: '顾客评价',
      review_source: 'Tabelog (90条评价)',
      feature_curry: '印尼咖喱',
      feature_family: '适合家庭',
      feature_solo: '适合独自用餐',
      map_button: '在谷歌地图中打开',
      review_quote: '"这是我最喜欢的餐厅。周六午餐时间和丈夫一起去的... 在这里怎么点都不会错！"',
      menu_seo_desc: 'Bali Bong 数字菜单，支持5种语言 — 大阪正宗巴厘岛与印尼美食。扫描桌上的二维码查看完整菜单。',
      menu_seo_title: '菜单 — BALI BONG'
    },
    ko: {
      about_title: '레스토랑 소개',
      transport_title: '찾아오시는 길',
      contact_title: '연락처 및 안내',
      hours_title: '영업 시간',
      view_menu: '메뉴 보기',
      back_home: '홈으로 돌아가기',
      menu_title: '메뉴',
      search_placeholder: '맛있는 요리 검색...',
      price_label: '가격',
      recommended_label: '추천 메뉴',
      all_categories: '전체 카테고리',
      sold_out: '품절',
      admin_login: '관리자 로그인',
      admin_logout: '로그아웃',
      admin_panel: '관리자 패널',
      table_label: '테이블 번호',
      generate_qr: 'QR코드 생성',
      download: '다운로드',
      save: '저장',
      edit: '수정',
      delete: '삭제',
      add_item: '메뉴 추가',
      restaurant_info_tab: '레스토랑 정보',
      menu_items_tab: '메뉴 관리',
      qr_codes_tab: 'QR코드 관리',
      login_btn: '로그인',
      email_placeholder: '이메일 주소',
      password_placeholder: '비밀번호',
      loading: '불러오는 중...',
      all_rights: '모든 권리 보유.',
      concept_story: '스토리 & 콘셉트',
      transport_how: '발리 봉 찾아오시는 방법',
      our_location: '위치 안내',
      home_tab: '홈',
      menu_tab: '메뉴',
      admin_tab: '관리',
      hero_subtitle: '정통 발리 & 인도네시아 요리',
      hero_desc: 'Yang Penting Happy(중요한 건 행복한 것) — 따뜻한 환대와 정통 누산타라 향신료를, 발리 요리 한 입마다 담았습니다.',
      spices_title: '100%의 편안함과 따뜻함',
      spices_desc: '우리는 모든 고객에게 가장 편안하고 따뜻한 분위기를 제공하기 위해 헌신합니다. 여러분의 행복이 우리의 최우선 과제이기 때문입니다.',
      reviews_title: '고객 리뷰',
      review_source: '타베로그 (리뷰 90개)',
      feature_curry: '인도네시아 카레',
      feature_family: '가족 친화적',
      feature_solo: '혼밥 환영',
      map_button: '구글 지도에서 열기',
      review_quote: '"제가 가장 좋아하는 레스토랑입니다. 토요일 점심에 남편과 함께 방문했습니다... 어떤 메뉴를 선택해도 후회 없습니다!"',
      menu_seo_desc: '발리 봉 디지털 메뉴, 5개 언어 지원 — 오사카에서 맛보는 정통 발리 & 인도네시아 요리. 테이블의 QR코드를 스캔해 전체 메뉴를 확인하세요.',
      menu_seo_title: '메뉴 — BALI BONG'
    },
    es: {
      about_title: 'Sobre Nosotros',
      transport_title: 'Acceso y Transporte',
      contact_title: 'Contacto e Información',
      hours_title: 'Horario de Atención',
      view_menu: 'Ver Menú',
      back_home: 'Volver al Inicio',
      menu_title: 'Menú',
      search_placeholder: 'Buscar platos deliciosos...',
      price_label: 'Precio',
      recommended_label: 'Recomendaciones',
      all_categories: 'Todas las Categorías',
      sold_out: 'Agotado',
      admin_login: 'Login de Admin',
      admin_logout: 'Cerrar Sesión',
      admin_panel: 'Panel de Admin',
      table_label: 'Número de Mesa',
      generate_qr: 'Generar Código QR',
      download: 'Descargar',
      save: 'Guardar',
      edit: 'Editar',
      delete: 'Eliminar',
      add_item: 'Agregar Menú',
      restaurant_info_tab: 'Info de Restaurante',
      menu_items_tab: 'Gestión de Menú',
      qr_codes_tab: 'Gestionar QR',
      login_btn: 'Iniciar Sesión',
      email_placeholder: 'Correo Electrónico',
      password_placeholder: 'Contraseña',
      loading: 'Cargando...',
      all_rights: 'Todos los derechos reservados.',
      concept_story: 'Nuestra Historia y Concepto',
      transport_how: 'Cómo llegar a Bali Bong',
      our_location: 'Nuestra Ubicación',
      home_tab: 'Inicio',
      menu_tab: 'Menú',
      admin_tab: 'Admin',
      hero_subtitle: 'Auténtica Cocina de Bali e Indonesia',
      hero_desc: 'Yang Penting Happy (lo importante es ser feliz) — calidez en la bienvenida y especias auténticas del archipiélago indonesio en cada bocado de nuestros platos balineses.',
      spices_title: '100% Comodidad y Calidez',
      spices_desc: 'Nos dedicamos a crear el ambiente más cómodo y cálido para cada cliente, porque su felicidad es nuestra mayor prioridad.',
      reviews_title: 'Opiniones de Clientes',
      review_source: 'Tabelog (90 Opiniones)',
      feature_curry: 'Curry Indonesio',
      feature_family: 'Ambiente Familiar',
      feature_solo: 'Ideal para Comer Solo',
      map_button: 'Abrir en Google Maps',
      review_quote: '"Este es mi restaurante favorito. Fui con mi esposo un sábado al mediodía... ¡Aquí no hay elección equivocada!"',
      menu_seo_desc: 'Menú digital de Bali Bong en 5 idiomas — auténtica cocina de Bali e Indonesia en Osaka. Escanea el código QR de tu mesa para ver el menú completo.',
      menu_seo_title: 'Menú — BALI BONG'
    }
  };

  private getInitialLanguage(): LanguageCode {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('balibong_lang') as LanguageCode;
      if (stored && ['id', 'ja', 'zh', 'ko', 'es'].includes(stored)) {
        return stored;
      }

      // Check browser default
      const browserLang = navigator.language.split('-')[0] as LanguageCode;
      if (browserLang && ['id', 'ja', 'zh', 'ko', 'es'].includes(browserLang)) {
        return browserLang;
      }
    }
    return 'id';
  }

  setLanguage(lang: LanguageCode) {
    this.currentLangSignal.set(lang);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('balibong_lang', lang);
    }
  }

  // Get translated UI text
  t(key: string): string {
    const lang = this.currentLang();
    return this.uiTranslations[lang][key] || this.uiTranslations['id'][key] || key;
  }
}
