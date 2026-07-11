import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageService, LanguageCode } from './language.service';

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
    <header class="main-header">
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

    <!-- Menu Title and Assets -->
    <section class="menu-hero">
      <div class="container animate-fade-in">
        <h1 class="menu-hero-title">{{ langService.t('menu_title') }}</h1>
        <p class="menu-hero-subtitle">Authentic Balinese & Indonesian Specialties</p>
      </div>
    </section>

    <!-- Main Content -->
    <main class="menu-content container">
      <!-- Category Tabs -->
      <div class="category-tabs-wrapper animate-fade-in stagger-1">
        <div class="category-tabs">
          <button 
            class="category-tab" 
            [class.active]="activeCategorySlug() === 'all'"
            (click)="setActiveCategory('all')"
          >
            <i class="fa-solid fa-border-all"></i>
            <span>{{ langService.t('all_categories') }}</span>
          </button>
          
          <button 
            *ngFor="let cat of categories()"
            class="category-tab"
            [class.active]="activeCategorySlug() === cat.slug"
            (click)="setActiveCategory(cat.slug)"
          >
            <i [class]="getCategoryIcon(cat.slug)"></i>
            <span>{{ cat.name }}</span>
          </button>
        </div>
      </div>

      <!-- Recommended Section Spotlight (Only visible when "All" or "Rekomendasi" is selected) -->
      <div class="spotlight-section animate-fade-in stagger-2" *ngIf="recommendedItems().length > 0 && (activeCategorySlug() === 'all' || activeCategorySlug() === 'rekomendasi')">
        <div class="spotlight-header">
          <i class="fa-solid fa-star gold-star animate-pop-in"></i>
          <h2>{{ langService.t('recommended_label') }}</h2>
        </div>
        
        <div class="menu-grid spotlight-grid">
          <div 
            *ngFor="let item of recommendedItems(); let idx = index" 
            class="menu-card spotlight-card card scroll-reveal"
            [class.sold-out-card]="!item.is_available"
            (click)="openItemDetail(item)"
            style="cursor: pointer;"
          >
            <div class="card-image-placeholder" [style.background-image]="item.image_url ? 'url(' + item.image_url + ')' : null" [style.background-size]="'cover'" [style.background-position]="'center'">
              <i *ngIf="!item.image_url" [class]="getFoodPlaceholderIcon(item.category_slug)"></i>
              <span class="recommended-badge" *ngIf="item.is_recommended">
                <i class="fa-solid fa-star"></i>
              </span>
              <span class="sold-out-badge" *ngIf="!item.is_available">
                {{ langService.t('sold_out') }}
              </span>
            </div>
            <div class="card-details">
              <div class="card-header-row">
                <h3 class="item-name">{{ item.name }}</h3>
                <span class="item-price">¥ {{ formatPrice(item.price) }}</span>
              </div>
              <p class="item-desc">{{ item.description }}</p>
              <div class="allergy-info" *ngIf="item.allergy_info">
                <i class="fa-solid fa-triangle-exclamation"></i> Alergi: {{ item.allergy_info }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Regular Menu Grid -->
      <div class="menu-list-section animate-fade-in stagger-3">
        <h2 class="grid-title" *ngIf="activeCategorySlug() !== 'all'">
          {{ getActiveCategoryName() }}
        </h2>
        <h2 class="grid-title" *ngIf="activeCategorySlug() === 'all'">
          {{ langService.t('all_categories') }}
        </h2>

        <div class="menu-grid" *ngIf="filteredItems().length > 0; else noItemsTemp">
          <div 
            *ngFor="let item of filteredItems(); let idx = index" 
            class="menu-card card scroll-reveal"
            [class.sold-out-card]="!item.is_available"
            (click)="openItemDetail(item)"
            style="cursor: pointer;"
          >
            <div class="card-image-placeholder" [style.background-image]="item.image_url ? 'url(' + item.image_url + ')' : null" [style.background-size]="'cover'" [style.background-position]="'center'">
              <i *ngIf="!item.image_url" [class]="getFoodPlaceholderIcon(item.category_slug)"></i>
              <span class="recommended-badge" *ngIf="item.is_recommended">
                <i class="fa-solid fa-star"></i>
              </span>
              <span class="sold-out-badge" *ngIf="!item.is_available">
                {{ langService.t('sold_out') }}
              </span>
            </div>
            <div class="card-details">
              <div class="card-header-row">
                <h3 class="item-name">{{ item.name }}</h3>
                <span class="item-price">¥ {{ formatPrice(item.price) }}</span>
              </div>
              <p class="item-desc">{{ item.description }}</p>
              <div class="allergy-info" *ngIf="item.allergy_info">
                <i class="fa-solid fa-triangle-exclamation"></i> Alergi: {{ item.allergy_info }}
              </div>
            </div>
          </div>
        </div>
      </div>
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
          <p>Setiap Hari: 11:00 - 23:00 (Pemesanan Terakhir 22:30)</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Bali Bong. {{ langService.t('all_rights') }}</p>
      </div>
    </footer>
  `,
  styles: [`
    .menu-hero {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
      color: var(--text-light);
      padding: 60px 0 80px;
      text-align: center;
      position: relative;
    }
    .menu-hero-title {
      font-size: 3rem;
      font-weight: 800;
      color: var(--text-light);
      margin-bottom: 8px;
    }
    .menu-hero-subtitle {
      font-size: 1.1rem;
      color: var(--secondary-color);
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 32px;
    }
    
    /* Category Tabs */
    .category-tabs-wrapper {
      margin: -30px auto 40px;
      position: sticky;
      top: 76px; /* Offset to stick exactly under the 76px tall main header */
      z-index: 90;
      max-width: 1000px;
      transition: all 0.3s ease;
    }
    .category-tabs {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 8px;
      background: rgba(255, 255, 255, 0.85); /* Glassmorphism */
      backdrop-filter: blur(12px);
      border-radius: 50px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1); /* Floating shadow */
      border: 1px solid rgba(125, 34, 17, 0.05);
      scrollbar-width: none; /* Firefox */
    }
    .category-tabs::-webkit-scrollbar {
      display: none; /* Safari and Chrome */
    }
    .category-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 40px;
      border: none;
      background: transparent;
      font-family: var(--font-sans);
      font-weight: 600;
      color: var(--primary-color);
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
    }
    .category-tab:hover {
      background: rgba(226, 109, 63, 0.1);
    }
    .category-tab.active {
      background: var(--primary-color);
      color: var(--text-light);
      box-shadow: 0 4px 15px rgba(125, 34, 17, 0.2);
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

    .menu-card {
      background: var(--surface-light);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      box-shadow: var(--box-shadow);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      height: 100%;
      border: 1px solid rgba(0,0,0,0.03);
      position: relative;
    }
    .menu-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: inherit;
      box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0);
      transition: all 0.4s ease;
      pointer-events: none;
      z-index: 5;
    }
    .menu-card:hover {
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 20px 40px rgba(125, 34, 17, 0.2);
    }
    .menu-card:hover::before {
      box-shadow: inset 0 0 0 2px rgba(226, 109, 63, 0.4);
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

    /* Spotlights / Recommendations */
    .spotlight-section {
      background: rgba(226, 109, 63, 0.06);
      border-radius: var(--border-radius-lg);
      padding: 40px 32px;
      margin-bottom: 56px;
      border: 1px dashed rgba(226, 109, 63, 0.3);
    }
    .spotlight-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }
    .gold-star {
      color: var(--secondary-color);
      font-size: 1.6rem;
    }
    .spotlight-header h2 {
      font-size: 1.6rem;
      color: var(--primary-color);
    }

    /* Menu Cards */
    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 28px;
    }
    .menu-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--surface-light);
    }
    .card-image-placeholder {
      height: 180px;
      background: linear-gradient(135deg, #F9F7F2 0%, #EFEBE0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3.5rem;
      color: var(--primary-color);
      position: relative;
      transition: var(--transition);
      border-bottom: 1px solid rgba(0,0,0,0.03);
    }
    .menu-card:hover .card-image-placeholder {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
      color: var(--secondary-color);
    }
    .recommended-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 36px;
      height: 36px;
      background: var(--secondary-color);
      color: var(--primary-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .sold-out-badge {
      position: absolute;
      top: 16px;
      left: 16px;
      background: var(--accent-color);
      color: var(--text-light);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .card-details {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .item-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--primary-color);
      line-height: 1.3;
    }
    .item-price {
      font-family: var(--font-sans);
      font-weight: 700;
      color: var(--secondary-dark);
      font-size: 1.05rem;
      white-space: nowrap;
    }
    .item-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-top: auto;
    }
    
    /* Sold out state */
    .sold-out-card {
      opacity: 0.65;
    }
    .sold-out-card .card-image-placeholder {
      filter: grayscale(1);
    }

    .allergy-info {
      margin-top: 12px;
      font-size: 0.8rem;
      color: #e74c3c;
      background: rgba(231, 76, 60, 0.1);
      padding: 6px 10px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
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
      .spotlight-section {
        padding: 24px 16px;
        margin-bottom: 40px;
      }
      .spotlight-header h2 {
        font-size: 1.3rem;
      }
      .menu-grid {
        gap: 20px;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }
      .card-image-placeholder {
        height: 140px;
        font-size: 2.8rem;
      }
      .card-details {
        padding: 16px;
      }
      .item-name {
        font-size: 1rem;
      }
      .item-price {
        font-size: 0.95rem;
      }
      .item-desc {
        font-size: 0.82rem;
      }
    }
    
    @media (max-width: 480px) {
      .menu-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .menu-card {
        flex-direction: row;
        height: 130px;
        align-items: center;
      }
      .card-image-placeholder {
        width: 130px;
        height: 100%;
        border-bottom: none;
        border-right: 1px solid rgba(0,0,0,0.03);
        flex-shrink: 0;
        font-size: 2.2rem;
      }
      .card-details {
        padding: 12px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .card-header-row {
        flex-direction: column;
        gap: 4px;
        margin-bottom: 6px;
        align-items: flex-start;
      }
      .item-name {
        font-size: 1.05rem;
      }
      .item-price {
        font-size: 0.95rem;
      }
      .item-desc {
        font-size: 0.8rem;
        -webkit-line-clamp: 2;
      }
      .recommended-badge {
        width: 24px;
        height: 24px;
        font-size: 0.65rem;
        top: 8px;
        right: 8px;
      }
      .sold-out-badge {
        top: 8px;
        left: 8px;
        padding: 2px 6px;
        font-size: 0.6rem;
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
      background: rgba(0, 0, 0, 0.7);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
      animation: fadeIn 0.3s ease forwards;
    }
    
    .modal-card {
      background: #FFFFFF;
      border-radius: var(--border-radius-lg);
      position: relative;
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 30px 60px rgba(0,0,0,0.4);
      animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255,255,255,0.9);
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-dark);
      z-index: 10;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    }
    .close-btn:hover {
      background: var(--primary-color);
      color: white;
      transform: scale(1.1);
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
      font-size: 2rem;
      color: var(--primary-color);
      margin-bottom: 16px;
      line-height: 1.2;
    }
    
    .detail-price-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    
    .detail-price {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-dark);
    }
    
    .detail-desc {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #555;
      margin-bottom: 32px;
    }
    
    .detail-allergy {
      background: #FFF4E5;
      border-left: 4px solid #E64C2E;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
    }
    .detail-allergy h4 {
      color: #D35400;
      font-size: 0.95rem;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .detail-allergy p {
      color: #D35400;
      font-size: 0.9rem;
      margin: 0;
    }
    
    .status-badge {
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: bold;
    }
    .badge-available {
      background: #E8F5E9;
      color: #2E7D32;
    }
    .badge-unavailable {
      background: #FFEBEE;
      color: #C62828;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.95) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class MenuComponent implements OnInit {
  langService = inject(LanguageService);
  private readonly http = inject(HttpClient);
  
  langOpen = signal(false);

  readonly categories = signal<Category[]>([]);
  readonly menuItems = signal<MenuItem[]>([]);
  readonly activeCategorySlug = signal<string>('all');
  readonly designSettings = signal<any>(null);
  readonly selectedItem = signal<MenuItem | null>(null);

  private observer: any = null;

  // Auto reload when language changes
  constructor() {
    effect(() => {
      this.fetchMenu(this.langService.currentLang());
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

  ngOnInit() {
    this.fetchDesignSettings();
  }

  fetchDesignSettings() {
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
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

  getCategoryIcon(slug: string): string {
    const icons: Record<string, string> = {
      makanan_berat: 'fa-solid fa-bowl-food',
      makanan_sayur: 'fa-solid fa-leaf',
      manisan: 'fa-solid fa-ice-cream',
      ala_carte: 'fa-solid fa-plate-wheat',
      rekomendasi: 'fa-solid fa-award',
      soft_drink: 'fa-solid fa-glass-water',
      beer: 'fa-solid fa-beer-mug-empty',
      cocktail: 'fa-solid fa-martini-glass-citrus'
    };
    return icons[slug] || 'fa-solid fa-utensils';
  }

  getFoodPlaceholderIcon(slug: string): string {
    const icons: Record<string, string> = {
      makanan_berat: 'fa-solid fa-bowl-rice',
      makanan_sayur: 'fa-solid fa-carrot',
      manisan: 'fa-solid fa-cookie-bite',
      ala_carte: 'fa-solid fa-egg',
      rekomendasi: 'fa-solid fa-fire',
      soft_drink: 'fa-solid fa-bottle-water',
      beer: 'fa-solid fa-wine-bottle',
      cocktail: 'fa-solid fa-martini-glass'
    };
    return icons[slug] || 'fa-solid fa-shrimp';
  }

  private fetchMenu(lang: LanguageCode) {
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
    this.http.get<{ categories: Category[], items: MenuItem[] }>(`${apiBase}/menu?lang=${lang}`).subscribe({
      next: (data) => {
        this.categories.set(data.categories || []);
        this.menuItems.set(data.items || []);
      },
      error: (err) => {
        console.error('Error fetching menu from backend, falling back to local client seed data', err);
        // Fallback static data if backend not active
        this.categories.set([
          { id: 1, slug: 'makanan_berat', name: this.langService.t('makanan_berat') || 'Makanan Berat' },
          { id: 2, slug: 'makanan_sayur', name: this.langService.t('makanan_sayur') || 'Makanan Sayur' },
          { id: 3, slug: 'manisan', name: this.langService.t('manisan') || 'Manisan' },
          { id: 4, slug: 'ala_carte', name: this.langService.t('ala_carte') || 'Ala Carte' },
          { id: 5, slug: 'rekomendasi', name: this.langService.t('rekomendasi') || 'Rekomendasi' },
          { id: 6, slug: 'soft_drink', name: 'Minuman Ringan' },
          { id: 7, slug: 'beer', name: 'Bir' },
          { id: 8, slug: 'cocktail', name: 'Koktail' }
        ]);

        const mockItems: MenuItem[] = [
          { id: 1, category_id: 1, price: 1280, image_url: null, allergy_info: null, is_recommended: false, is_available: true, name: 'Bali Spicy Chicken', description: 'Chicken prepared with hot Balinese spices.', category_slug: 'makanan_berat' },
          { id: 2, category_id: 1, price: 1180, image_url: null, allergy_info: null, is_recommended: false, is_available: true, name: 'Ayam dan Tempe Goreng', description: 'Fried chicken served with traditional soybean cake.', category_slug: 'makanan_berat' },
          { id: 4, category_id: 1, price: 1280, image_url: null, allergy_info: null, is_recommended: false, is_available: true, name: 'Ayam Geprek', description: 'Crushed crispy fried chicken mixed with hot sambal.', category_slug: 'makanan_berat' },
          { id: 92, category_id: 1, price: 1180, image_url: null, allergy_info: null, is_recommended: false, is_available: true, name: 'Nasi Goreng', description: 'Traditional Indonesian fried rice.', category_slug: 'makanan_berat' },
          { id: 93, category_id: 1, price: 1180, image_url: null, allergy_info: null, is_recommended: false, is_available: true, name: 'Mie Goreng', description: 'Flavorful Indonesian fried noodles.', category_slug: 'makanan_berat' },
          { id: 131, category_id: 2, price: 880, image_url: null, allergy_info: null, is_recommended: false, is_available: true, name: 'Gado-Gado', description: 'Indonesian mixed salad with peanut sauce.', category_slug: 'makanan_sayur' },
          { id: 134, category_id: 2, price: 980, image_url: null, allergy_info: null, is_recommended: false, is_available: true, name: 'Tumis Kangkung', description: 'Stir-fried water spinach with garlic.', category_slug: 'makanan_sayur' },
          { id: 141, category_id: 3, price: 550, image_url: null, allergy_info: null, is_recommended: false, is_available: true, name: 'Pisang Goreng (dengan es krim)', description: 'Crispy fried banana served with vanilla ice cream.', category_slug: 'manisan' },
          { id: 162, category_id: 5, price: 1600, image_url: null, allergy_info: null, is_recommended: true, is_available: true, name: 'Nasi Campur', description: 'Balinese mixed rice served with various side dishes.', category_slug: 'rekomendasi' },
          { id: 164, category_id: 5, price: 1500, image_url: null, allergy_info: null, is_recommended: true, is_available: true, name: 'Rendang', description: 'Slow cooked beef in rich coconut spice sauce.', category_slug: 'rekomendasi' }
        ];
        this.menuItems.set(mockItems);
      }
    });
  }
}
