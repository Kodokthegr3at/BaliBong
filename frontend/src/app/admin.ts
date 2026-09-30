import { Component, OnInit, inject, signal, effect, computed, HostListener, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { LanguageService, LanguageCode } from './language.service';
import { getApiBase } from './api-base';
import { toInfoRows, HOURS_SEPARATOR, CONTACT_SEPARATOR } from './info-rows';

interface QrCode {
  id: number;
  table_label: string;
  target_url: string;
  qr_image_url: string;
  created_at: string;
}

interface Category { id: number; name: string; }

interface AdminMenuItem {
  id?: number;
  category_id: number;
  price: number;
  image_url: string | null;
  allergy_info?: string | null;
  is_recommended: boolean;
  is_available: boolean;
  spicy_level?: number;
  is_vegetarian?: boolean;
  name_id?: string;
  desc_id?: string;
  name_en?: string;
  desc_en?: string;
  name_ja?: string;
  desc_ja?: string;
  name_zh?: string;
  desc_zh?: string;
  name_ko?: string;
  desc_ko?: string;
  name_es?: string;
  desc_es?: string;
}

type Tab = 'info' | 'menu' | 'qr';
type TextKind = 'name' | 'desc';

const TOKEN_KEY = 'balibong_token';
// Vercel rejects request bodies over 4.5 MB and base64 adds ~33%.
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
  <div class="bb">
    <header class="ap-hdr">
      <div class="bb-wrap ap-hdr-row">
        <a routerLink="/" class="ap-logo"><img src="/public/images/assets/logo.png" alt="BALI BONG"></a>
        <nav class="ap-nav">
          <a routerLink="/">Beranda</a>
          <a routerLink="/menu">Menu</a>
          @if (isLoggedIn()) {
            <button type="button" class="ap-btn ap-btn-line ap-btn-sm" (click)="logout()">Keluar</button>
          }
        </nav>
      </div>
    </header>

    <main class="bb-wrap ap-main">
      @if (!isLoggedIn()) {
        <!-- LOGIN -->
        <div class="ap-login">
          <span class="bb-eyebrow">Panel Admin</span>
          <h1 class="ap-login-title">Login Admin</h1>
          <p class="ap-muted">Akses khusus pengelola restoran Bali Bong.</p>
          <form (submit)="login($event)" class="ap-stack">
            <label class="ap-field">
              <span>Email</span>
              <input class="ap-input" type="email" name="email" autocomplete="username" [(ngModel)]="loginEmail" required>
            </label>
            <label class="ap-field">
              <span>Kata sandi</span>
              <input class="ap-input" type="password" name="password" autocomplete="current-password" [(ngModel)]="loginPassword" required>
            </label>
            @if (loginError()) { <p class="ap-error" role="alert">{{ loginError() }}</p> }
            <button type="submit" class="ap-btn ap-btn-accent ap-btn-lg" [disabled]="saving()">
              {{ saving() ? 'Memproses…' : 'Masuk' }}
            </button>
          </form>
        </div>
      } @else {
        <!-- DASHBOARD -->
        <div class="ap-head">
          <span class="bb-eyebrow">Panel Admin</span>
          <h1 class="ap-title">Kelola Bali Bong</h1>
        </div>

        <div class="ap-tabs" role="tablist">
          <button type="button" role="tab" [class.on]="activeTab() === 'info'" (click)="switchTab('info')">Info Restoran</button>
          <button type="button" role="tab" [class.on]="activeTab() === 'menu'" (click)="switchTab('menu')">Menu</button>
          <button type="button" role="tab" [class.on]="activeTab() === 'qr'" (click)="switchTab('qr')">QR Code Meja</button>
        </div>

        <!-- TAB: RESTAURANT INFO -->
        @if (activeTab() === 'info') {
          <section class="ap-panel">
            <div class="ap-panel-head">
              <div>
                <h2 class="ap-h2">Informasi Restoran</h2>
                <p class="ap-muted">Teks ini tampil di Beranda. Setiap bahasa disimpan terpisah.</p>
              </div>
              <div class="ap-chips">
                @for (l of lang.languages; track l.code) {
                  <button type="button" class="ap-chip" [class.on]="infoEditLang === l.code" (click)="switchInfoLang(l.code)">{{ l.code.toUpperCase() }}</button>
                }
              </div>
            </div>

            <form (submit)="saveRestaurantInfo($event)" class="ap-stack">
              <label class="ap-field">
                <span>Tentang Kami</span>
                <textarea class="ap-input" name="infoAbout" [(ngModel)]="infoAbout" rows="6"></textarea>
              </label>
              <label class="ap-field">
                <span>Akses & Transportasi</span>
                <textarea class="ap-input" name="infoTransport" [(ngModel)]="infoTransport" rows="3"></textarea>
              </label>
              <div class="ap-grid2">
                <label class="ap-field">
                  <span>Jam Operasional</span>
                  <textarea class="ap-input" name="infoHours" [(ngModel)]="infoHours" rows="4"></textarea>
                  <small class="ap-hint">Satu baris per jadwal, format <b>Hari: jam</b>. Pisahkan dengan baris baru atau titik.</small>
                  @if (hoursPreview().length) {
                    <div class="ap-preview-rows">
                      @for (r of hoursPreview(); track $index) { <div><span>{{ r.label }}</span><b>{{ r.value }}</b></div> }
                    </div>
                  }
                </label>
                <label class="ap-field">
                  <span>Kontak</span>
                  <textarea class="ap-input" name="infoContact" [(ngModel)]="infoContact" rows="4"></textarea>
                  <small class="ap-hint">Format <b>Label: nilai</b>, pisahkan dengan baris baru atau tanda <b>|</b>.</small>
                  @if (contactPreview().length) {
                    <div class="ap-preview-rows">
                      @for (r of contactPreview(); track $index) { <div><span>{{ r.label }}</span><b>{{ r.value }}</b></div> }
                    </div>
                  }
                </label>
              </div>
              <div class="ap-actions">
                @if (infoDirty()) { <span class="ap-muted">Ada perubahan yang belum disimpan</span> }
                <button type="submit" class="ap-btn ap-btn-accent" [disabled]="saving() || !infoDirty()">Simpan</button>
              </div>
            </form>
          </section>
        }

        <!-- TAB: MENU -->
        @if (activeTab() === 'menu') {
          <section class="ap-panel">
            <div class="ap-panel-head">
              <div>
                <h2 class="ap-h2">Daftar Hidangan</h2>
                <p class="ap-muted">{{ menuItems().length }} hidangan · {{ soldOutCount() }} habis</p>
              </div>
              <button type="button" class="ap-btn ap-btn-dark" (click)="openAddModal()">+ Tambah Menu</button>
            </div>

            <div class="ap-toolbar">
              <input class="ap-input ap-search" type="search" placeholder="Cari nama menu…" [ngModel]="adminSearchQuery()" (ngModelChange)="adminSearchQuery.set($event)">
              <div class="ap-chips ap-scroll">
                <button type="button" class="ap-chip" [class.on]="adminFilterCategory() === 'all'" (click)="adminFilterCategory.set('all')">Semua</button>
                @for (c of categories(); track c.id) {
                  <button type="button" class="ap-chip" [class.on]="adminFilterCategory() === c.id" (click)="adminFilterCategory.set(c.id)">{{ c.name }}</button>
                }
              </div>
            </div>

            @if (menuLoading()) {
              <p class="ap-empty">Memuat…</p>
            } @else if (!filteredAdminMenuItems().length) {
              <p class="ap-empty">Tidak ada hidangan yang cocok.</p>
            } @else {
              <ul class="ap-list">
                @for (item of filteredAdminMenuItems(); track item.id) {
                  <li class="ap-row" [class.out]="!item.is_available">
                    <div class="ap-thumb bb-ph">
                      @if (item.image_url) { <img [src]="item.image_url" [alt]="item.name_id" loading="lazy"> }
                    </div>
                    <div class="ap-row-main">
                      <div class="ap-row-name">{{ item.name_id }}</div>
                      <div class="ap-row-meta">
                        <span>{{ categoryName(item.category_id) }}</span>
                        @if (item.is_recommended) { <span class="bb-tag bb-tag-sig">Andalan</span> }
                        @if (item.spicy_level) { <span class="bb-tag bb-tag-spicy">{{ chili(item.spicy_level) }}</span> }
                        @if (item.is_vegetarian) { <span class="bb-tag bb-tag-veg">Vegetarian</span> }
                      </div>
                    </div>
                    <div class="ap-row-price">{{ yen(item.price) }}</div>
                    <button type="button" class="ap-switch" [class.on]="item.is_available" (click)="toggleAvailable(item)"
                      [attr.aria-pressed]="item.is_available" [title]="item.is_available ? 'Tandai habis' : 'Tandai tersedia'">
                      <span class="ap-knob"></span>{{ item.is_available ? 'Tersedia' : 'Habis' }}
                    </button>
                    <div class="ap-row-actions">
                      <button type="button" class="ap-icon" (click)="openEditModal(item)" title="Edit" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
                      <button type="button" class="ap-icon danger" (click)="deleteMenuItem(item)" title="Hapus" aria-label="Hapus"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                  </li>
                }
              </ul>
            }
          </section>
        }

        <!-- TAB: QR -->
        @if (activeTab() === 'qr') {
          <section class="ap-panel">
            <div class="ap-panel-head">
              <div>
                <h2 class="ap-h2">QR Code Meja</h2>
                <p class="ap-muted">Cetak dan letakkan di meja agar tamu langsung membuka menu digital.</p>
              </div>
            </div>
            <div class="ap-qr-layout">
              <form (submit)="generateQrCode($event)" class="ap-stack ap-card">
                <h3 class="ap-h3">Buat QR baru</h3>
                <label class="ap-field">
                  <span>Label meja</span>
                  <input class="ap-input" type="text" name="qrTableLabel" [(ngModel)]="qrTableLabel" placeholder="Meja 1" required>
                </label>
                <label class="ap-field">
                  <span>Link tujuan</span>
                  <input class="ap-input" type="url" name="qrTargetUrl" [(ngModel)]="qrTargetUrl" required>
                  <small class="ap-hint">Biasanya halaman menu situs ini.</small>
                </label>
                <button type="submit" class="ap-btn ap-btn-accent" [disabled]="saving()">Buat QR Code</button>
              </form>

              <div>
                @if (!qrCodes().length) {
                  <p class="ap-empty">Belum ada QR Code meja.</p>
                } @else {
                  <ul class="ap-qr-list">
                    @for (qr of qrCodes(); track qr.id) {
                      <li class="ap-qr">
                        <img [src]="qr.qr_image_url" [alt]="'QR ' + qr.table_label">
                        <div class="ap-qr-info">
                          <b>{{ qr.table_label }}</b>
                          <span class="ap-url">{{ qr.target_url }}</span>
                          @if (isForeignUrl(qr.target_url)) {
                            <span class="ap-warn">Link ini tidak mengarah ke situs ini — sebaiknya hapus dan buat ulang.</span>
                          }
                        </div>
                        <div class="ap-row-actions">
                          <button type="button" class="ap-btn ap-btn-line ap-btn-sm" (click)="printQrCode(qr)">Cetak</button>
                          <button type="button" class="ap-icon danger" (click)="deleteQrCode(qr)" title="Hapus" aria-label="Hapus"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          </section>
        }
      }
    </main>

    <!-- ADD / EDIT MODAL -->
    @if (showMenuModal()) {
      <div class="ap-overlay" (click)="closeMenuModal()">
        <div class="ap-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="ap-modal-head">
            <h2 class="ap-h2">{{ modalItem.id ? 'Edit Hidangan' : 'Tambah Hidangan' }}</h2>
            <button type="button" class="ap-x" aria-label="Tutup" (click)="closeMenuModal()">×</button>
          </div>

          <div class="ap-modal-body">
            <form (submit)="saveMenuItem($event)" class="ap-stack" id="menuForm">
              <div class="ap-grid2">
                <label class="ap-field">
                  <span>Kategori</span>
                  <select class="ap-input" name="modalCategory" [(ngModel)]="modalItem.category_id">
                    @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
                  </select>
                </label>
                <label class="ap-field">
                  <span>Harga (¥, termasuk pajak)</span>
                  <input class="ap-input" type="number" min="0" step="1" name="modalPrice" [(ngModel)]="modalItem.price">
                </label>
              </div>

              <div class="ap-field">
                <span>Foto hidangan</span>
                <div class="ap-upload">
                  <div class="ap-thumb ap-thumb-lg bb-ph">
                    @if (modalItem.image_url) { <img [src]="modalItem.image_url" alt=""> }
                  </div>
                  <div class="ap-stack-sm">
                    <label class="ap-btn ap-btn-line ap-btn-sm ap-file">
                      {{ uploadingImage() ? 'Mengupload…' : (modalItem.image_url ? 'Ganti foto' : 'Pilih foto') }}
                      <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onImageUpload($event)" [disabled]="uploadingImage()">
                    </label>
                    @if (modalItem.image_url) {
                      <button type="button" class="ap-link" (click)="modalItem.image_url = ''">Hapus foto</button>
                    }
                    <small class="ap-hint">JPG/PNG/WebP, maks. 3 MB.</small>
                  </div>
                </div>
              </div>

              <div class="ap-toggles">
                <label class="ap-check"><input type="checkbox" name="modalRecommended" [(ngModel)]="modalItem.is_recommended"> Andalan</label>
                <label class="ap-check"><input type="checkbox" name="modalAvailable" [(ngModel)]="modalItem.is_available"> Tersedia</label>
                <label class="ap-check"><input type="checkbox" name="modalVegetarian" [(ngModel)]="modalItem.is_vegetarian"> Vegetarian</label>
              </div>

              <div class="ap-field">
                <span>Tingkat pedas</span>
                <div class="ap-seg">
                  @for (lvl of [0, 1, 2, 3]; track lvl) {
                    <button type="button" [class.on]="(modalItem.spicy_level || 0) === lvl" (click)="modalItem.spicy_level = lvl">{{ lvl === 0 ? 'Tidak' : chili(lvl) }}</button>
                  }
                </div>
              </div>

              <label class="ap-field">
                <span>Info alergi</span>
                <input class="ap-input" type="text" name="modalAllergy" [(ngModel)]="modalItem.allergy_info" placeholder="Contoh: kacang, susu">
              </label>

              <div class="ap-field">
                <span>Nama & deskripsi</span>
                <div class="ap-chips">
                  @for (l of lang.languages; track l.code) {
                    <button type="button" class="ap-chip" [class.on]="modalActiveLang() === l.code" (click)="modalActiveLang.set(l.code)">
                      {{ l.code.toUpperCase() }}@if (!getText('name', l.code)) {<span class="ap-dot" title="Belum diisi"></span>}
                    </button>
                  }
                </div>
                <input class="ap-input" type="text" [placeholder]="'Nama (' + langName(modalActiveLang()) + ')'"
                  [value]="getText('name', modalActiveLang())" (input)="setText('name', modalActiveLang(), $any($event.target).value)">
                <textarea class="ap-input" rows="3" [placeholder]="'Deskripsi (' + langName(modalActiveLang()) + ')'"
                  [value]="getText('desc', modalActiveLang())" (input)="setText('desc', modalActiveLang(), $any($event.target).value)"></textarea>
                @if (modalActiveLang() !== 'id') { <small class="ap-hint">Kosong = memakai teks Bahasa Indonesia.</small> }
              </div>

              @if (modalError()) { <p class="ap-error" role="alert">{{ modalError() }}</p> }
            </form>

            <!-- Preview: same look as a row on /menu -->
            <aside class="ap-preview">
              <span class="bb-mono">Pratinjau di menu</span>
              <div class="ap-pv-row" [class.out]="!modalItem.is_available">
                <div class="ap-pv-thumb bb-ph">@if (modalItem.image_url) { <img [src]="modalItem.image_url" alt=""> }</div>
                <div class="ap-pv-body">
                  <div class="ap-pv-top">
                    <span class="ap-pv-name">{{ getText('name', modalActiveLang()) || modalItem.name_id || 'Nama hidangan' }}</span>
                    <span class="ap-pv-leader"></span>
                    <span class="ap-pv-price">{{ yen(modalItem.price) }}</span>
                  </div>
                  @if (modalItem.name_ja && modalActiveLang() !== 'ja') { <span class="bb-jp">{{ modalItem.name_ja }}</span> }
                  <span class="ap-pv-desc">{{ getText('desc', modalActiveLang()) || modalItem.desc_id || 'Deskripsi hidangan…' }}</span>
                  <div class="ap-row-meta">
                    @if (modalItem.is_recommended) { <span class="bb-tag bb-tag-sig">Andalan</span> }
                    @if (modalItem.spicy_level) { <span class="bb-tag bb-tag-spicy">{{ chili(modalItem.spicy_level) }} Pedas</span> }
                    @if (modalItem.is_vegetarian) { <span class="bb-tag bb-tag-veg">Vegetarian</span> }
                    @if (!modalItem.is_available) { <span class="bb-tag bb-tag-out">Habis</span> }
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div class="ap-modal-foot">
            <button type="button" class="ap-btn ap-btn-line" (click)="closeMenuModal()">Batal</button>
            <button type="submit" form="menuForm" class="ap-btn ap-btn-accent" [disabled]="saving() || uploadingImage()">{{ saving() ? 'Menyimpan…' : 'Simpan' }}</button>
          </div>
        </div>
      </div>
    }

    @if (toast(); as t) {
      <div class="ap-toast" [class.err]="t.error" role="status">{{ t.msg }}</div>
    }
  </div>
  `,
  styles: [`
    /* Header */
    .ap-hdr { position: sticky; top: 0; z-index: 50; background: rgba(246,241,232,.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid rgba(42,33,27,.08); }
    .ap-hdr-row { padding-top: 14px; padding-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .ap-logo img { height: 40px; width: auto; }
    .ap-nav { display: flex; align-items: center; gap: clamp(14px, 3vw, 28px); font-size: 14px; font-weight: 500; }
    .ap-nav a { color: var(--ink); }
    .ap-nav a:hover { color: var(--accent); }

    .ap-main { padding-top: clamp(32px, 5vw, 64px); padding-bottom: 96px; }
    .ap-muted { color: var(--ink-3); font-size: 14px; line-height: 1.5; }
    .ap-hint { color: var(--muted); font-size: 12px; line-height: 1.5; }
    .ap-hint b { font-weight: 600; color: var(--ink-3); }
    .ap-error { color: var(--accent-deep); background: #f3dccb; padding: 10px 14px; border-radius: 12px; font-size: 14px; }
    .ap-empty { padding: 48px 0; text-align: center; color: var(--ink-3); }

    /* Buttons */
    .ap-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 20px; border-radius: 999px; border: 1px solid transparent; font: 600 14px var(--sans); cursor: pointer; white-space: nowrap; }
    .ap-btn:disabled { opacity: .5; cursor: not-allowed; }
    .ap-btn-sm { height: 36px; padding: 0 14px; font-size: 13px; }
    .ap-btn-lg { height: 52px; width: 100%; font-size: 15px; }
    .ap-btn-accent { background: var(--accent); color: var(--cream); }
    .ap-btn-accent:hover:not(:disabled) { background: var(--accent-hover); }
    .ap-btn-dark { background: var(--ink); color: var(--bg); }
    .ap-btn-dark:hover { background: var(--accent); }
    .ap-btn-line { background: transparent; color: var(--ink); border-color: rgba(42,33,27,.2); }
    .ap-btn-line:hover { border-color: var(--ink); }
    .ap-link { background: none; border: 0; padding: 0; color: var(--accent); font: 600 13px var(--sans); cursor: pointer; text-align: left; }
    .ap-icon { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(42,33,27,.14); background: transparent; color: var(--ink-2); cursor: pointer; font-size: 13px; }
    .ap-icon:hover { border-color: var(--ink); color: var(--ink); }
    .ap-icon.danger:hover { color: var(--accent); }

    /* Forms */
    .ap-stack { display: flex; flex-direction: column; gap: 18px; }
    .ap-stack-sm { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
    .ap-field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
    .ap-field > span:first-child { font-size: 13px; font-weight: 600; color: var(--ink-2); }
    .ap-input { width: 100%; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(42,33,27,.16); background: var(--surface); font: 500 15px var(--sans); color: var(--ink); outline: none; line-height: 1.5; }
    .ap-input:focus { border-color: var(--ink); }
    textarea.ap-input { resize: vertical; }
    select.ap-input { height: 48px; }
    .ap-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 18px; }
    .ap-actions { display: flex; justify-content: flex-end; align-items: center; gap: 16px; flex-wrap: wrap; }
    .ap-preview-rows { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; border-radius: 14px; background: var(--bg-alt); font-size: 13px; }
    .ap-preview-rows div { display: flex; justify-content: space-between; gap: 12px; }
    .ap-preview-rows span { color: var(--ink-3); }
    .ap-preview-rows b { font-weight: 600; text-align: right; }

    /* Login */
    .ap-login { max-width: 420px; margin: clamp(24px, 6vw, 64px) auto 0; padding: clamp(28px, 5vw, 44px); background: var(--surface); border: 1px solid rgba(42,33,27,.08); border-radius: 28px; display: flex; flex-direction: column; gap: 10px; }
    .ap-login-title { font-size: 44px; line-height: 1; }
    .ap-login form { margin-top: 18px; }

    /* Dashboard */
    .ap-head { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
    .ap-title { font-size: clamp(44px, 6vw, 80px); line-height: .95; letter-spacing: -0.02em; }
    .ap-tabs { display: flex; gap: 4px; margin-bottom: 20px; overflow-x: auto; scrollbar-width: none; }
    .ap-tabs button { flex: none; height: 42px; padding: 0 18px; border-radius: 999px; border: 0; background: transparent; color: var(--ink); font: 600 14px var(--sans); cursor: pointer; }
    .ap-tabs button:hover { background: var(--hover-soft); }
    .ap-tabs button.on { background: var(--ink); color: var(--bg); }
    .ap-panel { background: var(--surface); border: 1px solid rgba(42,33,27,.08); border-radius: 28px; padding: clamp(20px, 3.5vw, 40px); }
    .ap-panel-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 24px; }
    .ap-h2 { font-size: clamp(30px, 3.4vw, 40px); line-height: 1; margin-bottom: 6px; }
    .ap-h3 { font-size: 26px; line-height: 1; }
    .ap-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .ap-scroll { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
    .ap-chip { position: relative; flex: none; height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(42,33,27,.12); background: transparent; color: var(--ink); font: 600 13px var(--sans); cursor: pointer; white-space: nowrap; }
    .ap-chip:hover { background: var(--hover-soft); }
    .ap-chip.on { background: var(--ink); border-color: var(--ink); color: var(--bg); }
    .ap-dot { position: absolute; top: 4px; right: 5px; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }

    /* Menu list */
    .ap-toolbar { display: flex; flex-direction: column; gap: 12px; margin-bottom: 8px; }
    .ap-search { max-width: 360px; border-radius: 999px; padding: 10px 18px; }
    .ap-list { list-style: none; margin: 0; padding: 0; }
    .ap-row { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto auto auto; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid rgba(42,33,27,.08); }
    .ap-row.out .ap-thumb, .ap-row.out .ap-row-main { opacity: .5; }
    .ap-thumb { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; }
    .ap-thumb-lg { width: 96px; height: 96px; border-radius: 16px; flex: none; }
    .ap-row-name { font-family: var(--serif); font-size: 22px; line-height: 1.15; }
    .ap-row-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 4px; font-size: 13px; color: var(--muted); }
    .ap-row-price { font-weight: 700; font-size: 15px; white-space: nowrap; }
    .ap-row-actions { display: flex; gap: 6px; align-items: center; }
    .ap-switch { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px 0 4px; border-radius: 999px; border: 1px solid rgba(42,33,27,.14); background: transparent; font: 600 12px var(--sans); color: var(--ink-3); cursor: pointer; min-width: 104px; }
    .ap-knob { width: 24px; height: 24px; border-radius: 50%; background: #d9cbb8; }
    .ap-switch.on { color: #2f4a33; background: #dde6d6; border-color: transparent; }
    .ap-switch.on .ap-knob { background: #2f4a33; }
    @media (max-width: 720px) {
      .ap-row { grid-template-columns: 56px minmax(0, 1fr) auto; row-gap: 10px; }
      .ap-row-price { grid-column: 3; grid-row: 1; }
      .ap-switch { grid-column: 2; }
      .ap-row-actions { grid-column: 3; justify-self: end; }
    }

    /* QR */
    .ap-qr-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 24px; align-items: start; }
    .ap-card { padding: 24px; border-radius: 22px; background: var(--bg); }
    .ap-qr-list { list-style: none; margin: 0; padding: 0; }
    .ap-qr { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(42,33,27,.08); }
    .ap-qr img { width: 64px; height: 64px; border-radius: 10px; background: #fff; flex: none; }
    .ap-qr-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .ap-url { font-size: 12px; color: var(--muted); overflow-wrap: anywhere; }
    .ap-warn { font-size: 12px; color: var(--accent-deep); font-weight: 600; }

    /* Modal */
    .ap-overlay { position: fixed; inset: 0; z-index: 80; background: rgba(26,18,12,.5); backdrop-filter: blur(3px); display: flex; align-items: flex-end; justify-content: center; animation: bbFade .2s ease; }
    .ap-modal { width: min(980px, 100%); max-height: 94vh; display: flex; flex-direction: column; background: var(--bg); border-radius: 28px 28px 0 0; animation: bbUp .3s cubic-bezier(.2,.8,.2,1); }
    @media (min-width: 900px) { .ap-overlay { align-items: center; padding: 24px; } .ap-modal { border-radius: 28px; } }
    .ap-modal-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 24px clamp(20px, 3vw, 32px) 12px; }
    .ap-x { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(42,33,27,.16); background: transparent; font: 500 22px var(--sans); color: var(--ink); cursor: pointer; flex: none; }
    .ap-modal-body { overflow: auto; overscroll-behavior: contain; padding: 8px clamp(20px, 3vw, 32px) 24px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 360px); gap: 32px; align-items: start; }
    @media (max-width: 860px) { .ap-modal-body { grid-template-columns: 1fr; } .ap-preview { order: -1; } }
    .ap-modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px clamp(20px, 3vw, 32px) calc(16px + env(safe-area-inset-bottom)); border-top: 1px solid rgba(42,33,27,.1); }
    .ap-upload { display: flex; align-items: center; gap: 16px; }
    .ap-file { position: relative; overflow: hidden; }
    .ap-file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .ap-toggles { display: flex; flex-wrap: wrap; gap: 8px; }
    .ap-check { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(42,33,27,.14); font-size: 14px; font-weight: 600; cursor: pointer; background: var(--surface); }
    .ap-check input { width: 16px; height: 16px; accent-color: var(--accent); }
    .ap-seg { display: flex; border: 1px solid rgba(42,33,27,.16); border-radius: 999px; padding: 3px; width: fit-content; background: var(--surface); }
    .ap-seg button { height: 34px; padding: 0 14px; border: 0; border-radius: 999px; background: transparent; font: 600 13px var(--sans); color: var(--ink); cursor: pointer; }
    .ap-seg button.on { background: var(--ink); color: var(--bg); }

    /* Preview */
    .ap-preview { position: sticky; top: 0; display: flex; flex-direction: column; gap: 12px; padding: 20px; border-radius: 22px; background: var(--bg-alt); }
    .ap-pv-row { display: flex; gap: 14px; }
    .ap-pv-row.out { opacity: .55; }
    .ap-pv-thumb { flex: none; width: 84px; height: 84px; border-radius: 14px; overflow: hidden; }
    .ap-pv-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .ap-pv-top { display: flex; align-items: baseline; gap: 8px; }
    .ap-pv-name { font-family: var(--serif); font-size: 22px; line-height: 1.1; min-width: 0; overflow-wrap: anywhere; }
    .ap-pv-leader { flex: 1; min-width: 12px; border-bottom: 1px dotted rgba(42,33,27,.3); transform: translateY(-5px); }
    .ap-pv-price { font-weight: 700; white-space: nowrap; }
    .ap-pv-desc { font-size: 13px; line-height: 1.5; color: var(--ink-2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  `]
})
export class AdminComponent implements OnInit {
  readonly lang = inject(LanguageService);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly api = getApiBase();
  // The app is zoneless: plain fields changed in async callbacks need an explicit re-render.
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isLoggedIn = signal(false);
  readonly activeTab = signal<Tab>('info');
  readonly saving = signal(false);
  readonly toast = signal<{ msg: string; error: boolean } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  // Login
  loginEmail = '';
  loginPassword = '';
  readonly loginError = signal('');

  // Restaurant info
  infoEditLang: LanguageCode = 'id';
  infoAbout = '';
  infoTransport = '';
  infoContact = '';
  infoHours = '';
  private infoSnapshot = JSON.stringify(['', '', '', '']); // matches the empty form until data loads

  // Menu
  readonly categories = signal<Category[]>([]);
  readonly menuItems = signal<AdminMenuItem[]>([]);
  readonly menuLoading = signal(false);
  readonly showMenuModal = signal(false);
  readonly uploadingImage = signal(false);
  readonly modalActiveLang = signal<LanguageCode>('id');
  readonly modalError = signal('');
  readonly adminFilterCategory = signal<number | 'all'>('all');
  readonly adminSearchQuery = signal('');
  modalItem: AdminMenuItem = this.getEmptyModalItem();

  // QR
  readonly qrCodes = signal<QrCode[]>([]);
  qrTableLabel = '';
  qrTargetUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu` : '';

  readonly soldOutCount = computed(() => this.menuItems().filter(i => !i.is_available).length);

  readonly filteredAdminMenuItems = computed(() => {
    const cat = this.adminFilterCategory();
    const q = this.adminSearchQuery().toLowerCase().trim();
    return this.menuItems().filter(i =>
      (cat === 'all' || i.category_id === cat) &&
      (!q || [i.name_id, i.name_en, i.name_ja, i.name_zh, i.name_ko, i.name_es].some(n => n?.toLowerCase().includes(q)))
    );
  });

  constructor() {
    // Private management page: keep it out of search results.
    this.titleService.setTitle('Admin — BALI BONG');
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    // Each tab loads its own data when opened (and on login).
    effect(() => {
      if (!this.isLoggedIn()) return;
      const tab = this.activeTab();
      if (tab === 'info') this.loadRestaurantInfoForEdit();
      if (tab === 'menu') this.loadAdminMenu();
      if (tab === 'qr') this.loadQrCodes();
    });
  }

  ngOnInit() {
    if (typeof window === 'undefined') return;
    // A stored token can be expired; showing the dashboard anyway meant the
    // first failed save threw away whatever the admin had just typed.
    if (this.tokenValid(localStorage.getItem(TOKEN_KEY))) {
      this.isLoggedIn.set(true);
      this.loadCategories();
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showMenuModal()) this.closeMenuModal();
  }

  // --- helpers ---
  yen(n: number | null | undefined): string {
    return '¥' + (Number(n) || 0).toLocaleString('ja-JP');
  }
  chili(level: number): string {
    return '🌶'.repeat(Math.min(3, level));
  }
  categoryName(id: number): string {
    return this.categories().find(c => c.id === id)?.name ?? '—';
  }
  langName(code: LanguageCode): string {
    return this.lang.languages.find(l => l.code === code)?.name ?? code;
  }
  getText(kind: TextKind, code: LanguageCode): string {
    return (this.modalItem as any)[`${kind}_${code}`] || '';
  }
  setText(kind: TextKind, code: LanguageCode, value: string) {
    (this.modalItem as any)[`${kind}_${code}`] = value;
  }
  hoursPreview() { return toInfoRows(this.infoHours, HOURS_SEPARATOR); }
  contactPreview() { return toInfoRows(this.infoContact, CONTACT_SEPARATOR); }
  isForeignUrl(url: string): boolean {
    try { return new URL(url).origin !== window.location.origin; } catch { return true; }
  }

  private notify(msg: string, error = false) {
    clearTimeout(this.toastTimer);
    this.toast.set({ msg, error });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }

  private tokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !payload.exp || payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private headers() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ''}` }) };
  }

  // Every 401/403 means the 12h token expired: drop back to login with a reason.
  private fail(err: any, what: string) {
    this.saving.set(false);
    if (err.status === 401 || err.status === 403) {
      this.logout();
      this.loginError.set('Sesi admin sudah habis. Silakan login kembali.');
      return;
    }
    console.error(what, err);
    this.notify(`${what}: ${err.error?.error || err.message || 'kesalahan jaringan'}`, true);
  }

  // --- auth ---
  login(event: Event) {
    event.preventDefault();
    this.saving.set(true);
    this.loginError.set('');
    this.http.post<{ token: string }>(`${this.api}/admin/auth/login`, { email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: (data) => {
        this.saving.set(false);
        localStorage.setItem(TOKEN_KEY, data.token);
        this.loginPassword = '';
        this.cdr.markForCheck();
        this.isLoggedIn.set(true);
        this.loadCategories();
      },
      error: (err) => {
        this.saving.set(false);
        this.loginError.set(err.status === 429
          ? 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'
          : err.error?.error || 'Kombinasi email dan password salah.');
      }
    });
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.showMenuModal.set(false);
  }

  switchTab(tab: Tab) {
    if (tab === this.activeTab()) return;
    if (this.activeTab() === 'info' && this.infoDirty() && !confirm('Perubahan info restoran belum disimpan. Tinggalkan?')) return;
    this.activeTab.set(tab);
  }

  // --- restaurant info ---
  private infoState() {
    return JSON.stringify([this.infoAbout, this.infoTransport, this.infoContact, this.infoHours]);
  }
  infoDirty(): boolean {
    return this.infoState() !== this.infoSnapshot;
  }

  switchInfoLang(code: LanguageCode) {
    if (code === this.infoEditLang) return;
    if (this.infoDirty() && !confirm('Perubahan belum disimpan. Pindah bahasa dan buang perubahan?')) return;
    this.infoEditLang = code;
    this.loadRestaurantInfoForEdit();
  }

  loadRestaurantInfoForEdit() {
    const lang = this.infoEditLang;
    this.http.get<any>(`${this.api}/restaurant-info?lang=${lang}`).subscribe({
      next: (data) => {
        if (lang !== this.infoEditLang) return; // a newer language was picked meanwhile
        this.infoAbout = data.about || '';
        this.infoTransport = data.transportation || '';
        this.infoContact = data.contact || '';
        this.infoHours = data.hours || '';
        this.infoSnapshot = this.infoState();
        this.cdr.markForCheck();
      },
      error: (err) => this.fail(err, 'Gagal memuat info restoran')
    });
  }

  saveRestaurantInfo(event: Event) {
    event.preventDefault();
    this.saving.set(true);
    const sent = this.infoState();
    this.http.put(`${this.api}/admin/restaurant-info`, {
      lang: this.infoEditLang,
      about: this.infoAbout,
      transportation: this.infoTransport,
      contact: this.infoContact,
      hours: this.infoHours
    }, this.headers()).subscribe({
      next: () => {
        this.saving.set(false);
        this.infoSnapshot = sent;
        this.cdr.markForCheck();
        this.notify(`Info restoran (${this.infoEditLang.toUpperCase()}) tersimpan`);
      },
      error: (err) => this.fail(err, 'Gagal menyimpan info')
    });
  }

  // --- menu ---
  private loadCategories() {
    this.http.get<{ categories: Category[] }>(`${this.api}/menu?lang=id`).subscribe({
      next: (data) => this.categories.set((data.categories || []).map(c => ({ id: c.id, name: c.name }))),
      error: (err) => console.error('Error loading categories', err)
    });
  }

  loadAdminMenu() {
    this.menuLoading.set(true);
    this.http.get<AdminMenuItem[]>(`${this.api}/admin/menu`, this.headers()).subscribe({
      next: (data) => {
        this.menuItems.set(data || []);
        this.menuLoading.set(false);
      },
      error: (err) => {
        this.menuLoading.set(false);
        this.fail(err, 'Gagal memuat menu');
      }
    });
  }

  getEmptyModalItem(): AdminMenuItem {
    return {
      category_id: this.categories()[0]?.id ?? 1,
      price: 0,
      image_url: null,
      allergy_info: '',
      is_recommended: false,
      is_available: true,
      spicy_level: 0,
      is_vegetarian: false,
      name_id: '', desc_id: '',
      name_en: '', desc_en: '',
      name_ja: '', desc_ja: '',
      name_zh: '', desc_zh: '',
      name_ko: '', desc_ko: '',
      name_es: '', desc_es: ''
    };
  }

  openAddModal() {
    this.openModal(this.getEmptyModalItem());
  }

  openEditModal(item: AdminMenuItem) {
    this.openModal({ ...item, spicy_level: item.spicy_level ?? 0, is_vegetarian: !!item.is_vegetarian });
  }

  private openModal(item: AdminMenuItem) {
    this.modalItem = item;
    this.modalError.set('');
    this.modalActiveLang.set('id');
    this.showMenuModal.set(true);
  }

  closeMenuModal() {
    this.showMenuModal.set(false);
  }

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow picking the same file again
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      this.modalError.set('Ukuran foto maksimal 3 MB.');
      return;
    }
    this.modalError.set('');
    this.uploadingImage.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      this.http.post<{ imageUrl: string }>(`${this.api}/admin/upload-image`, { imageBase64: reader.result, type: 'menu' }, this.headers()).subscribe({
        next: (res) => {
          this.uploadingImage.set(false);
          this.modalItem.image_url = res.imageUrl;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.uploadingImage.set(false);
          this.fail(err, 'Gagal mengupload foto');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  saveMenuItem(event: Event) {
    event.preventDefault();
    const item = this.modalItem;
    const price = Number(item.price);
    if (!(item.name_id || '').trim()) {
      this.modalActiveLang.set('id');
      this.modalError.set('Nama menu dalam Bahasa Indonesia wajib diisi.');
      return;
    }
    if (!Number.isInteger(price) || price < 0) {
      this.modalError.set('Harga harus berupa angka bulat (yen), minimal 0.');
      return;
    }
    this.modalError.set('');

    // Empty translations fall back to the Indonesian text.
    const payload: any = { ...item, price, category_id: Number(item.category_id), name_id: item.name_id!.trim() };
    for (const l of ['en', 'ja', 'zh', 'ko', 'es']) {
      if (!payload[`name_${l}`]?.trim()) payload[`name_${l}`] = payload.name_id;
      if (!payload[`desc_${l}`]?.trim()) payload[`desc_${l}`] = payload.desc_id || '';
    }

    this.saving.set(true);
    const req = item.id
      ? this.http.put(`${this.api}/admin/menu/${item.id}`, payload, this.headers())
      : this.http.post(`${this.api}/admin/menu`, payload, this.headers());
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeMenuModal();
        this.notify(`"${payload.name_id}" tersimpan`);
        this.loadAdminMenu();
      },
      error: (err) => this.fail(err, 'Gagal menyimpan menu')
    });
  }

  // Quick sold-out toggle straight from the list (optimistic, reverted on failure).
  toggleAvailable(item: AdminMenuItem) {
    const next = !item.is_available;
    const setAvail = (v: boolean) => this.menuItems.update(list => list.map(i => i.id === item.id ? { ...i, is_available: v } : i));
    setAvail(next);
    this.http.put(`${this.api}/admin/menu/${item.id}`, { is_available: next }, this.headers()).subscribe({
      next: () => this.notify(`"${item.name_id}" ${next ? 'tersedia lagi' : 'ditandai habis'}`),
      error: (err) => {
        setAvail(!next);
        this.fail(err, 'Gagal mengubah status');
      }
    });
  }

  deleteMenuItem(item: AdminMenuItem) {
    if (!confirm(`Hapus "${item.name_id}" secara permanen?`)) return;
    this.http.delete(`${this.api}/admin/menu/${item.id}`, this.headers()).subscribe({
      next: () => {
        this.menuItems.update(list => list.filter(i => i.id !== item.id));
        this.notify(`"${item.name_id}" dihapus`);
      },
      error: (err) => this.fail(err, 'Gagal menghapus menu')
    });
  }

  // --- QR ---
  loadQrCodes() {
    this.http.get<QrCode[]>(`${this.api}/admin/qr`, this.headers()).subscribe({
      next: (data) => this.qrCodes.set(data || []),
      error: (err) => this.fail(err, 'Gagal memuat QR Code')
    });
  }

  generateQrCode(event: Event) {
    event.preventDefault();
    if (!this.qrTableLabel.trim()) return;
    this.saving.set(true);
    this.http.post(`${this.api}/admin/qr`, { table_label: this.qrTableLabel.trim(), target_url: this.qrTargetUrl }, this.headers()).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify(`QR "${this.qrTableLabel.trim()}" dibuat`);
        this.qrTableLabel = '';
        this.cdr.markForCheck();
        this.loadQrCodes();
      },
      error: (err) => this.fail(err, 'Gagal membuat QR Code')
    });
  }

  deleteQrCode(qr: QrCode) {
    if (!confirm(`Hapus QR "${qr.table_label}"?`)) return;
    this.http.delete(`${this.api}/admin/qr/${qr.id}`, this.headers()).subscribe({
      next: () => {
        this.qrCodes.update(list => list.filter(q => q.id !== qr.id));
        this.notify(`QR "${qr.table_label}" dihapus`);
      },
      error: (err) => this.fail(err, 'Gagal menghapus QR Code')
    });
  }

  printQrCode(qr: QrCode) {
    const w = window.open('', '_blank');
    if (!w) {
      this.notify('Pop-up diblokir browser. Izinkan pop-up untuk mencetak.', true);
      return;
    }
    const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>QR ${esc(qr.table_label)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Manrope:wght@500;600&family=Noto+Serif+JP&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fff; font-family: Manrope, sans-serif; color: #2a211b; }
        .card { width: 340px; padding: 36px 32px; border-radius: 28px; background: #f6f1e8; text-align: center; }
        .logo { height: 56px; margin-bottom: 20px; }
        .qr { width: 230px; height: 230px; padding: 12px; background: #fff; border-radius: 18px; }
        .table { font-family: 'Instrument Serif', serif; font-size: 44px; line-height: 1; margin: 20px 0 10px; }
        .scan { font-size: 13px; color: #5a4a3e; line-height: 1.6; }
        .jp { font-family: 'Noto Serif JP', serif; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
      <div class="card">
        <img class="logo" src="${window.location.origin}/public/images/assets/logo.png" alt="BALI BONG">
        <div><img class="qr" src="${qr.qr_image_url}" alt="QR"></div>
        <div class="table">${esc(qr.table_label)}</div>
        <div class="scan">Pindai untuk melihat menu · Scan for the menu<br><span class="jp">メニューはこちら</span> · 6 bahasa / languages</div>
      </div>
      <script>window.onload = () => setTimeout(() => window.print(), 300);<\/script>
      </body></html>`);
    w.document.close();
  }
}
