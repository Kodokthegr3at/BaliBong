import { Component, OnInit, OnDestroy, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { LanguageService, LanguageCode } from './language.service';
import { getApiBase } from './api-base';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Header with Language Switcher -->
    <header class="main-header" [class.header-scrolled]="headerScrolled()">
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
              <span>{{ langService.currentLangCode() }}</span>
              <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="lang-dropdown" [class.open]="langOpen()">
              <button
                *ngFor="let lang of langService.languages"
                class="lang-option"
                [class.active]="langService.currentLang() === lang.code"
                (click)="selectLanguage(lang.code)"
              >
                <span>{{ lang.name }}</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <!-- Hero Section: photo and text kept separate so neither needs a scrim -->
    <section class="hero-section">
      <div class="hero-photo">
        <img src="/public/images/assets/storefront.webp" alt="Bali Bong, Osaka">
      </div>
      <div class="container hero-content">
        <img src="/public/images/assets/logo2.png" alt="BALI BONG" class="hero-mark">
        <span class="hero-subtitle">{{ langService.t('hero_subtitle') }}</span>
        <h1 class="hero-headline">{{ langService.t('hero_desc') }}</h1>
        <div class="hero-actions">
          <a routerLink="/menu" class="btn btn-primary">
            {{ langService.t('view_menu') }}
          </a>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="section about-section" id="about">
      <div class="container">
        <div class="section-grid">
          <div class="about-text-wrapper scroll-reveal">
            <span class="section-tag">{{ langService.t('concept_story') }}</span>
            <h2 class="section-title">{{ langService.t('about_title') }}</h2>
            <div class="divider"></div>
            <p class="about-content" *ngIf="restaurantInfo().about; else loadingTemp">
              {{ restaurantInfo().about }}
            </p>
          </div>
          <div class="about-photo-collage scroll-reveal">
            <img src="/public/images/assets/interior-bar.webp" alt="Interior Bali Bong" class="collage-photo collage-photo-main">
            <img src="/public/images/assets/interior-dining.webp" alt="Ruang makan Bali Bong" class="collage-photo collage-photo-accent">
          </div>
        </div>
      </div>
    </section>
 
    <!-- Transport & Hours Grid -->
    <section class="section info-section">
      <div class="container">
        <div class="info-grid">
          <!-- Hours & Location -->
          <div class="info-card glass-panel scroll-reveal">
            <h3>{{ langService.t('hours_title') }}</h3>
            <p class="info-details" *ngIf="restaurantInfo().hours; else loadingTemp">
              {{ restaurantInfo().hours }}
            </p>
          </div>
 
          <!-- Transport -->
          <div class="info-card glass-panel scroll-reveal">
            <h3>{{ langService.t('transport_title') }}</h3>
            <p class="info-details" *ngIf="restaurantInfo().transportation; else loadingTemp">
              {{ restaurantInfo().transportation }}
            </p>
          </div>
 
          <!-- Contact -->
          <div class="info-card glass-panel scroll-reveal">
            <h3>{{ langService.t('contact_title') }}</h3>
            <p class="info-details" *ngIf="restaurantInfo().contact; else loadingTemp">
              {{ restaurantInfo().contact }}
            </p>
          </div>
        </div>

        <div class="location-review-wrapper scroll-reveal">
          <!-- Reviews Panel -->
          <div class="review-panel glass-panel">
            <h3 class="review-title">{{ langService.t('reviews_title') }}</h3>

            <div class="review-score-box">
              <div class="score-number">3.41</div>
              <div class="score-source">{{ langService.t('review_source') }}</div>
            </div>

            <p class="review-features">{{ langService.t('feature_curry') }}, {{ langService.t('feature_family') }}, {{ langService.t('feature_solo') }}</p>

            <p class="review-quote">{{ langService.t('review_quote') }}</p>

            <a href="https://maps.google.com/?q=バリボン+我孫子+大阪" target="_blank" class="btn btn-primary btn-map-link">
              <i class="fa-solid fa-location-arrow"></i> {{ langService.t('map_button') }}
            </a>
          </div>

          <!-- Map Panel -->
          <div class="map-container glass-panel" style="padding: 0; overflow: hidden; height: 100%; min-height: 400px;">
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
      <div class="loading-placeholder" *ngIf="!infoLoadError()">
        <i class="fa-solid fa-spinner fa-spin"></i> {{ langService.t('loading') }}
      </div>
      <div class="loading-placeholder loading-error" *ngIf="infoLoadError()">
        <i class="fa-solid fa-triangle-exclamation"></i> {{ langService.t('info_error') }}
        <button class="btn btn-outline btn-sm" (click)="fetchInfo(langService.currentLang())">
          <i class="fa-solid fa-rotate-right"></i> {{ langService.t('retry_button') }}
        </button>
      </div>
    </ng-template>

    <!-- Footer -->
    <footer>
      <div class="container footer-grid">
        <div class="footer-info">
          <h3>BALI BONG</h3>
          <p>{{ langService.t('footer_tagline') }}</p>
        </div>
        <div class="footer-links">
          <h4>{{ langService.t('footer_nav_title') }}</h4>
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
    
    /* Hero: a contained photo band, then quiet text on plain paper below it —
       no overlay/gradient/vignette needed since text never sits on the image. */
    .hero-photo {
      height: 58vh;
      min-height: 420px;
      max-height: 620px;
      overflow: hidden;
    }
    /* The source photo is portrait (taller than wide). A vh-based height
       tracks the VIEWPORT's aspect ratio, not the photo's — on a wide
       1080p+ monitor that meant a short, very wide crop window showing only
       a thin sliver of the image (the sign cut in half, mostly empty wall
       visible). aspect-ratio ties the crop to the photo's own proportions
       instead, so it stays a consistent, sane composition at any width. */
    @media (min-width: 1200px) {
      .hero-photo {
        height: auto;
        aspect-ratio: 2.1 / 1;
        max-height: 900px;
      }
    }
    .hero-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 30%;
      display: block;
    }
    .hero-content {
      text-align: center;
      max-width: 640px;
      margin: 0 auto;
      padding: 56px 24px 64px;
    }
    .hero-mark {
      display: block;
      height: 110px;
      width: auto;
      object-fit: contain;
      margin: 0 auto 28px auto;
    }
    .hero-subtitle {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--muted);
      font-weight: 600;
      display: block;
      margin-bottom: 18px;
    }
    .hero-headline {
      font-family: var(--font-display);
      font-style: italic;
      font-weight: 400;
      font-size: clamp(1.4rem, 3vw, 2rem);
      line-height: 1.55;
      margin-bottom: 36px;
      color: var(--ink);
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
    .about-photo-collage {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .collage-photo {
      display: block;
      width: 100%;
      height: 220px;
      object-fit: cover;
      border: 1px solid var(--line);
    }
    .collage-photo-accent {
      margin-top: 24px;
    }

    /* Scroll-triggered reveal, mirrors the menu page's pattern */
    .scroll-reveal {
      opacity: 0;
      transform: translateY(32px);
      transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity, transform;
    }
    .scroll-reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Info Cards */
    .info-section {
      background: var(--paper-dim);
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
      gap: 32px;
    }
    .info-card {
      padding: 36px 32px;
      text-align: left;
      transition: var(--transition);
      height: 100%;
      background: var(--surface);
      border: 1px solid var(--line);
    }
    .info-card:hover {
      border-color: var(--accent);
    }
    .info-card h3 {
      font-size: 1rem;
      font-family: var(--font-sans);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted);
      margin-bottom: 12px;
    }
    .info-details {
      color: var(--ink);
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
      padding: 36px 32px;
      background: var(--surface);
      display: flex;
      flex-direction: column;
      border: 1px solid var(--line);
    }
    .review-title {
      font-size: 1.15rem;
      margin-bottom: 24px;
      color: var(--ink);
    }
    .review-score-box {
      padding-bottom: 20px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .score-number {
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 700;
      color: var(--accent-green);
      line-height: 1;
    }
    .score-source {
      font-size: 0.82rem;
      color: var(--muted);
    }
    .review-features {
      font-size: 0.88rem;
      color: var(--muted);
      margin-bottom: 24px;
    }
    .review-quote {
      font-style: italic;
      font-family: var(--font-display);
      color: var(--ink);
      font-size: 1rem;
      line-height: 1.6;
      padding-left: 16px;
      border-left: 2px solid var(--accent);
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
    }
    @media (max-width: 768px) {
      .hero-photo {
        height: 42vh;
        min-height: 280px;
      }
      .hero-content {
        padding: 40px 24px 48px;
      }
      .hero-mark {
        height: 76px;
        margin: 0 auto 20px auto;
      }
      .hero-headline {
        font-size: 1.15rem;
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
export class HomeComponent implements OnInit, OnDestroy {
  langService = inject(LanguageService);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

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
    // Re-fetch when language changes — browser only, since the backend
    // isn't reachable during build-time prerendering and baking a failed
    // fetch into the static HTML causes a stale error state after hydration.
    effect(() => {
      const lang = this.langService.currentLang();
      if (this.isBrowser) {
        this.fetchInfo(lang);
      }
    });

    // Keep the page title and meta description in sync with the active language
    effect(() => {
      const title = `BALI BONG — ${this.langService.t('hero_subtitle')}`;
      const description = this.langService.t('hero_desc');
      this.titleService.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
    });
  }

  private observer: any = null;

  readonly headerScrolled = signal(false);
  private onWindowScroll = () => {
    this.headerScrolled.set(window.scrollY > 24);
  };

  ngOnInit() {
    if (typeof window !== 'undefined') {
      setTimeout(() => this.setupScrollObserver(), 50); // Wait for DOM render
      window.addEventListener('scroll', this.onWindowScroll, { passive: true });
      this.onWindowScroll();
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onWindowScroll);
    }
  }

  setupScrollObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    if (!this.observer) {
      this.observer = new IntersectionObserver((entries) => {
        let delay = 0;
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('is-visible');
            }, delay);
            delay += 80; // Staggered delay for elements entering together
            this.observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    }

    document.querySelectorAll('.scroll-reveal:not(.is-visible)').forEach(el => {
      this.observer.observe(el);
    });
  }

  selectLanguage(lang: LanguageCode) {
    this.langService.setLanguage(lang);
    this.langOpen.set(false);
  }

  readonly infoLoadError = signal<boolean>(false);

  fetchInfo(lang: LanguageCode) {
    this.infoLoadError.set(false);
    const apiBase = getApiBase();
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
        // Never substitute fabricated restaurant info (wrong address, wrong
        // phone number, wrong hours) for a real failed fetch — a customer
        // could show up when the restaurant is actually closed.
        console.error('Error fetching restaurant info', err);
        this.infoLoadError.set(true);
      }
    });
  }
}
