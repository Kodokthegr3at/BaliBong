import { Component, OnInit, OnDestroy, inject, signal, effect, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { LanguageService, LanguageCode } from './language.service';
import { getApiBase } from './api-base';

interface Category {
  id: number;
  slug: string;
  name: string;
}

interface MenuItem {
  id: number;
  category_id: number;
  price: number;
  image_url: string | null;
  allergy_info: string | null;
  is_recommended: boolean;
  is_available: boolean;
  name: string;
  description: string;
  category_slug: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Header -->
    <header class="main-header" [class.header-scrolled]="headerScrolled()">
      <div class="container header-container">
        <a routerLink="/" class="logo">
          <img src="/public/images/assets/logo.png" alt="BALI BONG Logo" class="header-logo-img">
        </a>
        <nav class="nav-links">
          <a routerLink="/" class="nav-link">{{ langService.t('about_title') }}</a>
          <a routerLink="/menu" class="nav-link active">{{ langService.t('menu_title') }}</a>
          <a routerLink="/admin" class="nav-link"><i class="fa-solid fa-lock"></i></a>
          
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

    <!-- Menu Title -->
    <section class="menu-hero">
      <div class="container">
        <h1 class="menu-hero-title">{{ langService.t('menu_title') }}</h1>
        <p class="menu-hero-subtitle">{{ langService.t('hero_subtitle') }}</p>
      </div>
    </section>

    <!-- Main Content -->
    <main class="menu-content container">
      <!-- Loading state -->
      <div class="menu-status-state" *ngIf="menuLoading()">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>{{ langService.t('loading') }}</p>
      </div>

      <!-- Error state: never show fabricated menu data on a real failure -->
      <div class="menu-status-state menu-status-error" *ngIf="!menuLoading() && menuLoadError()">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>{{ langService.t('menu_error') }}</p>
        <button class="btn btn-primary btn-sm" (click)="retryFetchMenu()">
          <i class="fa-solid fa-rotate-right"></i> {{ langService.t('retry_button') }}
        </button>
      </div>

      <ng-container *ngIf="!menuLoading() && !menuLoadError()">
      <!-- Category Tabs -->
      <div class="category-tabs-wrapper">
        <div class="category-tabs">
          <button
            class="category-tab"
            [class.active]="activeCategorySlug() === 'all'"
            (click)="setActiveCategory('all')"
          >
            {{ langService.t('all_categories') }}
          </button>

          <button
            *ngFor="let cat of categories()"
            class="category-tab"
            [class.active]="activeCategorySlug() === cat.slug"
            (click)="setActiveCategory(cat.slug)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Recommended Spotlight: one feature photo + an elegant text list, not repeated placeholder cards -->
      <div class="spotlight-section scroll-reveal" *ngIf="recommendedItems().length > 0 && (activeCategorySlug() === 'all' || activeCategorySlug() === 'rekomendasi')">
        <div class="spotlight-header">
          <h2>{{ langService.t('recommended_label') }}</h2>
        </div>

        <div class="spotlight-layout">
          <div class="spotlight-photo">
            <img src="/public/images/assets/dish-featured.webp" alt="Hidangan rekomendasi Bali Bong">
          </div>
          <ul class="spotlight-list">
            <li *ngFor="let item of recommendedItems()" (click)="openItemDetail(item)" [class.sold-out-row]="!item.is_available">
              <div class="spotlight-list-row">
                <span class="spotlight-list-name">{{ item.name }}</span>
                <span class="spotlight-list-price">¥ {{ formatPrice(item.price) }}</span>
              </div>
              <p class="spotlight-list-desc">{{ item.description }}</p>
              <span class="sold-out-badge" *ngIf="!item.is_available">{{ langService.t('sold_out') }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Menu listing: typography-led rows, the standard format for a restaurant menu without a photo per dish -->
      <div class="menu-list-section scroll-reveal">
        <h2 class="grid-title" *ngIf="activeCategorySlug() !== 'all'">
          {{ getActiveCategoryName() }}
        </h2>
        <h2 class="grid-title" *ngIf="activeCategorySlug() === 'all'">
          {{ langService.t('all_categories') }}
        </h2>

        <ul class="menu-rows" *ngIf="filteredItems().length > 0; else noItemsTemp">
          <li
            *ngFor="let item of filteredItems()"
            class="menu-row"
            [class.sold-out-row]="!item.is_available"
            (click)="openItemDetail(item)"
          >
            <img *ngIf="item.image_url" [src]="item.image_url" class="menu-row-thumb" [alt]="item.name">
            <div class="menu-row-body">
              <div class="menu-row-top">
                <h3 class="menu-row-name">{{ item.name }}</h3>
                <span class="menu-row-dots"></span>
                <span class="menu-row-price">¥ {{ formatPrice(item.price) }}</span>
              </div>
              <p class="menu-row-desc">{{ item.description }}</p>
              <div class="menu-row-tags" *ngIf="item.is_recommended || !item.is_available || item.allergy_info">
                <span class="tag tag-rec" *ngIf="item.is_recommended"><i class="fa-solid fa-star"></i> {{ langService.t('recommended_label') }}</span>
                <span class="tag tag-soldout" *ngIf="!item.is_available">{{ langService.t('sold_out') }}</span>
                <span class="tag tag-allergy" *ngIf="item.allergy_info"><i class="fa-solid fa-triangle-exclamation"></i> {{ item.allergy_info }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
      </ng-container>
    </main>

    <ng-template #noItemsTemp>
      <div class="no-items">
        <i class="fa-solid fa-circle-info"></i>
        <p>Tidak ada hidangan yang cocok dengan filter atau pencarian Anda.</p>
      </div>
    </ng-template>

    <!-- Item Detail Modal -->
    <div class="modal-backdrop" *ngIf="selectedItem()" (click)="closeItemDetail()">
      <div class="modal-card detail-modal" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="closeItemDetail()"><i class="fa-solid fa-xmark"></i></button>
        
        <div class="detail-content">
          <div class="detail-image" [style.background-image]="selectedItem()?.image_url ? 'url(' + selectedItem()?.image_url + ')' : null" [style.background-size]="'cover'" [style.background-position]="'center'">
            <i *ngIf="!selectedItem()?.image_url" [class]="getFoodPlaceholderIcon(selectedItem()?.category_slug || '')"></i>
            <span class="recommended-badge" *ngIf="selectedItem()?.is_recommended">
              <i class="fa-solid fa-star"></i>
            </span>
          </div>
          
          <div class="detail-info">
            <h2 class="detail-title">{{ selectedItem()?.name }}</h2>
            <div class="detail-price-status">
              <span class="detail-price">¥ {{ formatPrice(selectedItem()?.price) }}</span>
              <span class="status-badge" [class.badge-available]="selectedItem()?.is_available" [class.badge-unavailable]="!selectedItem()?.is_available">
                {{ selectedItem()?.is_available ? 'Tersedia' : 'Habis' }}
              </span>
            </div>
            
            <p class="detail-desc">{{ selectedItem()?.description }}</p>
            
            <div class="detail-allergy" *ngIf="selectedItem()?.allergy_info">
              <h4><i class="fa-solid fa-triangle-exclamation"></i> Informasi Alergi</h4>
              <p>{{ selectedItem()?.allergy_info }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

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
          <p *ngIf="restaurantHours()">{{ restaurantHours() }}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Bali Bong. {{ langService.t('all_rights') }}</p>
      </div>
    </footer>
  `,
  styles: [`
    .menu-hero {
      padding: 56px 0 36px;
      text-align: center;
      border-bottom: 1px solid var(--line);
      margin-bottom: 32px;
    }
    .menu-hero-title {
      font-family: var(--font-display);
      font-size: 2.4rem;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 8px;
    }
    .menu-hero-subtitle {
      font-size: 0.8rem;
      color: var(--muted);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 600;
    }

    /* Category Tabs — flat underline tabs, no pills or glass blur */
    .category-tabs-wrapper {
      position: sticky;
      top: 60px;
      z-index: 90;
      background: var(--paper);
      border-bottom: 1px solid var(--line);
      margin-bottom: 40px;
    }
    .category-tabs {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .category-tabs::-webkit-scrollbar {
      display: none;
    }
    .category-tab {
      padding: 14px 16px;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--muted);
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
    }
    .category-tab:hover {
      color: var(--ink);
    }
    .category-tab.active {
      color: var(--ink);
      border-bottom-color: var(--accent);
    }

    .scroll-reveal {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
      will-change: opacity, transform;
    }
    .scroll-reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Content Area */
    .menu-content {
      min-height: 500px;
    }
    .grid-title {
      font-size: 1.8rem;
      margin-bottom: 24px;
      position: relative;
      display: inline-block;
    }
    .grid-title::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 0;
      width: 40px;
      height: 3px;
      background: var(--secondary-color);
    }

    /* Recommended spotlight: one real photo + an elegant text list */
    .spotlight-section {
      margin-bottom: 64px;
    }
    .spotlight-header {
      margin-bottom: 28px;
    }
    .spotlight-header h2 {
      font-size: 1.4rem;
      color: var(--ink);
    }
    .spotlight-layout {
      display: grid;
      grid-template-columns: 0.85fr 1.15fr;
      gap: 40px;
      align-items: stretch;
      border: 1px solid var(--line);
      overflow: hidden;
    }
    .spotlight-photo {
      min-height: 280px;
    }
    .spotlight-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .spotlight-list {
      list-style: none;
      padding: 32px 32px 32px 0;
      margin: 0;
    }
    .spotlight-list li {
      padding: 16px 0;
      border-bottom: 1px solid var(--line);
      cursor: pointer;
      transition: var(--transition);
    }
    .spotlight-list li:first-child { padding-top: 0; }
    .spotlight-list li:last-child { border-bottom: none; padding-bottom: 0; }
    .spotlight-list li:hover .spotlight-list-name { color: var(--accent); }
    .spotlight-list-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 16px;
    }
    .spotlight-list-name {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ink);
      transition: var(--transition);
    }
    .spotlight-list-price {
      font-weight: 700;
      color: var(--ink);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .spotlight-list-desc {
      margin-top: 4px;
      font-size: 0.9rem;
      color: var(--muted);
    }

    /* Menu listing: typography-led rows — the standard format for a menu
       without a photo per dish, rather than placeholder-icon cards. */
    .menu-rows {
      list-style: none;
      margin: 0;
      padding: 0;
      max-width: 780px;
    }
    .menu-row {
      display: flex;
      gap: 20px;
      padding: 22px 4px;
      border-bottom: 1px solid var(--line);
      cursor: pointer;
      transition: var(--transition);
    }
    .menu-row:first-child { padding-top: 4px; }
    .menu-row:hover {
      background: var(--paper-dim);
      padding-left: 16px;
      padding-right: 16px;
      margin: 0 -16px;
    }
    .menu-row-thumb {
      width: 68px;
      height: 68px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .menu-row-body {
      flex-grow: 1;
      min-width: 0;
    }
    .menu-row-top {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .menu-row-name {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--ink);
      white-space: nowrap;
    }
    .menu-row-dots {
      flex-grow: 1;
      border-bottom: 1px dotted var(--line);
      transform: translateY(-4px);
    }
    .menu-row-price {
      font-weight: 700;
      color: var(--ink);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .menu-row-desc {
      margin-top: 4px;
      font-size: 0.88rem;
      color: var(--muted);
      line-height: 1.5;
    }
    .menu-row-tags {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .tag {
      font-size: 0.74rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .tag-rec {
      color: var(--accent);
    }
    .tag-soldout {
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .tag-allergy {
      color: var(--muted);
    }
    .sold-out-row {
      opacity: 0.55;
    }

    .no-items {
      text-align: center;
      padding: 60px 0;
      color: var(--text-muted);
    }
    .no-items i {
      font-size: 2.5rem;
      margin-bottom: 16px;
    }

    .menu-status-state {
      text-align: center;
      padding: 100px 0;
      color: var(--text-muted);
    }
    .menu-status-state i {
      font-size: 2.5rem;
      margin-bottom: 16px;
      display: block;
      color: var(--primary-color);
    }
    .menu-status-state p {
      margin-bottom: 20px;
      font-size: 1.05rem;
    }
    .menu-status-error i {
      color: var(--accent-color);
    }

    @media (max-width: 768px) {
      .menu-hero {
        padding: 40px 0 60px;
      }
      .menu-hero-title {
        font-size: 2.2rem;
      }
      .menu-hero-subtitle {
        font-size: 0.95rem;
        margin-bottom: 24px;
      }
      .category-tabs-wrapper {
        margin: -20px auto 32px;
        padding: 0 16px;
        position: sticky;
        top: 60px; /* Offset for mobile header */
        z-index: 90;
      }
      .category-tabs {
        border-radius: 30px;
        padding: 6px;
      }
      .category-tab {
        padding: 10px 20px;
        font-size: 0.9rem;
      }
      .spotlight-header h2 {
        font-size: 1.3rem;
      }
      .spotlight-layout {
        grid-template-columns: 1fr;
      }
      .spotlight-photo {
        min-height: 200px;
      }
      .spotlight-list {
        padding: 24px 20px;
      }
      .menu-row {
        padding: 18px 2px;
        gap: 14px;
      }
      .menu-row-thumb {
        width: 56px;
        height: 56px;
      }
      .menu-row-name {
        font-size: 1rem;
      }
      .menu-row-price {
        font-size: 0.95rem;
      }
      .menu-row-desc {
        font-size: 0.84rem;
      }
    }

    @media (max-width: 480px) {
      .menu-row-top, .spotlight-list-row {
        flex-wrap: wrap;
      }
      .menu-row-name, .spotlight-list-name {
        white-space: normal;
      }
      .menu-row-dots {
        display: none;
      }
      .detail-modal {
        padding: 0;
        width: 100%;
        height: 100%;
        max-height: 100vh;
        border-radius: 0;
        display: flex;
        flex-direction: column;
      }
      .detail-content {
        flex-direction: column;
      }
      .detail-image {
        width: 100%;
        height: 300px;
        border-radius: 0;
      }
      .detail-info {
        padding: 24px;
      }
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(28, 26, 23, 0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-card {
      background: var(--surface);
      border: 1px solid var(--line);
      position: relative;
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: var(--surface);
      border: 1px solid var(--line);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      cursor: pointer;
      color: var(--ink);
      z-index: 10;
      transition: var(--transition);
    }
    .close-btn:hover {
      border-color: var(--ink);
    }
    
    .detail-content {
      display: flex;
      flex-direction: column;
    }
    
    @media (min-width: 768px) {
      .detail-content {
        flex-direction: row;
      }
      .detail-image {
        width: 45%;
        min-height: 400px;
      }
      .detail-info {
        width: 55%;
        padding: 40px 32px;
      }
    }
    
    .detail-image {
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 5rem;
      color: #ddd;
      position: relative;
      height: 300px;
    }
    
    .detail-info {
      padding: 32px 24px;
    }
    
    .detail-title {
      font-size: 1.8rem;
      color: var(--ink);
      margin-bottom: 16px;
      line-height: 1.2;
    }

    .detail-price-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--line);
    }

    .detail-price {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--ink);
    }

    .detail-desc {
      font-size: 1.05rem;
      line-height: 1.8;
      color: var(--muted);
      margin-bottom: 32px;
    }

    .detail-allergy {
      border-left: 2px solid var(--accent);
      padding: 12px 16px;
    }
    .detail-allergy h4 {
      color: var(--ink);
      font-size: 0.9rem;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .detail-allergy p {
      color: var(--muted);
      font-size: 0.9rem;
      margin: 0;
    }

    .status-badge {
      font-size: 0.85rem;
      font-weight: 600;
    }
    .badge-available {
      color: var(--accent);
    }
    .badge-unavailable {
      color: var(--muted);
    }
  `]
})
export class MenuComponent implements OnInit, OnDestroy {
  langService = inject(LanguageService);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  langOpen = signal(false);

  readonly categories = signal<Category[]>([]);
  readonly menuItems = signal<MenuItem[]>([]);
  readonly activeCategorySlug = signal<string>('all');
  readonly designSettings = signal<any>(null);
  readonly selectedItem = signal<MenuItem | null>(null);
  readonly menuLoading = signal<boolean>(true);
  readonly menuLoadError = signal<boolean>(false);
  readonly restaurantHours = signal<string>('');

  private observer: any = null;

  // Auto reload when language changes — browser only, since the backend
  // isn't reachable during build-time prerendering and baking a failed
  // fetch into the static HTML flashes an error state before hydration.
  constructor() {
    effect(() => {
      const lang = this.langService.currentLang();
      if (this.isBrowser) {
        this.fetchMenu(lang);
        this.fetchHours(lang);
      }
    });

    // Keep the page title and meta description in sync with the active language
    effect(() => {
      const title = this.langService.t('menu_seo_title');
      const description = this.langService.t('menu_seo_desc');
      this.titleService.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
    });

    // Re-attach observer whenever items list changes
    effect(() => {
      const slug = this.activeCategorySlug();
      const items = this.filteredItems();
      const recs = this.recommendedItems();
      if (typeof window !== 'undefined') {
        setTimeout(() => this.setupScrollObserver(), 50); // Wait for DOM render
      }
    });
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

  readonly headerScrolled = signal(false);
  private onWindowScroll = () => {
    this.headerScrolled.set(window.scrollY > 24);
  };

  ngOnInit() {
    this.fetchDesignSettings();
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onWindowScroll, { passive: true });
      this.onWindowScroll();
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onWindowScroll);
    }
  }

  fetchDesignSettings() {
    const apiBase = getApiBase();
    this.http.get<any>(`${apiBase}/admin/design`).subscribe({
      next: (data) => this.designSettings.set(data),
      error: (err) => console.error('Error fetching design', err)
    });
  }

  selectLanguage(lang: LanguageCode) {
    this.langService.setLanguage(lang);
    this.langOpen.set(false);
  }

  setActiveCategory(slug: string) {
    this.activeCategorySlug.set(slug);
  }

  getActiveCategoryName(): string {
    const slug = this.activeCategorySlug();
    if (slug === 'all') return this.langService.t('all_categories');
    return this.categories().find(c => c.slug === slug)?.name || slug;
  }

  // Filter items dynamically based on category
  readonly filteredItems = computed(() => {
    let items = this.menuItems();
    const activeSlug = this.activeCategorySlug();

    // Filter by Category
    if (activeSlug !== 'all') {
      if (activeSlug === 'rekomendasi') {
        items = items.filter(i => i.is_recommended);
      } else {
        items = items.filter(i => i.category_slug === activeSlug);
      }
    }

    return items;
  });

  // Recommended items spotlight list
  readonly recommendedItems = computed(() => {
    return this.menuItems().filter(i => i.is_recommended);
  });

  formatPrice(price: number | undefined | null): string {
    if (price === undefined || price === null) return '0';
    // Standard IDR format. In Indonesian PRD, e.g. 1.280 which represents 1,280 JPY (but stated as IDR 1.280, representing 1.280 k IDR or JPY equivalent. Let's format it as is with dot grouping, e.g. 990 or 1.280).
    return price.toLocaleString('id-ID');
  }

  openItemDetail(item: MenuItem) {
    this.selectedItem.set(item);
  }

  closeItemDetail() {
    this.selectedItem.set(null);
  }

  getFoodPlaceholderIcon(slug: string): string {
    const icons: Record<string, string> = {
      makanan_berat: 'fa-solid fa-bowl-rice',
      makanan_sayur: 'fa-solid fa-carrot',
      manisan: 'fa-solid fa-cookie-bite',
      ala_carte: 'fa-solid fa-egg',
      rekomendasi: 'fa-solid fa-fire',
      minuman_ringan: 'fa-solid fa-bottle-water',
      bir: 'fa-solid fa-wine-bottle',
      koktail: 'fa-solid fa-martini-glass'
    };
    return icons[slug] || 'fa-solid fa-shrimp';
  }

  private fetchMenu(lang: LanguageCode) {
    this.menuLoading.set(true);
    this.menuLoadError.set(false);
    const apiBase = getApiBase();
    this.http.get<{ categories: Category[], items: MenuItem[] }>(`${apiBase}/menu?lang=${lang}`).subscribe({
      next: (data) => {
        this.categories.set(data.categories || []);
        this.menuItems.set(data.items || []);
        this.menuLoading.set(false);
      },
      error: (err) => {
        // Never show fabricated menu data to a real customer: prices and
        // availability here are what someone orders and pays for, so a
        // failed fetch must surface as an error state, not silent mock data.
        console.error('Error fetching menu from backend', err);
        this.menuLoading.set(false);
        this.menuLoadError.set(true);
      }
    });
  }

  retryFetchMenu() {
    this.fetchMenu(this.langService.currentLang());
  }

  private fetchHours(lang: LanguageCode) {
    const apiBase = getApiBase();
    this.http.get<{ hours?: string }>(`${apiBase}/restaurant-info?lang=${lang}`).subscribe({
      next: (data) => this.restaurantHours.set(data.hours || ''),
      error: (err) => console.error('Error fetching restaurant hours', err)
    });
  }
}
