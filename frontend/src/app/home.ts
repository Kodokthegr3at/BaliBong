import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageService, LanguageCode } from './language.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Header with Language Switcher -->
    <header class="main-header">
      <div class="container header-container">
        <a routerLink="/" class="logo">
          <img src="/public/images/assets/logo.png" alt="BALI BONG Logo" class="header-logo-img">
        </a>
        <nav class="nav-links">
          <a routerLink="/" class="nav-link active">{{ langService.t('about_title') }}</a>
          <a routerLink="/menu" class="nav-link">{{ langService.t('menu_title') }}</a>
          <a routerLink="/admin" class="nav-link"><i class="fa-solid fa-lock"></i></a>
          
          <!-- Language Switcher Dropdown -->
          <div class="lang-switcher">
            <button class="lang-btn" (click)="langOpen.set(!langOpen())">
              <span>{{ langService.currentLangFlag() }}</span>
              <span>{{ langService.currentLangName() }}</span>
              <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="lang-dropdown" [class.open]="langOpen()">
              <button 
                *ngFor="let lang of langService.languages" 
                class="lang-option" 
                [class.active]="langService.currentLang() === lang.code"
                (click)="selectLanguage(lang.code)"
              >
                <span>{{ lang.flag }}</span>
                <span>{{ lang.name }}</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-overlay"></div>
      
      <!-- Floating Bali-style tropical decorations -->
      <div class="hero-decorations">
        <i class="fa-solid fa-leaf float-element-1 leaf-decor-1"></i>
        <i class="fa-solid fa-seedling float-element-2 leaf-decor-2"></i>
        <i class="fa-solid fa-leaf float-element-1 leaf-decor-3"></i>
      </div>

      <div class="container hero-content animate-fade-in">
        <span class="hero-subtitle animate-pop-in">{{ langService.t('hero_subtitle') }}</span>
        <h1 style="display: none;">BALI BONG</h1>
        <img src="/public/images/assets/logo2.png" alt="BALI BONG" class="hero-main-logo animate-pop-in">
        <p class="hero-desc">{{ langService.t('hero_desc') }}</p>
        <div class="hero-actions">
          <a routerLink="/menu" class="btn btn-secondary animate-pop-in">
            <i class="fa-solid fa-utensils"></i> {{ langService.t('view_menu') }}
          </a>
        </div>
      </div>
    </section>
 
    <!-- About Section -->
    <section class="section about-section" id="about">
      <div class="container">
        <div class="section-grid">
          <div class="about-text-wrapper animate-fade-in">
            <span class="section-tag">{{ langService.t('concept_story') }}</span>
            <h2 class="section-title">{{ langService.t('about_title') }}</h2>
            <div class="divider"></div>
            <p class="about-content" *ngIf="restaurantInfo().about; else loadingTemp">
              {{ restaurantInfo().about }}
            </p>
          </div>
          <div class="about-image-wrapper animate-fade-in stagger-2">
            <div class="image-card glass-panel">
              <i class="fa-solid fa-hand-holding-heart leaf-icon"></i>
              <h3>{{ langService.t('spices_title') }}</h3>
              <p>{{ langService.t('spices_desc') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
 
    <!-- Transport & Hours Grid -->
    <section class="section info-section">
      <div class="container">
        <div class="info-grid">
          <!-- Hours & Location -->
          <div class="info-card glass-panel animate-fade-in stagger-1">
            <div class="info-icon"><i class="fa-solid fa-clock"></i></div>
            <h3>{{ langService.t('hours_title') }}</h3>
            <p class="info-details" *ngIf="restaurantInfo().hours; else loadingTemp">
              {{ restaurantInfo().hours }}
            </p>
          </div>
 
          <!-- Transport -->
          <div class="info-card glass-panel animate-fade-in stagger-2">
            <div class="info-icon"><i class="fa-solid fa-route"></i></div>
            <h3>{{ langService.t('transport_title') }}</h3>
            <p class="info-details" *ngIf="restaurantInfo().transportation; else loadingTemp">
              {{ restaurantInfo().transportation }}
            </p>
          </div>
 
          <!-- Contact -->
          <div class="info-card glass-panel animate-fade-in stagger-3">
            <div class="info-icon"><i class="fa-solid fa-phone"></i></div>
            <h3>{{ langService.t('contact_title') }}</h3>
            <p class="info-details" *ngIf="restaurantInfo().contact; else loadingTemp">
              {{ restaurantInfo().contact }}
            </p>
          </div>
        </div>

        <div class="location-review-wrapper animate-fade-in stagger-4">
          <!-- Reviews Panel -->
          <div class="review-panel glass-panel">
            <h3 class="review-title"><i class="fa-solid fa-star"></i> {{ langService.t('reviews_title') }}</h3>
            
            <div class="review-score-box">
              <div class="score-number">3.41</div>
              <div class="score-stars">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star-half-stroke"></i>
                <i class="fa-regular fa-star"></i>
              </div>
              <div class="score-source">{{ langService.t('review_source') }}</div>
            </div>

            <div class="review-features">
              <div class="feature-badge"><i class="fa-solid fa-utensils"></i> {{ langService.t('feature_curry') }}</div>
              <div class="feature-badge"><i class="fa-solid fa-child"></i> {{ langService.t('feature_family') }}</div>
              <div class="feature-badge"><i class="fa-solid fa-user"></i> {{ langService.t('feature_solo') }}</div>
            </div>

            <p class="review-quote">{{ langService.t('review_quote') }}</p>

            <a href="https://maps.google.com/?q=バリボン+我孫子+大阪" target="_blank" class="btn btn-primary btn-map-link">
              <i class="fa-solid fa-location-arrow"></i> {{ langService.t('map_button') }}
            </a>
          </div>

          <!-- Map Panel -->
          <div class="map-container glass-panel" style="padding: 0; overflow: hidden; height: 100%; min-height: 400px; border: 4px solid white;">
            <iframe 
              width="100%" 
              height="100%" 
              frameborder="0" 
              scrolling="no" 
              marginheight="0" 
              marginwidth="0" 
              src="https://maps.google.com/maps?q=バリボン%20あびこ%20大阪&t=&z=16&ie=UTF8&iwloc=&output=embed">
            </iframe>
          </div>
        </div>
      </div>
    </section>
    <ng-template #loadingTemp>
      <div class="loading-placeholder">
        <i class="fa-solid fa-spinner fa-spin"></i> {{ langService.t('loading') }}
      </div>
    </ng-template>

    <!-- Footer -->
    <footer>
      <div class="container footer-grid">
        <div class="footer-info">
          <h3>BALI BONG</h3>
          <p>Membawa cita rasa tradisional pulau Dewata Bali dan kelezatan hidangan Nusantara ke meja makan Anda.</p>
        </div>
        <div class="footer-links">
          <h4>Navigasi</h4>
          <ul>
            <li><a routerLink="/">{{ langService.t('about_title') }}</a></li>
            <li><a routerLink="/menu">{{ langService.t('menu_title') }}</a></li>
            <li><a routerLink="/admin">{{ langService.t('admin_panel') }}</a></li>
          </ul>
        </div>
        <div class="footer-hours">
          <h4>{{ langService.t('hours_title') }}</h4>
          <p *ngIf="restaurantInfo().hours">{{ restaurantInfo().hours }}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Bali Bong. {{ langService.t('all_rights') }}</p>
      </div>
    </footer>
  `,
  styles: [`
    .section {
      padding: 80px 0;
    }
    
    /* Hero */
    .hero-section {
      position: relative;
      height: 70vh;
      min-height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--primary-color);
      background-image: linear-gradient(135deg, rgba(125,34,17,0.85) 0%, rgba(156,51,30,0.85) 100%), url('/public/images/assets/pattern.jpg');
      background-size: cover;
      background-position: center;
      color: var(--text-light);
      overflow: hidden;
    }
    .hero-decorations {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 2;
    }
    .leaf-decor-1 {
      position: absolute;
      top: 15%;
      left: 6%;
      font-size: 3rem;
      color: rgba(226, 109, 63, 0.18);
    }
    .leaf-decor-2 {
      position: absolute;
      bottom: 20%;
      right: 8%;
      font-size: 2.5rem;
      color: rgba(226, 109, 63, 0.18);
    }
    .leaf-decor-3 {
      position: absolute;
      top: 35%;
      right: 25%;
      font-size: 1.8rem;
      color: rgba(255, 255, 255, 0.08);
    }
    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle, rgba(125,34,17,0.3) 0%, rgba(30,14,11,0.85) 100%);
    }
    .hero-content {
      position: relative;
      z-index: 10;
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }
    .hero-subtitle {
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: var(--secondary-color);
      font-weight: 600;
      display: block;
      margin-bottom: 16px;
    }
    .hero-title {
      font-size: 4rem;
      font-weight: 800;
      color: var(--text-light);
      margin-bottom: 24px;
      letter-spacing: 2px;
      text-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }
    .hero-main-logo {
      display: block;
      height: 180px;
      width: auto;
      object-fit: contain;
      margin: 0 auto 24px auto;
      filter: drop-shadow(0 4px 15px rgba(0,0,0,0.4));
    }
    .hero-desc {
      font-size: 1.25rem;
      margin-bottom: 40px;
      color: rgba(247, 244, 235, 0.9);
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    /* About */
    .section-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 60px;
      align-items: center;
    }
    .section-tag {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--secondary-color);
      font-weight: 700;
      display: block;
      margin-bottom: 8px;
    }
    .section-title {
      font-size: 2.5rem;
      margin-bottom: 16px;
    }
    .divider {
      width: 60px;
      height: 3px;
      background-color: var(--secondary-color);
      margin-bottom: 24px;
    }
    .about-content {
      font-size: 1.1rem;
      color: var(--text-dark);
      white-space: pre-line;
    }
    .about-image-wrapper {
      position: relative;
    }
    .image-card {
      padding: 40px;
      text-align: center;
      border-radius: var(--border-radius-lg);
      box-shadow: var(--box-shadow);
      background: linear-gradient(145deg, #ffffff 0%, #FAF8F5 100%);
    }
    .leaf-icon {
      font-size: 3rem;
      color: var(--primary-color);
      margin-bottom: 20px;
    }
    .image-card h3 {
      font-size: 1.4rem;
      margin-bottom: 12px;
    }
    .image-card p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    /* Info Cards */
    .info-section {
      background: linear-gradient(180deg, #FDF9F5 0%, #F5ECE2 100%);
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 32px;
    }
    .info-card {
      padding: 40px 32px;
      text-align: center;
      border-radius: var(--border-radius-md);
      transition: var(--transition);
      height: 100%;
      background: var(--surface-light);
    }
    .info-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--box-shadow-hover);
    }
    .info-icon {
      width: 64px;
      height: 64px;
      background: rgba(125, 34, 17, 0.05);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 1.5rem;
      color: var(--primary-color);
      transition: var(--transition);
    }
    .info-card:hover .info-icon {
      background: var(--primary-color);
      color: var(--text-light);
    }
    .info-card h3 {
      font-size: 1.3rem;
      margin-bottom: 16px;
    }
    .info-details {
      color: var(--text-dark);
      font-size: 1rem;
      white-space: pre-line;
    }

    .loading-placeholder {
      padding: 20px;
      text-align: center;
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    /* Location & Reviews */
    .location-review-wrapper {
      margin-top: 48px;
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 24px;
      align-items: stretch;
    }
    .review-panel {
      padding: 32px;
      border-radius: var(--border-radius-lg);
      background: rgba(255, 255, 255, 0.95);
      box-shadow: var(--box-shadow);
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(125, 34, 17, 0.1);
    }
    .review-title {
      font-size: 1.3rem;
      margin-bottom: 24px;
      color: var(--primary-color);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .review-score-box {
      text-align: center;
      padding: 24px;
      background: linear-gradient(135deg, #FDF9F5 0%, #F5ECE2 100%);
      border-radius: var(--border-radius-md);
      margin-bottom: 24px;
      border: 1px dashed rgba(125, 34, 17, 0.2);
    }
    .score-number {
      font-size: 3rem;
      font-weight: 800;
      color: var(--primary-color);
      line-height: 1;
      margin-bottom: 8px;
    }
    .score-stars {
      color: var(--secondary-color);
      font-size: 1.2rem;
      margin-bottom: 8px;
      letter-spacing: 2px;
    }
    .score-source {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .review-features {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 24px;
    }
    .feature-badge {
      background: rgba(125, 34, 17, 0.05);
      color: var(--primary-color);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .review-quote {
      font-style: italic;
      color: var(--text-dark);
      font-size: 0.95rem;
      line-height: 1.6;
      padding-left: 16px;
      border-left: 3px solid var(--secondary-color);
      margin-bottom: auto; /* pushes button to bottom */
    }
    .btn-map-link {
      margin-top: 24px;
      justify-content: center;
    }
    .map-container {
      border-radius: var(--border-radius-lg);
    }

    @media (max-width: 992px) {
      .section-grid {
        grid-template-columns: 1fr;
        gap: 40px;
      }
      .location-review-wrapper {
        grid-template-columns: 1fr;
      }
      .hero-title {
        font-size: 3rem;
      }
    }
    @media (max-width: 768px) {
      .hero-section {
        height: 60vh;
        min-height: 400px;
      }
      .hero-title {
        font-size: 2.4rem;
        margin-bottom: 16px;
      }
      .hero-main-logo {
        height: 120px;
        margin: 0 auto 16px auto;
      }
      .hero-desc {
        font-size: 1rem;
        margin-bottom: 24px;
      }
      .section-title {
        font-size: 1.8rem;
      }
      .about-section, .info-section {
        padding: 48px 0;
      }
      .image-card {
        padding: 24px;
      }
      .info-card {
        padding: 32px 24px;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  langService = inject(LanguageService);
  private readonly http = inject(HttpClient);

  readonly restaurantInfo = signal<{
    about: string;
    transportation: string;
    contact: string;
    hours: string;
  }>({
    about: '',
    transportation: '',
    contact: '',
    hours: ''
  });

  langOpen = signal(false);

  constructor() {
    // Re-fetch when language changes
    effect(() => {
      this.fetchInfo(this.langService.currentLang());
    });
  }

  ngOnInit() {}

  selectLanguage(lang: LanguageCode) {
    this.langService.setLanguage(lang);
    this.langOpen.set(false);
  }

  fetchInfo(lang: LanguageCode) {
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
    this.http.get<any>(`${apiBase}/restaurant-info?lang=${lang}`).subscribe({
      next: (data) => {
        this.restaurantInfo.set({
          about: data.about || '',
          transportation: data.transportation || '',
          contact: data.contact || '',
          hours: data.hours || ''
        });
      },
      error: (err) => {
        console.error('Error fetching restaurant info, using mock fallback data', err);
        // Local static fallback in case server not running yet
        const mockFallback: Record<LanguageCode, any> = {
          id: {
            about: 'Konsep Bali Bong adalah tempat berkumpul untuk semua orang dengan sambutan hangat dari chef tercinta kami, Bli (sebutan "Bang" dalam bahasa Bali) Nyoman. Di sini Anda bisa bertukar ilmu bahasa dengan orang Jepang dan teman internasional, dan sudah pasti makanannya juga enak-enak. Visi dan misi kami memiliki filosofis yang mendalam: "Yang Penting Happy".',
            transportation: 'Berlokasi di pusat kota Bali Bong. Dapat diakses dengan taksi (15 menit dari bandara) atau bus rute 10.',
            contact: 'Telepon: +62 361 123456 | Email: info@balibong.com | Alamat: Jl. Raya Bali Bong No. 88, Kuta, Bali',
            hours: 'Setiap Hari: 11:00 - 23:00 (Pemesanan Terakhir 22:30)'
          },
          ja: {
            about: 'バリボンのコンセプトは、愛されるシェフ「ブリ（バリ語で兄）」ニョマンの温かい歓迎とともに、みんなが集まる場所です。ここで日本人や国際的な友人と言葉を交わすことができ、もちろん料理もとても美味しいです。私たちの深い哲学を持つビジョンとミッションは「ハッピーであることが一番大切」です。',
            transportation: 'バリボン中心部に位置しています。タクシー（空港から15分）または路線バス10番でアクセス可能です。',
            contact: '電話：+62 361 123456 | メール：info@balibong.com | 住所：Jl. Raya Bali Bong No. 88, Kuta, Bali',
            hours: '毎日：11:00 - 23:00（ラストオーダー 22:30）'
          },
          zh: {
            about: 'Bali Bong 的理念是一个大家聚在一起的地方，受到我们敬爱的厨师 Bli（巴厘语中的“哥哥”）Nyoman 的热烈欢迎。在这里，您可以与日本和国际朋友交流语言，当然，食物也非常美味。我们拥有深刻哲理的愿景和使命是：“最重要的是开心”。',
            transportation: '位于巴厘岛市中心。可搭乘出租车（距离机场15分钟路程）或10路公交车前往。',
            contact: '电话：+62 361 123456 | 电子邮件：info@balibong.com | 地址：Jl. Raya Bali Bong No. 88, Kuta, Bali',
            hours: '每天：11:00 - 23:00（截止点餐 22:30）'
          },
          ko: {
            about: '발리 봉의 콘셉트는 사랑받는 셰프 블리(발리어로 "형") 뇨만의 따뜻한 환영과 함께 모두가 모이는 장소입니다. 이곳에서 일본인 및 다국적 친구들과 언어를 교환할 수 있으며, 물론 음식도 아주 맛있습니다. 우리의 깊은 철학을 담은 비전과 미션은 "행복한 것이 가장 중요하다"입니다.',
            transportation: '발리 시내 중심부에 위치하고 있습니다. 택시(공항에서 15분 거리)나 10번 버스를 이용해 오실 수 있습니다.',
            contact: '전화번호: +62 361 123456 | 이메일: info@balibong.com | 주소: Jl. Raya Bali Bong No. 88, Kuta, Bali',
            hours: '매일: 11:00 - 23:00 (라스트 오더 22:30)'
          },
          es: {
            about: 'El concepto de Bali Bong es un lugar de encuentro para todos, con una cálida bienvenida por parte de nuestro querido chef Bli (hermano en balinés) Nyoman. Aquí puedes intercambiar idiomas con amigos japoneses e internacionales y, por supuesto, la comida es deliciosa. Nuestra visión y misión, que tiene una profunda filosofía, es: "Lo importante es ser feliz".',
            transportation: 'Ubicado en el centro de Bali Bong. Accesible en taxi (a 15 minutos del aeropuerto) o autobús línea 10.',
            contact: 'Teléfono: +62 361 123456 | Correo electrónico: info@balibong.com | Dirección: Jl. Raya Bali Bong No. 88, Kuta, Bali',
            hours: 'Todos los días: 11:00 - 23:00 (Último pedido 22:30)'
          }
        };
        this.restaurantInfo.set(mockFallback[lang] || mockFallback['id']);
      }
    });
  }
}
