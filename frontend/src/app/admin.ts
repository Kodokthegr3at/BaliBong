import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LanguageService, LanguageCode } from './language.service';

interface QrCode {
  id: number;
  table_label: string;
  target_url: string;
  qr_image_url: string;
  created_at: string;
}

interface AdminMenuItem {
  id?: number;
  category_id: number;
  price: number;
  image_url: string | null;
  allergy_info?: string | null;
  is_recommended: boolean;
  is_available: boolean;
  name_id?: string;
  desc_id?: string;
  name_ja?: string;
  desc_ja?: string;
  name_zh?: string;
  desc_zh?: string;
  name_ko?: string;
  desc_ko?: string;
  name_es?: string;
  desc_es?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Header -->
    <header class="main-header">
      <div class="container header-container">
        <a routerLink="/" class="logo">
          <img src="/public/images/assets/logo.png" alt="BALI BONG Logo" class="header-logo-img">
        </a>
        <nav class="nav-links">
          <a routerLink="/" class="nav-link">{{ langService.t('about_title') }}</a>
          <a routerLink="/menu" class="nav-link">{{ langService.t('menu_title') }}</a>
          <a routerLink="/admin" class="nav-link active"><i class="fa-solid fa-lock"></i></a>
          
          <button *ngIf="isLoggedIn()" (click)="logout()" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-right-from-bracket"></i> {{ langService.t('admin_logout') }}
          </button>
        </nav>
      </div>
    </header>

    <main class="admin-main container">
      <!-- 1. LOGIN SCREEN -->
      <div class="login-wrapper" *ngIf="!isLoggedIn()">
        <div class="login-card glass-panel">
          <div class="login-header">
            <i class="fa-solid fa-shield-halved login-icon"></i>
            <h2>{{ langService.t('admin_login') }}</h2>
            <p>Akses khusus pengelola restoran Bali Bong</p>
          </div>
          
          <form (submit)="login($event)" class="login-form">
            <div class="form-group">
              <label for="email">{{ langService.t('email_placeholder') }}</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                [(ngModel)]="loginEmail" 
                [placeholder]="langService.t('email_placeholder')" 
                required
              />
            </div>
            
            <div class="form-group">
              <label for="password">{{ langService.t('password_placeholder') }}</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                [(ngModel)]="loginPassword" 
                [placeholder]="langService.t('password_placeholder')" 
                required
              />
            </div>
            
            <div class="error-message" *ngIf="loginError()">
              <i class="fa-solid fa-circle-exclamation"></i> {{ loginError() }}
            </div>
            
            <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
              <span *ngIf="loading()"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</span>
              <span *ngIf="!loading()">{{ langService.t('login_btn') }}</span>
            </button>
          </form>
        </div>
      </div>

      <!-- 2. ADMIN PANEL DASHBOARD -->
      <div class="dashboard-wrapper" *ngIf="isLoggedIn()">
        <div class="dashboard-header">
          <h1>{{ langService.t('admin_panel') }}</h1>
          <p>Kelola menu digital, info restoran, dan generator QR Code meja.</p>
        </div>

        <!-- Tab Links -->
        <div class="tab-links">
          <button class="tab-link" [class.active]="activeTab() === 'info'" (click)="activeTab.set('info')">
            <i class="fa-solid fa-circle-info"></i> {{ langService.t('restaurant_info_tab') }}
          </button>
          <button class="tab-link" [class.active]="activeTab() === 'menu'" (click)="activeTab.set('menu')">
            <i class="fa-solid fa-utensils"></i> {{ langService.t('menu_items_tab') }}
          </button>
          <button class="tab-link" [class.active]="activeTab() === 'qr'" (click)="activeTab.set('qr')">
            <i class="fa-solid fa-qrcode"></i> {{ langService.t('qr_codes_tab') }}
          </button>
          <button class="tab-link" [class.active]="activeTab() === 'design'" (click)="activeTab.set('design')">
            <i class="fa-solid fa-palette"></i> Desain Web
          </button>
        </div>

        <!-- TAB CONTENT: RESTAURANT INFO -->
        <div class="tab-content glass-panel" *ngIf="activeTab() === 'info'">
          <div class="info-editor-header">
            <h2>Ubah Informasi Restoran</h2>
            <div class="info-lang-switcher">
              <label>Pilih Bahasa Edit:</label>
              <select [(ngModel)]="infoEditLang" (change)="loadRestaurantInfoForEdit()">
                <option *ngFor="let l of langService.languages" [value]="l.code">{{ l.flag }} {{ l.name }}</option>
              </select>
            </div>
          </div>
          
          <form (submit)="saveRestaurantInfo($event)" class="info-form">
            <div class="form-group">
              <label>Tentang Kami (About)</label>
              <textarea name="infoAbout" [(ngModel)]="infoAbout" rows="5" required></textarea>
            </div>
            
            <div class="form-group">
              <label>Akses Transportasi (Transportation)</label>
              <textarea name="infoTransport" [(ngModel)]="infoTransport" rows="4" required></textarea>
            </div>
            
            <div class="form-group">
              <label>Kontak & Informasi (Contact)</label>
              <textarea name="infoContact" [(ngModel)]="infoContact" rows="3" required></textarea>
            </div>
            
            <div class="form-group">
              <label>Jam Operasional (Hours)</label>
              <textarea name="infoHours" [(ngModel)]="infoHours" rows="2" required></textarea>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="loading()">
                <i class="fa-solid fa-floppy-disk"></i> {{ langService.t('save') }}
              </button>
            </div>
          </form>
        </div>

        <!-- TAB CONTENT: MENU MANAGEMENT -->
        <div class="tab-content glass-panel" *ngIf="activeTab() === 'menu'">
          <div class="menu-manager-header" style="flex-direction: column; align-items: stretch; gap: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <h2>Daftar Hidangan Restoran</h2>
              <button class="btn btn-primary btn-sm" (click)="openAddModal()">
                <i class="fa-solid fa-plus"></i> {{ langService.t('add_item') }}
              </button>
            </div>
            
            <div class="admin-toolbar">
              <div class="admin-search-wrapper">
                <i class="fa-solid fa-search admin-search-icon"></i>
                <input 
                  type="text" 
                  [(ngModel)]="adminSearchQuery" 
                  (ngModelChange)="onAdminSearchChange($event)"
                  placeholder="Cari nama menu..." 
                  class="admin-search-input"
                />
              </div>

              <div class="admin-category-tabs">
                <button 
                  class="admin-cat-tab" 
                  [class.active]="adminFilterCategory() === 'all'" 
                  (click)="adminFilterCategory.set('all')"
                >
                  <i class="fa-solid fa-border-all"></i> Semua
                </button>
                <button 
                  class="admin-cat-tab" 
                  [class.active]="adminFilterCategory() === 1" 
                  (click)="adminFilterCategory.set(1)"
                >
                  <i class="fa-solid fa-bowl-food"></i> Makanan Berat
                </button>
                <button 
                  class="admin-cat-tab" 
                  [class.active]="adminFilterCategory() === 2" 
                  (click)="adminFilterCategory.set(2)"
                >
                  <i class="fa-solid fa-leaf"></i> Makanan Sayur
                </button>
                <button 
                  class="admin-cat-tab" 
                  [class.active]="adminFilterCategory() === 3" 
                  (click)="adminFilterCategory.set(3)"
                >
                  <i class="fa-solid fa-ice-cream"></i> Manisan
                </button>
                <button 
                  class="admin-cat-tab" 
                  [class.active]="adminFilterCategory() === 4" 
                  (click)="adminFilterCategory.set(4)"
                >
                  <i class="fa-solid fa-utensils"></i> Ala Carte
                </button>
                <button 
                  class="admin-cat-tab" 
                  [class.active]="adminFilterCategory() === 5" 
                  (click)="adminFilterCategory.set(5)"
                >
                  <i class="fa-solid fa-star"></i> Rekomendasi
                </button>
                <button 
                  class="admin-cat-tab" 
                  [class.active]="adminFilterCategory() === 6" 
                  (click)="adminFilterCategory.set(6)"
                >
                  <i class="fa-solid fa-mug-hot"></i> Minuman
                </button>
                <button 
                  class="admin-cat-tab" 
                  [class.active]="adminFilterCategory() === 7" 
                  (click)="adminFilterCategory.set(7)"
                >
                  <i class="fa-solid fa-beer-mug-empty"></i> Bir
                </button>
                <button 
                  class="admin-cat-tab" 
                  [class.active]="adminFilterCategory() === 8" 
                  (click)="adminFilterCategory.set(8)"
                >
                  <i class="fa-solid fa-martini-glass-citrus"></i> Koktail
                </button>
              </div>
            </div>
          </div>

          <!-- Menu Items Table -->
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Nama Hidangan (ID)</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of filteredAdminMenuItems(); let idx = index" class="animate-pop-in" [style.animation-delay]="(idx * 0.05) + 's'">
                  <td class="font-semibold">{{ item.name_id }}</td>
                  <td data-label="Kategori">{{ getCategoryLabel(item.category_id) }}</td>
                  <td data-label="Harga">¥ {{ formatPrice(item.price) }}</td>
                  <td data-label="Status">
                    <span class="status-badge" [class.badge-available]="item.is_available" [class.badge-unavailable]="!item.is_available">
                      {{ item.is_available ? 'Tersedia' : 'Habis' }}
                    </span>
                    <span class="rec-badge" *ngIf="item.is_recommended">
                      <i class="fa-solid fa-star"></i> Rekomendasi
                    </span>
                  </td>
                  <td data-label="Aksi">
                    <div class="table-actions">
                      <button (click)="openEditModal(item)" class="action-btn edit-btn" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                      <button (click)="deleteMenuItem(item.id!)" class="action-btn delete-btn" title="Hapus"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB CONTENT: QR CODE MANAGEMENT -->
        <div class="tab-content glass-panel" *ngIf="activeTab() === 'qr'">
          <div class="qr-manager-header">
            <h2>Generator QR Code Meja</h2>
            <p>Cetak QR Code dan letakkan di meja makan agar pelanggan dapat langsung mengakses Menu Digital.</p>
          </div>

          <div class="qr-grid-layout">
            <!-- Form to Generate -->
            <div class="qr-form-card">
              <h3>Buat QR Code Baru</h3>
              <form (submit)="generateQrCode($event)" class="qr-form">
                <div class="form-group">
                  <label for="tableLabel">Label Meja (misal: Meja 1)</label>
                  <input type="text" name="qrTableLabel" [(ngModel)]="qrTableLabel" id="tableLabel" placeholder="Meja 1" required />
                </div>
                
                <div class="form-group">
                  <label for="targetUrl">Link Target Menu</label>
                  <input type="url" name="qrTargetUrl" [(ngModel)]="qrTargetUrl" id="targetUrl" placeholder="http://localhost:4200/menu" required />
                  <small class="form-help">Link ini akan ditanam di dalam QR Code</small>
                </div>
                
                <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
                  <i class="fa-solid fa-qrcode"></i> {{ langService.t('generate_qr') }}
                </button>
              </form>
            </div>

            <!-- List of QR Codes -->
            <div class="qr-list-card">
              <h3>Daftar QR Code Aktif</h3>
              <div class="qr-items-list" *ngIf="qrCodes().length > 0; else noQrTemp">
                <div *ngFor="let qr of qrCodes()" class="qr-item-row">
                  <div class="qr-item-thumb">
                    <img [src]="qr.qr_image_url" alt="QR Thumbnail" />
                  </div>
                  <div class="qr-item-info">
                    <h4>{{ qr.table_label }}</h4>
                    <p class="qr-url">{{ qr.target_url }}</p>
                  </div>
                  <div class="qr-item-actions">
                    <button (click)="printQrCode(qr)" class="btn btn-secondary btn-sm">
                      <i class="fa-solid fa-print"></i> Cetak
                    </button>
                  </div>
                </div>
              </div>
              <ng-template #noQrTemp>
                <div class="no-qr-placeholder">
                  <i class="fa-solid fa-circle-info"></i>
                  <p>Belum ada QR Code meja yang dibuat.</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT: DESIGN SETTINGS -->
        <div class="tab-content glass-panel" *ngIf="activeTab() === 'design'">
          <div class="info-editor-header">
            <h2>Pengaturan Latar Belakang</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Ubah gambar latar belakang (pattern) website Bali Bong.</p>
          </div>

          <form (submit)="saveDesignSettings($event)" class="info-form">
            <div class="form-group">
              <label>Gambar Latar Belakang (Pattern)</label>
              <input type="file" (change)="onDesignImageUpload($event, 'background_url')" accept="image/*" />
              <div *ngIf="uploadingDesign()">Uploading...</div>
              <img *ngIf="designBgUrl" [src]="designBgUrl" style="max-width: 100%; max-height: 150px; margin-top: 10px; border-radius: 8px; border: 1px solid #ccc;" />
            </div>

            <div class="form-actions mt-2">
              <button type="submit" class="btn btn-primary" [disabled]="loading()">
                <i class="fa-solid fa-floppy-disk"></i> Simpan Desain
              </button>
            </div>
          </form>
        </div>

      </div>
          <!-- Add/Edit Modal (Embedded for simplicity & styling) -->
          <div class="modal-backdrop" *ngIf="showMenuModal()">
            <div class="modal-card">
              <div class="modal-header">
                <h3>{{ editingItem()?.id ? 'Edit Hidangan' : 'Tambah Hidangan Baru' }}</h3>
                <button class="close-btn" (click)="closeMenuModal()"><i class="fa-solid fa-xmark"></i></button>
              </div>
              
              <div class="modal-body-split">
                <form (submit)="saveMenuItem($event)" class="modal-form">
                  <div class="modal-grid-2">
                    <div class="form-group">
                      <label>Kategori</label>
                      <select name="modalCategory" [(ngModel)]="modalItem.category_id" required>
                        <option [value]="1">Makanan Berat</option>
                        <option [value]="2">Makanan Sayur</option>
                        <option [value]="3">Manisan</option>
                        <option [value]="4">Ala Carte</option>
                        <option [value]="5">Rekomendasi</option>
                        <option [value]="6">Minuman Ringan</option>
                        <option [value]="7">Bir</option>
                        <option [value]="8">Koktail</option>
                      </select>
                    </div>
                    
                    <div class="form-group">
                      <label>Harga (Yen)</label>
                      <input type="number" name="modalPrice" [(ngModel)]="modalItem.price" required />
                    </div>
                  </div>

                  <div class="modal-grid-2">
                    <div class="form-group">
                      <label>Upload Gambar Menu</label>
                      <input type="file" (change)="onImageUpload($event)" accept="image/*" />
                      <div *ngIf="uploadingImage()">Uploading...</div>
                      <img *ngIf="modalItem.image_url" [src]="modalItem.image_url" style="max-width: 100%; max-height: 120px; margin-top: 10px; border-radius: 8px;" />
                    </div>
                    
                    <div class="form-group">
                      <label>Info Alergi</label>
                      <input type="text" name="modalAllergy" [(ngModel)]="modalItem.allergy_info" placeholder="Contoh: Kacang, Susu" />
                    </div>
                  </div>

                  <div class="modal-grid-2 checkbox-grid">
                    <label class="checkbox-label">
                      <input type="checkbox" name="modalRecommended" [(ngModel)]="modalItem.is_recommended" />
                      <span>Rekomendasi Unggulan</span>
                    </label>
                    
                    <label class="checkbox-label">
                      <input type="checkbox" name="modalAvailable" [(ngModel)]="modalItem.is_available" />
                      <span>Tersedia (Ready)</span>
                    </label>
                  </div>

                  <!-- Languages Tabs inside modal -->
                  <div class="modal-lang-tabs">
                    <span class="modal-lang-label">Terjemahan Nama & Deskripsi:</span>
                    <div class="lang-tab-bar">
                      <button 
                        type="button"
                        *ngFor="let l of langService.languages"
                        class="lang-tab-btn"
                        [class.active]="modalActiveLang() === l.code"
                        (click)="modalActiveLang.set(l.code)"
                      >
                        {{ l.flag }}
                      </button>
                    </div>
                  </div>

                  <!-- Language Form Fields -->
                  <div class="lang-fields-container">
                    <div *ngIf="modalActiveLang() === 'id'" class="form-group">
                      <label>Nama Menu (Indonesia)</label>
                      <input type="text" name="name_id" [(ngModel)]="modalItem.name_id" required />
                      <label class="mt-2">Deskripsi (Indonesia)</label>
                      <textarea name="desc_id" [(ngModel)]="modalItem.desc_id" rows="3"></textarea>
                    </div>
                    
                    <div *ngIf="modalActiveLang() === 'ja'" class="form-group">
                      <label>Nama Menu (Jepang)</label>
                      <input type="text" name="name_ja" [(ngModel)]="modalItem.name_ja" />
                      <label class="mt-2">Deskripsi (Jepang)</label>
                      <textarea name="desc_ja" [(ngModel)]="modalItem.desc_ja" rows="3"></textarea>
                    </div>
                    
                    <div *ngIf="modalActiveLang() === 'zh'" class="form-group">
                      <label>Nama Menu (Mandarin)</label>
                      <input type="text" name="name_zh" [(ngModel)]="modalItem.name_zh" />
                      <label class="mt-2">Deskripsi (Mandarin)</label>
                      <textarea name="desc_zh" [(ngModel)]="modalItem.desc_zh" rows="3"></textarea>
                    </div>
                    
                    <div *ngIf="modalActiveLang() === 'ko'" class="form-group">
                      <label>Nama Menu (Korea)</label>
                      <input type="text" name="name_ko" [(ngModel)]="modalItem.name_ko" />
                      <label class="mt-2">Deskripsi (Korea)</label>
                      <textarea name="desc_ko" [(ngModel)]="modalItem.desc_ko" rows="3"></textarea>
                    </div>
                    
                    <div *ngIf="modalActiveLang() === 'es'" class="form-group">
                      <label>Nama Menu (Spanyol)</label>
                      <input type="text" name="name_es" [(ngModel)]="modalItem.name_es" />
                      <label class="mt-2">Deskripsi (Spanyol)</label>
                      <textarea name="desc_es" [(ngModel)]="modalItem.desc_es" rows="3"></textarea>
                    </div>
                  </div>

                  <div class="modal-actions">
                    <button type="button" class="btn btn-outline btn-sm" (click)="closeMenuModal()">Batal</button>
                    <button type="submit" class="btn btn-primary btn-sm" [disabled]="loading()">
                      <i class="fa-solid fa-floppy-disk"></i> {{ langService.t('save') }}
                    </button>
                  </div>
                </form>

                <!-- Live Preview Card -->
                <div class="preview-panel">
                  <h4 style="margin-bottom: 12px; color: var(--text-muted);">Tampilan Preview Menu:</h4>
                  <div class="menu-card" style="box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-radius: 16px; overflow: hidden; background: #fff; border: 1px solid #eaeaea;">
                    <div class="menu-card-img" style="height: 180px; background: #f5f5f5; position: relative;">
                      <img *ngIf="modalItem.image_url" [src]="modalItem.image_url" style="width: 100%; height: 100%; object-fit: cover;" />
                      <div *ngIf="!modalItem.image_url" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #ccc;">
                        <i class="fa-solid fa-image fa-3x"></i>
                      </div>
                      <div class="rec-badge-overlay" *ngIf="modalItem.is_recommended" style="position: absolute; top: 12px; left: 12px; background: var(--secondary-color); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">
                        <i class="fa-solid fa-star"></i> Rekomendasi
                      </div>
                    </div>
                    <div class="menu-card-body" style="padding: 16px;">
                      <h3 style="font-size: 1.1rem; margin-bottom: 8px; color: var(--primary-color);">{{ getPreviewName() || 'Nama Hidangan' }}</h3>
                      <p style="font-size: 0.85rem; color: #666; margin-bottom: 12px; min-height: 40px;">{{ getPreviewDesc() || 'Deskripsi akan muncul di sini...' }}</p>
                      
                      <div *ngIf="modalItem.allergy_info" style="font-size: 0.8rem; background: #FFF4E5; color: #D35400; padding: 6px 10px; border-radius: 8px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-triangle-exclamation"></i> {{ modalItem.allergy_info }}
                      </div>

                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: var(--text-dark);">¥ {{ formatPrice(modalItem.price) }}</div>
                        <div style="font-size: 0.8rem; color: {{ modalItem.is_available ? 'green' : 'red' }}">{{ modalItem.is_available ? 'Tersedia' : 'Habis' }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

    </main>
  `,
  styles: [`
    .admin-main {
      padding: 60px 0;
      min-height: 80vh;
    }
    
    /* Login */
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px 0;
    }
    .login-card {
      width: 100%;
      max-width: 450px;
      padding: 48px 40px;
      background: var(--surface-light);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--box-shadow);
      border: 1px solid rgba(125, 34, 17, 0.08);
    }
    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .login-icon {
      font-size: 3rem;
      color: var(--primary-color);
      margin-bottom: 16px;
    }
    .login-header h2 {
      font-size: 1.8rem;
      margin-bottom: 8px;
    }
    .login-header p {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    
    /* Dashboard */
    .dashboard-header {
      margin-bottom: 32px;
    }
    .dashboard-header h1 {
      font-size: 2.2rem;
      margin-bottom: 8px;
    }
    .dashboard-header p {
      color: var(--text-muted);
    }

    /* Tabs */
    .tab-links {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      padding: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      position: sticky;
      top: 60px; /* offset on mobile */
      z-index: 60;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      border-radius: 40px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      border: 1px solid rgba(125, 34, 17, 0.05);
    }
    .tab-links::-webkit-scrollbar {
      display: none;
    }
    .tab-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      background: transparent;
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 30px;
      transition: var(--transition);
      white-space: nowrap;
    }
    .tab-link:hover {
      color: var(--primary-color);
    }
    .tab-link.active {
      color: white;
      background: var(--primary-color);
      box-shadow: 0 4px 10px rgba(125, 34, 17, 0.2);
    }

    .tab-content {
      padding: 40px;
      background: var(--surface-light);
      border-radius: var(--border-radius-md);
      box-shadow: var(--box-shadow);
      border: 1px solid rgba(125, 34, 17, 0.06);
    }

    /* Forms */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }
    .form-group label {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--primary-color);
    }
    .form-group input,
    .form-group textarea,
    .form-group select {
      padding: 12px 16px;
      border-radius: var(--border-radius-sm);
      border: 1px solid rgba(125, 34, 17, 0.15);
      font-family: var(--font-sans);
      font-size: 0.95rem;
      background: #FFFFFF;
      transition: var(--transition);
    }
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--secondary-color);
      box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
    }
    .w-full {
      width: 100%;
    }
    .error-message {
      background: rgba(211, 84, 0, 0.1);
      color: var(--accent-color);
      padding: 12px;
      border-radius: var(--border-radius-sm);
      margin-bottom: 24px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Info Tab Specifics */
    .info-editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      padding-bottom: 16px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .info-lang-switcher {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .info-lang-switcher label {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .info-lang-switcher select {
      padding: 8px 12px;
      border-radius: 20px;
      border: 1px solid rgba(0,0,0,0.15);
    }

    /* Menu Tab Specifics */
    .menu-manager-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .admin-table th,
    .admin-table td {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    .admin-table th {
      background: rgba(125, 34, 17, 0.02);
      color: var(--primary-color);
      font-weight: 700;
    }
    .admin-table tbody tr:hover {
      background: rgba(125, 34, 17, 0.01);
    }
    .font-semibold {
      font-weight: 600;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-available {
      background: rgba(125, 34, 17, 0.1);
      color: var(--primary-color);
    }
    .badge-unavailable {
      background: rgba(211, 84, 0, 0.1);
      color: var(--accent-color);
    }
    .rec-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--secondary-dark);
    }
    .table-actions {
      display: flex;
      gap: 8px;
    }
    .action-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      transition: var(--transition);
    }
    .edit-btn {
      background: rgba(197, 160, 89, 0.1);
      color: var(--secondary-dark);
    }
    .edit-btn:hover {
      background: var(--secondary-color);
      color: white;
    }
    .delete-btn {
      background: rgba(211, 84, 0, 0.1);
      color: var(--accent-color);
    }
    .delete-btn:hover {
      background: var(--accent-color);
      color: white;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      background: #FFFFFF;
      border-radius: var(--border-radius-lg);
      width: 100%;
      max-width: 900px;
      max-height: 100%;
      overflow-y: auto;
      padding: 32px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      margin: 0;
    }
    .modal-body-split {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 32px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      padding-bottom: 12px;
    }
    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
    }
    .modal-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .checkbox-grid {
      display: flex;
      gap: 24px;
      align-items: center;
      margin-bottom: 20px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .checkbox-label input {
      width: 18px;
      height: 18px;
    }
    .modal-lang-tabs {
      margin-bottom: 16px;
    }
    .modal-lang-label {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-muted);
      display: block;
      margin-bottom: 8px;
    }
    .lang-tab-bar {
      display: flex;
      gap: 6px;
    }
    .lang-tab-btn {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid rgba(0,0,0,0.1);
      background: #F3EFE6;
      cursor: pointer;
      font-size: 1.1rem;
      transition: var(--transition);
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    .lang-tab-btn.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }
    .admin-cat-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 50px;
      background: white;
      border: 1px solid rgba(125, 34, 17, 0.15);
      color: var(--primary-color);
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
      box-shadow: 0 2px 5px rgba(0,0,0,0.02);
    }
    .admin-cat-tab:hover {
      background: rgba(226, 109, 63, 0.1);
      transform: translateY(-2px);
    }
    .admin-cat-tab.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
      box-shadow: 0 4px 15px rgba(125, 34, 17, 0.2);
    }
    .admin-toolbar {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
      position: sticky;
      top: 110px; /* Offset to stick below tab-links on mobile */
      z-index: 50;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      padding: 12px 0;
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    .admin-category-tabs {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 8px;
      scrollbar-width: thin;
    }
    .admin-search-wrapper {
      position: relative;
      width: 100%;
      max-width: 400px;
    }
    .admin-search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    .admin-search-input {
      width: 100%;
      padding: 12px 16px 12px 42px;
      border-radius: 50px;
      border: 1px solid rgba(125, 34, 17, 0.15);
      background: white;
      font-size: 0.95rem;
      transition: all 0.3s;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    .admin-search-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
    }
    @media (min-width: 768px) {
      .admin-toolbar {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        top: 130px; /* Offset to stick below tab-links on PC */
        padding: 16px 0;
      }
      .admin-category-tabs {
        flex-wrap: wrap;
        padding-bottom: 0;
      }
    }
    .lang-fields-container {
      background: #FAF8F5;
      padding: 20px;
      border-radius: var(--border-radius-sm);
      margin-bottom: 24px;
      border: 1px solid rgba(125, 34, 17, 0.05);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid rgba(0,0,0,0.05);
      padding-top: 20px;
    }
    .mt-2 {
      margin-top: 12px;
    }

    /* QR Tab Specifics */
    .qr-manager-header {
      margin-bottom: 32px;
    }
    .qr-grid-layout {
      display: grid;
      grid-template-columns: 0.8fr 1.2fr;
      gap: 40px;
    }
    .qr-form-card,
    .qr-list-card {
      border: 1px solid rgba(0, 0, 0, 0.05);
      padding: 24px;
      border-radius: var(--border-radius-md);
      background: rgba(125, 34, 17, 0.01);
    }
    .qr-form-card h3,
    .qr-list-card h3 {
      font-size: 1.2rem;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      padding-bottom: 10px;
      color: var(--primary-color);
    }
    .form-help {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .qr-items-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 400px;
      overflow-y: auto;
    }
    .qr-item-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: white;
      border-radius: var(--border-radius-sm);
      border: 1px solid rgba(0,0,0,0.05);
    }
    .qr-item-thumb {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #ddd;
    }
    .qr-item-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .qr-item-info {
      flex-grow: 1;
    }
    .qr-item-info h4 {
      font-size: 1rem;
      color: var(--primary-color);
    }
    .qr-url {
      font-size: 0.75rem;
      color: var(--text-muted);
      word-break: break-all;
    }
    .no-qr-placeholder {
      text-align: center;
      padding: 40px 0;
      color: var(--text-muted);
    }
    .no-qr-placeholder i {
      font-size: 2rem;
      margin-bottom: 12px;
    }

    @media (max-width: 900px) {
      .qr-grid-layout {
        grid-template-columns: 1fr;
        gap: 32px;
      }
      .tab-content {
        padding: 24px;
      }
    }

    @media (max-width: 600px) {
      .modal-backdrop {
        align-items: flex-start;
        padding: 16px 12px 80px 12px;
      }
      .modal-card {
        padding: 20px;
        margin: 0;
        width: 100%;
        max-height: 100%;
      }
      .modal-grid-2 {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .modal-body-split {
        grid-template-columns: 1fr;
      }
      .checkbox-grid {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .admin-table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
      }
      .info-editor-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  langService = inject(LanguageService);
  private readonly http = inject(HttpClient);

  // States
  readonly isLoggedIn = signal<boolean>(false);
  readonly activeTab = signal<'info' | 'menu' | 'qr' | 'design'>('info');

  // Loaders
  readonly loading = signal<boolean>(false);

  // Login variables
  loginEmail = '';
  loginPassword = '';
  readonly loginError = signal<string>('');

  // Info Editor Variables
  // Info Editor Variables
  infoEditLang: LanguageCode = 'id';
  infoAbout = '';
  infoTransport = '';
  infoContact = '';
  infoHours = '';

  // Menu Manager Variables
  readonly menuItems = signal<AdminMenuItem[]>([]);
  readonly showMenuModal = signal<boolean>(false);
  readonly editingItem = signal<AdminMenuItem | null>(null);
  readonly uploadingImage = signal<boolean>(false);
  readonly modalActiveLang = signal<LanguageCode>('id');
  
  adminFilterCategory = signal<number | 'all'>('all');
  adminSearchQuery = signal<string>('');

  readonly filteredAdminMenuItems = computed(() => {
    let items = this.menuItems();
    const filterCat = this.adminFilterCategory();
    
    // Filter by Category
    if (filterCat !== 'all') {
      if (filterCat === 5) {
        items = items.filter(i => i.is_recommended);
      } else {
        items = items.filter(i => i.category_id == filterCat);
      }
    }
    
    // Filter by Search Query
    const query = this.adminSearchQuery().toLowerCase().trim();
    if (query) {
      items = items.filter(i => {
        return (i.name_id && i.name_id.toLowerCase().includes(query)) ||
               (i.name_ja && i.name_ja.toLowerCase().includes(query)) ||
               (i.name_es && i.name_es.toLowerCase().includes(query));
      });
    }

    return items;
  });

  onAdminSearchChange(query: string) {
    this.adminSearchQuery.set(query);
  }

  modalItem: AdminMenuItem = this.getEmptyModalItem();

  // QR Code Manager Variables
  readonly qrCodes = signal<QrCode[]>([]);
  qrTableLabel = '';
  qrTargetUrl = 'http://localhost:4200/menu';
  designBgUrl = '';
  designGarudaUrl = '';
  designBarongUrl = '';
  uploadingDesign = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isLoggedIn()) {
        const tab = this.activeTab();
        if (tab === 'info') this.loadRestaurantInfoForEdit();
        if (tab === 'menu') this.loadAdminMenu();
        if (tab === 'qr') this.loadQrCodes();
        if (tab === 'design') this.loadDesignSettings();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('balibong_token');
      if (token) {
        this.isLoggedIn.set(true);
        this.loadInitialDashboardData();
      }
    }
  }

  login(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    this.loginError.set('');

    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
    this.http.post<any>(`${apiBase}/admin/auth/login`, {
      email: this.loginEmail,
      password: this.loginPassword
    }).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('balibong_token', data.token);
        }
        this.isLoggedIn.set(true);
        this.loadInitialDashboardData();
      },
      error: (err) => {
        this.loading.set(false);
        this.loginError.set(err.error?.error || 'Kombinasi email dan password salah.');
      }
    });
  }

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('balibong_token');
    }
    this.isLoggedIn.set(false);
  }

  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('balibong_token') : '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadInitialDashboardData() {
    this.loadRestaurantInfoForEdit();
    this.loadAdminMenu();
    this.loadQrCodes();
  }

  // --- TAB 1: RESTAURANT INFO ---
  loadRestaurantInfoForEdit() {
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
    this.http.get<any>(`${apiBase}/restaurant-info?lang=${this.infoEditLang}`).subscribe({
      next: (data) => {
        this.infoAbout = data.about || '';
        this.infoTransport = data.transportation || '';
        this.infoContact = data.contact || '';
        this.infoHours = data.hours || '';
      },
      error: (err) => {
        console.error('Error fetching info for edit', err);
      }
    });
  }

  saveRestaurantInfo(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
    
    this.http.put<any>(`${apiBase}/admin/restaurant-info`, {
      lang: this.infoEditLang,
      about: this.infoAbout,
      transportation: this.infoTransport,
      contact: this.infoContact,
      hours: this.infoHours
    }, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        this.loading.set(false);
        alert('Informasi Restoran berhasil disimpan!');
      },
      error: (err) => {
        this.loading.set(false);
        alert('Gagal menyimpan: ' + (err.error?.error || err.message));
      }
    });
  }

  // --- TAB 2: MENU ITEMS CRUD ---
  loadAdminMenu() {
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
    this.http.get<AdminMenuItem[]>(`${apiBase}/admin/menu`, { headers: this.getAuthHeaders() }).subscribe({
      next: (data) => {
        this.menuItems.set(data || []);
      },
      error: (err) => {
        console.error('Error loading admin menu', err);
      }
    });
  }

  getCategoryLabel(id: number): string {
    const labels: Record<number, string> = {
      1: 'Makanan Berat',
      2: 'Makanan Sayur',
      3: 'Manisan',
      4: 'Ala Carte',
      5: 'Rekomendasi',
      6: 'Minuman Ringan',
      7: 'Bir',
      8: 'Koktail'
    };
    return labels[id] || 'Menu';
  }

  formatPrice(price: number | undefined | null): string {
    if (price === undefined || price === null) return '0';
    return price.toLocaleString('id-ID');
  }

  getEmptyModalItem(): AdminMenuItem {
    return {
      category_id: 1,
      price: 0,
      image_url: null,
      allergy_info: null,
      is_recommended: false,
      is_available: true,
      name_id: '', desc_id: '',
      name_ja: '', desc_ja: '',
      name_zh: '', desc_zh: '',
      name_ko: '', desc_ko: '',
      name_es: '', desc_es: ''
    };
  }

  getPreviewName(): string {
    const lang = this.modalActiveLang();
    return (this.modalItem as any)[`name_${lang}`] || this.modalItem.name_id || '';
  }

  getPreviewDesc(): string {
    const lang = this.modalActiveLang();
    return (this.modalItem as any)[`desc_${lang}`] || this.modalItem.desc_id || '';
  }

  openAddModal() {
    this.editingItem.set(null);
    this.modalItem = this.getEmptyModalItem();
    this.modalActiveLang.set('id');
    this.showMenuModal.set(true);
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadingImage.set(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
      
      this.http.post<any>(`${apiBase}/admin/upload-image`, {
        imageBase64: base64,
        type: 'menu'
      }, { headers: this.getAuthHeaders() }).subscribe({
        next: (res) => {
          this.uploadingImage.set(false);
          this.modalItem.image_url = `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000${res.imageUrl}`;
        },
        error: (err) => {
          this.uploadingImage.set(false);
          console.error(err);
          alert('Gagal mengupload gambar.');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  openEditModal(item: AdminMenuItem) {
    this.editingItem.set(item);
    this.modalItem = { ...item };
    this.modalActiveLang.set('id');
    this.showMenuModal.set(true);
  }

  closeMenuModal() {
    this.showMenuModal.set(false);
    this.editingItem.set(null);
  }

  saveMenuItem(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';

    // Build payload and fallback default translations if empty
    const payload = { ...this.modalItem };
    const langs: LanguageCode[] = ['ja', 'zh', 'ko', 'es'];
    langs.forEach(lang => {
      if (!payload[`name_${lang}` as keyof AdminMenuItem]) {
        (payload as any)[`name_${lang}`] = payload.name_id;
      }
      if (!payload[`desc_${lang}` as keyof AdminMenuItem]) {
        (payload as any)[`desc_${lang}`] = payload.desc_id;
      }
    });

    if (payload.id) {
      // Update
      this.http.put<any>(`${apiBase}/admin/menu/${payload.id}`, payload, { headers: this.getAuthHeaders() }).subscribe({
        next: () => {
          this.loading.set(false);
          this.closeMenuModal();
          this.loadAdminMenu();
        },
        error: (err) => {
          this.loading.set(false);
          alert('Gagal mengupdate menu: ' + (err.error?.error || err.message));
        }
      });
    } else {
      // Create
      this.http.post<any>(`${apiBase}/admin/menu`, payload, { headers: this.getAuthHeaders() }).subscribe({
        next: () => {
          this.loading.set(false);
          this.closeMenuModal();
          this.loadAdminMenu();
        },
        error: (err) => {
          this.loading.set(false);
          alert('Gagal menyimpan menu baru: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  deleteMenuItem(id: number) {
    if (confirm('Apakah Anda yakin ingin menghapus hidangan ini secara permanen?')) {
      const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
      this.http.delete<any>(`${apiBase}/admin/menu/${id}`, { headers: this.getAuthHeaders() }).subscribe({
        next: () => {
          this.loadAdminMenu();
        },
        error: (err) => {
          alert('Gagal menghapus: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  // --- TAB 3: QR CODES ---
  loadQrCodes() {
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
    this.http.get<QrCode[]>(`${apiBase}/admin/qr`, { headers: this.getAuthHeaders() }).subscribe({
      next: (data) => {
        this.qrCodes.set(data || []);
      },
      error: (err) => {
        console.error('Error loading QR Codes', err);
      }
    });
  }

  generateQrCode(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';

    this.http.post<any>(`${apiBase}/admin/qr`, {
      table_label: this.qrTableLabel,
      target_url: this.qrTargetUrl
    }, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.qrTableLabel = '';
        this.loadQrCodes();
      },
      error: (err) => {
        this.loading.set(false);
        alert('Gagal membuat QR Code: ' + (err.error?.error || err.message));
      }
    });
  }

  printQrCode(qr: QrCode) {
    // Open a new window with a print-friendly preview
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak QR - ${qr.table_label}</title>
            <style>
              body {
                font-family: 'Outfit', sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #ffffff;
              }
              .qr-card {
                border: 4px solid #7D2211;
                padding: 40px;
                border-radius: 24px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                max-width: 400px;
              }
              .logo {
                font-family: 'Outfit', 'Playfair Display', serif;
                font-size: 2.2rem;
                font-weight: 700;
                color: #7D2211;
                margin-bottom: 8px;
              }
              .subtitle {
                font-size: 0.9rem;
                color: #E26D3F;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 24px;
                font-weight: bold;
              }
              .qr-image {
                width: 250px;
                height: 250px;
                margin-bottom: 24px;
              }
              .table-num {
                font-size: 1.8rem;
                font-weight: 800;
                color: #7D2211;
                margin-bottom: 8px;
              }
              .scan-text {
                font-size: 0.95rem;
                color: #767676;
              }
            </style>
          </head>
          <body>
            <div class="qr-card">
              <div class="logo">BALI BONG</div>
              <div class="subtitle">Scan to View Digital Menu</div>
              <img class="qr-image" src="${qr.qr_image_url}" />
              <div class="table-num">${qr.table_label}</div>
              <div class="scan-text">Silakan pindai untuk melihat menu digital lengkap kami dalam 5 bahasa.</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                // window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  // --- TAB 4: DESIGN SETTINGS ---
  loadDesignSettings() {
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
    this.http.get<any>(`${apiBase}/admin/design`).subscribe({
      next: (data) => {
        this.designBgUrl = data.background_url || '';
        this.designGarudaUrl = data.garuda_url || '';
        this.designBarongUrl = data.barong_url || '';
      },
      error: (err) => {
        console.error('Error loading design settings', err);
      }
    });
  }

  saveDesignSettings(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
    this.http.put<any>(`${apiBase}/admin/design`, {
      background_url: this.designBgUrl,
      garuda_url: this.designGarudaUrl,
      barong_url: this.designBarongUrl
    }, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        this.loading.set(false);
        alert('Desain berhasil disimpan! Efek akan terlihat jika halaman di-refresh.');
      },
      error: (err) => {
        this.loading.set(false);
        alert('Gagal menyimpan desain: ' + (err.error?.error || err.message));
      }
    });
  }

  onDesignImageUpload(event: any, key: 'background_url' | 'garuda_url' | 'barong_url') {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadingDesign.set(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
      
      this.http.post<any>(`${apiBase}/admin/upload-image`, {
        imageBase64: base64,
        type: 'assets'
      }, { headers: this.getAuthHeaders() }).subscribe({
        next: (res) => {
          this.uploadingDesign.set(false);
          const fullUrl = `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000${res.imageUrl}`;
          if (key === 'background_url') this.designBgUrl = fullUrl;
          if (key === 'garuda_url') this.designGarudaUrl = fullUrl;
          if (key === 'barong_url') this.designBarongUrl = fullUrl;
        },
        error: (err) => {
          this.uploadingDesign.set(false);
          alert('Gagal mengupload gambar aset.');
        }
      });
    };
    reader.readAsDataURL(file);
  }
}
