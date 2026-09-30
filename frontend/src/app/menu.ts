import { Component, OnInit, OnDestroy, inject, signal, effect, computed, PLATFORM_ID, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { LanguageService, LanguageCode } from './language.service';
import { SiteHeaderComponent } from './site-header';
import { getApiBase } from './api-base';

interface Category {
  id: number;
  slug: string;
  name: string;
  name_ja: string | null;
}

interface MenuItem {
  id: number;
  category_id: number;
  price: number;
  image_url: string | null;
  allergy_info: string | null;
  is_recommended: boolean;
  is_available: boolean;
  spicy_level?: number;
  is_vegetarian?: boolean;
  name: string;
  name_ja: string | null;
  description: string;
  category_slug: string;
}

interface Tag { label: string; cls: string; }

const CART_KEY = 'balibong_cart';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, SiteHeaderComponent],
  template: `
  <div class="bb page">
    <app-site-header active="menu">
      <div class="subbar">
        <div class="bb-wrap subrow">
          <div class="chips">
            @for (g of groups(); track g.slug) {
              <button type="button" class="chip" [class.on]="active() === g.slug" [attr.data-slug]="g.slug" (click)="goTo(g.slug)">{{ g.name }}</button>
            }
          </div>
          <div class="search">
            <input type="search" [value]="query()" (input)="query.set($any($event.target).value)" [placeholder]="t('search_short')" [attr.aria-label]="t('search_placeholder')">
            <span class="search-ic"></span>
          </div>
        </div>
      </div>
    </app-site-header>

    <!-- Title -->
    <section class="bb-wrap intro">
      <div>
        <div class="bb-eyebrow-row mb16">
          <span class="bb-eyebrow">{{ t('hero_subtitle') }}</span>
          @if (showJp()) { <span class="bb-jp">メニュー</span> }
        </div>
        <h1 class="title">{{ t('menu_title') }}</h1>
      </div>
      <div class="intro-side">
        <p>{{ t('menu_hint') }}</p>
        <div class="meta"><span>{{ t('tax_included') }}</span><span>·</span><span>{{ t('ask_allergy') }}</span></div>
      </div>
    </section>

    @if (loading()) {
      <p class="bb-wrap state">{{ t('loading') }}</p>
    } @else if (loadError()) {
      <div class="bb-wrap state">
        <p>{{ t('menu_error') }}</p>
        <button type="button" class="bb-btn btn-outline" (click)="fetchMenu(lang.currentLang())">{{ t('retry_button') }}</button>
      </div>
    } @else {
      <!-- Signature -->
      @if (!needle() && featured().length) {
        <section class="bb-wrap feat-pad">
          <div class="feat">
            @for (f of featured(); track f.id) {
              <button type="button" class="feat-card" (click)="openDetail(f)">
                <div class="feat-img bb-ph">
                  @if (f.image_url) { <img [src]="f.image_url" [alt]="f.name" loading="lazy"> }
                  <span class="feat-badge">{{ t('signature_tag') }}</span>
                  <span class="feat-plus" aria-hidden="true">+</span>
                </div>
                <div class="feat-meta">
                  <span class="feat-name">{{ f.name }}</span>
                  <span class="feat-price">{{ yen(f.price) }}</span>
                </div>
              </button>
            }
          </div>
        </section>
      }

      <main class="bb-wrap">
        @if (!groups().length) {
          <div class="empty">
            <p>{{ t('no_match') }}</p>
            <button type="button" class="bb-btn btn-outline" (click)="query.set('')">{{ t('clear_search') }}</button>
          </div>
        }
        <div class="groups">
          @for (g of groups(); track g.slug) {
            <section [id]="g.slug" class="group">
              <div class="group-head">
                <div class="group-title">
                  <span class="num">{{ g.num }}</span>
                  <h2>{{ g.name }}</h2>
                  @if (showJp() && g.name_ja) { <span class="bb-jp jp14">{{ g.name_ja }}</span> }
                </div>
                <span class="count">{{ fmt('dish_count', g.items.length) }}</span>
              </div>
              <div class="items">
                @for (it of g.items; track it.id) {
                  <button type="button" class="item" [class.out]="!it.is_available" (click)="openDetail(it)">
                    <div class="thumb bb-ph">
                      @if (it.image_url) { <img [src]="it.image_url" [alt]="it.name" loading="lazy"> }
                      @if (cart()[it.id]) { <span class="qty-badge">{{ cart()[it.id] }}</span> }
                    </div>
                    <div class="item-body">
                      <div class="item-top">
                        <span class="item-name">{{ it.name }}</span>
                        <span class="leader"></span>
                        <span class="item-price">{{ yen(it.price) }}</span>
                      </div>
                      @if (showJp() && it.name_ja && it.name_ja !== it.name) { <span class="bb-jp">{{ it.name_ja }}</span> }
                      @if (it.description) { <span class="item-desc">{{ it.description }}</span> }
                      @if (it.tags.length) {
                        <div class="tags">
                          @for (tg of it.tags; track tg.label) { <span class="bb-tag" [class]="tg.cls">{{ tg.label }}</span> }
                        </div>
                      }
                    </div>
                  </button>
                }
              </div>
            </section>
          }
        </div>
      </main>
    }

    <footer class="bb-wrap foot">
      <span>© 2026 Bali Bong. {{ t('all_rights') }}</span>
      <div class="foot-links">
        <a routerLink="/">{{ t('home_tab') }}</a>
        <a routerLink="/admin">{{ t('admin_tab') }}</a>
      </div>
    </footer>

    <!-- Floating order bar -->
    @if (cartCount() > 0 && !cartOpen() && !detail()) {
      <div class="bar-wrap">
        <button type="button" class="bar" (click)="cartOpen.set(true)">
          <span class="bar-l"><span class="bar-n">{{ cartCount() }}</span>{{ t('order_list') }}</span>
          <span class="bar-total">{{ yen(cartTotal()) }}</span>
        </button>
      </div>
    }

    <!-- Detail sheet -->
    @if (detail(); as d) {
      <div class="overlay" (click)="closeAll()">
        <div class="sheet" role="dialog" aria-modal="true" [attr.aria-label]="d.name" (click)="$event.stopPropagation()">
          <div class="sheet-img bb-ph">
            @if (d.image_url) { <img [src]="d.image_url" [alt]="d.name"> }
            <button type="button" class="x x-img" [attr.aria-label]="t('close')" (click)="closeAll()">×</button>
          </div>
          <div class="sheet-body">
            @if (d.tags.length) {
              <div class="tags mb14">
                @for (tg of d.tags; track tg.label) { <span class="bb-tag" [class]="tg.cls">{{ tg.label }}</span> }
              </div>
            }
            <h3 class="sheet-name">{{ d.name }}</h3>
            @if (showJp() && d.name_ja && d.name_ja !== d.name) { <div class="bb-jp jp15">{{ d.name_ja }}</div> }
            @if (d.description) { <p class="sheet-desc">{{ d.description }}</p> }
            @if (d.allergy_info) { <p class="allergy"><span class="bb-mono">{{ t('allergy_label') }}</span> {{ d.allergy_info }}</p> }
            <div class="add-row">
              <div class="stepper">
                <button type="button" aria-label="−" (click)="decDraft()">−</button>
                <span>{{ draft() }}</span>
                <button type="button" aria-label="+" (click)="draft.set(draft() + 1)">+</button>
              </div>
              <button type="button" class="add" [disabled]="!d.is_available && !cart()[d.id]" (click)="saveDraft()">
                <span>{{ !d.is_available && !cart()[d.id] ? t('sold_out') : cart()[d.id] ? t('update_list') : t('add_to_list') }}</span>
                <span>{{ yen(draft() * d.price) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Order list sheet -->
    @if (cartOpen()) {
      <div class="overlay" (click)="closeAll()">
        <div class="sheet sheet-pad" role="dialog" aria-modal="true" [attr.aria-label]="t('order_list')" (click)="$event.stopPropagation()">
          <div class="cart-head">
            <div>
              <h3 class="cart-title">{{ t('order_list') }}</h3>
              @if (showJp()) { <div class="bb-jp jp14 mt6">ご注文リスト</div> }
            </div>
            <button type="button" class="x x-line" [attr.aria-label]="t('close')" (click)="closeAll()">×</button>
          </div>
          <p class="cart-help">{{ t('show_staff') }}</p>
          <div class="lines">
            @for (c of cartLines(); track c.item.id) {
              <div class="line">
                <div class="line-name">
                  <div class="serif22">{{ c.item.name }}</div>
                  @if (c.item.name_ja && c.item.name_ja !== c.item.name) { <div class="bb-jp">{{ c.item.name_ja }}</div> }
                </div>
                <div class="stepper sm">
                  <button type="button" aria-label="−" (click)="setQty(c.item.id, c.qty - 1)">−</button>
                  <span>{{ c.qty }}</span>
                  <button type="button" aria-label="+" (click)="setQty(c.item.id, c.qty + 1)">+</button>
                </div>
                <span class="line-total">{{ yen(c.qty * c.item.price) }}</span>
              </div>
            }
          </div>
          <div class="sum">
            <span>{{ fmt('total_items', cartCount()) }}</span>
            <span class="sum-n">{{ yen(cartTotal()) }}</span>
          </div>
          <button type="button" class="clear" (click)="clearCart()">{{ t('clear_list') }}</button>
        </div>
      </div>
    }
  </div>
  `,
  styles: [`
    .page { padding-bottom: 120px; }
    .mb14 { margin-bottom: 14px; } .mb16 { margin-bottom: 16px; } .mt6 { margin-top: 6px; }
    .jp14 { font-size: 14px; } .jp15 { font-size: 15px; margin-bottom: 16px; }

    /* Sub-bar: category chips + search */
    .subbar { border-top: 1px solid rgba(42,33,27,.1); }
    .subrow { padding-top: 10px; padding-bottom: 10px; display: flex; align-items: center; gap: 12px; }
    .chips { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; flex: 1; min-width: 0; }
    .chips::-webkit-scrollbar { display: none; }
    .chip { flex: none; height: 38px; padding: 0 14px; border-radius: 999px; border: 0; background: transparent; color: var(--ink); font: 600 13px var(--sans); cursor: pointer; white-space: nowrap; }
    .chip:hover { background: var(--hover-soft); }
    .chip.on { background: var(--ink); color: var(--bg); }
    .search { position: relative; flex: none; }
    .search input { height: 38px; width: min(200px, 36vw); padding: 0 14px 0 34px; border-radius: 999px; border: 1px solid rgba(42,33,27,.16); background: var(--surface); font: 500 14px var(--sans); color: var(--ink); outline: none; -webkit-appearance: none; appearance: none; }
    .search input:focus { border-color: var(--ink); }
    .search input::placeholder { color: var(--muted); }
    .search-ic { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 11px; height: 11px; border: 1.5px solid var(--muted); border-radius: 50%; pointer-events: none; }

    /* Intro */
    .intro { padding-top: clamp(40px, 6vw, 80px); padding-bottom: clamp(24px, 3vw, 40px); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 28px; }
    .title { font-size: clamp(72px, 11vw, 160px); line-height: .88; letter-spacing: -0.03em; }
    .intro-side { max-width: 380px; display: flex; flex-direction: column; gap: 14px; }
    .intro-side p { font-size: 15px; line-height: 1.65; color: var(--ink-2); }
    .meta { display: flex; flex-wrap: wrap; gap: 14px; font: 400 11px var(--mono); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }

    .state { padding-top: 80px; padding-bottom: 80px; text-align: center; font-size: 16px; color: var(--ink-2); }
    .state p { margin-bottom: 16px; }
    .btn-outline { height: 44px; padding: 0 20px; border: 1px solid var(--ink); background: transparent; color: var(--ink); letter-spacing: 0; }
    .btn-outline:hover { background: var(--ink); color: var(--bg); }

    /* Signature cards */
    .feat-pad { padding-bottom: clamp(48px, 6vw, 80px); }
    .feat { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 16px; }
    .feat-card { position: relative; text-align: left; border: 0; padding: 0; background: transparent; cursor: pointer; color: var(--ink); }
    .feat-card:hover { transform: translateY(-3px); }
    .feat-img { position: relative; aspect-ratio: 4 / 5; border-radius: 22px; overflow: hidden; }
    .feat-badge { position: absolute; left: 14px; top: 14px; padding: 5px 10px; border-radius: 999px; background: var(--accent); color: var(--cream); font-size: 11px; font-weight: 700; letter-spacing: .04em; }
    .feat-plus { position: absolute; right: 14px; bottom: 14px; width: 40px; height: 40px; border-radius: 50%; background: var(--ink); color: var(--bg); display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .feat-meta { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 14px 4px 0; }
    .feat-name { font-family: var(--serif); font-size: 26px; line-height: 1.1; }
    .feat-price { font-size: 15px; font-weight: 700; white-space: nowrap; }

    /* Category sections */
    .empty { padding: 80px 0; text-align: center; }
    .empty p { font-family: var(--serif); font-size: 36px; margin-bottom: 16px; }
    .groups { display: flex; flex-direction: column; gap: clamp(56px, 7vw, 96px); }
    .group { scroll-margin-top: 150px; }
    .group-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding-bottom: 18px; border-bottom: 1px solid var(--ink); }
    .group-title { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
    .num { font: 400 12px var(--mono); color: var(--accent); }
    .group-title h2 { font-size: clamp(36px, 4.4vw, 56px); line-height: 1; letter-spacing: -0.015em; }
    .count { font-size: 13px; color: var(--muted); white-space: nowrap; }
    .items { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 520px), 1fr)); column-gap: clamp(32px, 5vw, 72px); }
    .item { display: flex; gap: 18px; width: calc(100% + 16px); padding: 22px 8px; margin: 0 -8px; border: 0; border-bottom: 1px solid rgba(42,33,27,.1); border-radius: 0; background: transparent; text-align: left; cursor: pointer; color: var(--ink); }
    .item:hover { background: rgba(233,223,208,.5); }
    .item.out { opacity: .55; }
    .thumb { position: relative; flex: none; width: clamp(84px, 10vw, 112px); aspect-ratio: 1; border-radius: 16px; }
    .thumb img { border-radius: 16px; }
    .qty-badge { position: absolute; top: -6px; right: -6px; min-width: 26px; height: 26px; padding: 0 7px; border-radius: 999px; background: var(--accent); color: var(--cream); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 3px var(--bg); }
    .item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
    .item-top { display: flex; align-items: baseline; gap: 12px; }
    .item-name { font-family: var(--serif); font-size: 25px; line-height: 1.1; min-width: 0; }
    .leader { flex: 1; min-width: 16px; border-bottom: 1px dotted rgba(42,33,27,.3); transform: translateY(-5px); }
    .item-price { font-size: 16px; font-weight: 700; white-space: nowrap; }
    .item-desc { font-size: 14px; line-height: 1.55; color: var(--ink-2); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }

    .foot { margin-top: clamp(64px, 8vw, 120px); border-top: 1px solid var(--line); padding-top: 32px; padding-bottom: 32px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; font-size: 13px; color: var(--muted); }
    .foot-links { display: flex; gap: 20px; }
    .foot-links a { color: var(--ink-2); }
    .foot-links a:hover { color: var(--accent); }

    /* Floating bar */
    .bar-wrap { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; padding: 16px clamp(16px, 4vw, 48px) calc(16px + env(safe-area-inset-bottom)); display: flex; justify-content: center; pointer-events: none; }
    .bar { pointer-events: auto; width: min(560px, 100%); height: 64px; padding: 0 10px 0 24px; border: 0; border-radius: 999px; background: var(--ink); color: var(--bg); display: flex; align-items: center; justify-content: space-between; gap: 16px; cursor: pointer; box-shadow: 0 20px 40px -12px rgba(42,33,27,.5); animation: bbUp .35s cubic-bezier(.2,.8,.2,1); }
    .bar:hover { background: #3a2e25; }
    .bar-l { display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 600; }
    .bar-n { min-width: 28px; height: 28px; padding: 0 8px; border-radius: 999px; background: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 13px; }
    .bar-total { height: 44px; padding: 0 20px; border-radius: 999px; background: var(--bg); color: var(--ink); display: flex; align-items: center; font-size: 15px; font-weight: 700; }

    /* Sheets */
    .overlay { position: fixed; inset: 0; z-index: 80; background: rgba(26,18,12,.5); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); display: flex; align-items: flex-end; justify-content: center; animation: bbFade .2s ease; }
    .sheet { width: min(640px, 100%); max-height: 92vh; overflow: auto; overscroll-behavior: contain; background: var(--bg); border-radius: 28px 28px 0 0; animation: bbUp .3s cubic-bezier(.2,.8,.2,1); padding-bottom: env(safe-area-inset-bottom); }
    .sheet-pad { padding: 28px clamp(20px, 4vw, 36px) calc(28px + env(safe-area-inset-bottom)); }
    .sheet-img { position: relative; aspect-ratio: 16 / 10; }
    .x { width: 44px; height: 44px; border-radius: 50%; font: 500 22px var(--sans); color: var(--ink); cursor: pointer; flex: none; }
    .x-img { position: absolute; top: 16px; right: 16px; border: 0; background: rgba(246,241,232,.92); }
    .x-line { border: 1px solid rgba(42,33,27,.16); background: transparent; }
    .sheet-body { padding: 28px clamp(20px, 4vw, 36px); }
    .sheet-name { margin-bottom: 6px; font-size: 44px; line-height: 1; }
    .sheet-desc { margin-bottom: 28px; font-size: 16px; line-height: 1.65; color: var(--ink-2); }
    .allergy { margin: -12px 0 28px; font-size: 14px; color: var(--ink-2); }
    .add-row { display: flex; align-items: center; gap: 12px; }
    .stepper { display: flex; align-items: center; height: 56px; border-radius: 999px; border: 1px solid rgba(42,33,27,.2); flex: none; }
    .stepper button { width: 52px; height: 54px; border: 0; background: transparent; font: 500 22px var(--sans); color: var(--ink); cursor: pointer; }
    .stepper span { min-width: 28px; text-align: center; font-size: 17px; font-weight: 700; }
    .stepper.sm { height: 40px; border-color: rgba(42,33,27,.16); }
    .stepper.sm button { width: 38px; height: 38px; font-size: 18px; }
    .stepper.sm span { min-width: 20px; font-size: 14px; }
    .add { flex: 1; min-width: 0; height: 56px; border: 0; border-radius: 999px; background: var(--accent); color: var(--cream); font: 700 15px var(--sans); cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 24px; }
    .add:hover { background: var(--accent-hover); }
    .add:disabled { background: var(--muted); cursor: not-allowed; }
    .cart-head { display: flex; justify-content: space-between; align-items: start; gap: 16px; margin-bottom: 8px; }
    .cart-title { font-size: 40px; line-height: 1; }
    .cart-help { margin-bottom: 20px; font-size: 14px; line-height: 1.55; color: var(--ink-2); }
    .lines { display: flex; flex-direction: column; border-top: 1px solid var(--line); }
    .line { display: flex; align-items: center; gap: 14px; padding: 16px 0; border-bottom: 1px solid rgba(42,33,27,.1); }
    .line-name { flex: 1; min-width: 0; }
    .serif22 { font-family: var(--serif); font-size: 22px; line-height: 1.15; }
    .line-total { width: 76px; text-align: right; font-size: 15px; font-weight: 700; }
    .sum { display: flex; justify-content: space-between; align-items: baseline; padding: 22px 0 24px; font-size: 15px; color: var(--ink-2); }
    .sum-n { font-family: var(--serif); font-size: 40px; line-height: 1; color: var(--ink); }
    .clear { width: 100%; height: 52px; border-radius: 999px; border: 1px solid rgba(42,33,27,.2); background: transparent; font: 600 14px var(--sans); color: var(--ink); cursor: pointer; }
    .clear:hover { border-color: var(--ink); }
  `]
})
export class MenuComponent implements OnInit, OnDestroy {
  readonly lang = inject(LanguageService);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly t = (key: string) => this.lang.t(key);
  readonly fmt = (key: string, n: number) => this.lang.t(key).replace('{n}', String(n));
  readonly yen = (n: number) => '¥' + n.toLocaleString('ja-JP');
  readonly showJp = computed(() => this.lang.currentLang() !== 'ja');

  readonly categories = signal<Category[]>([]);
  readonly items = signal<MenuItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly query = signal('');
  readonly active = signal('');
  readonly cart = signal<Record<number, number>>(this.loadCart());
  readonly detailId = signal<number | null>(null);
  readonly draft = signal(1);
  readonly cartOpen = signal(false);

  readonly needle = computed(() => this.query().trim().toLowerCase());

  private tagsFor(i: MenuItem): Tag[] {
    const tags: Tag[] = [];
    if (i.is_recommended) tags.push({ label: this.t('signature_tag'), cls: 'bb-tag bb-tag-sig' });
    const spicy = Math.min(3, i.spicy_level || 0);
    if (spicy > 0) tags.push({ label: '🌶'.repeat(spicy) + ' ' + this.t('spicy_label'), cls: 'bb-tag bb-tag-spicy' });
    if (i.is_vegetarian) tags.push({ label: this.t('vegetarian'), cls: 'bb-tag bb-tag-veg' });
    if (!i.is_available) tags.push({ label: this.t('sold_out'), cls: 'bb-tag bb-tag-out' });
    return tags;
  }

  private readonly views = computed(() => this.items().map(i => ({ ...i, tags: this.tagsFor(i) })));
  private readonly byId = computed(() => new Map(this.views().map(i => [i.id, i])));

  readonly featured = computed(() => this.views().filter(i => i.is_recommended));

  readonly groups = computed(() => {
    const q = this.needle();
    const pool = q
      ? this.views().filter(i => `${i.name} ${i.description || ''} ${i.name_ja || ''}`.toLowerCase().includes(q))
      : this.views();
    return this.categories()
      .map((c, idx) => ({ ...c, num: String(idx + 1).padStart(2, '0'), items: pool.filter(i => i.category_id === c.id) }))
      .filter(g => g.items.length);
  });

  // Cart ids whose item no longer exists (deleted in /admin) are skipped, not counted.
  readonly cartLines = computed(() => {
    const byId = this.byId();
    return Object.entries(this.cart())
      .map(([id, qty]) => ({ item: byId.get(+id)!, qty }))
      .filter(l => l.item);
  });
  readonly cartCount = computed(() => this.cartLines().reduce((a, l) => a + l.qty, 0));
  readonly cartTotal = computed(() => this.cartLines().reduce((a, l) => a + l.qty * l.item.price, 0));

  readonly detail = computed(() => {
    const id = this.detailId();
    return id === null ? null : this.byId().get(id) ?? null;
  });

  constructor() {
    // Browser only: the backend isn't reachable during build-time prerendering.
    effect(() => {
      const lang = this.lang.currentLang();
      if (this.isBrowser) this.fetchMenu(lang);
    });

    effect(() => {
      const title = this.lang.t('menu_seo_title');
      const description = this.lang.t('menu_seo_desc');
      this.titleService.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
    });

    effect(() => {
      const cart = this.cart();
      if (!this.isBrowser) return;
      try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private mode: list just won't persist */ }
    });

    // Lock page scroll behind an open sheet.
    effect(() => {
      const locked = this.detailId() !== null || this.cartOpen();
      if (this.isBrowser) document.body.style.overflow = locked ? 'hidden' : '';
    });

    // Keep the scroll-spy state valid when the visible groups change (search, reload).
    effect(() => {
      const groups = this.groups();
      if (this.isBrowser) setTimeout(() => this.onScroll());
      else if (groups.length) this.active.set(groups[0].slug);
    });
  }

  private loadCart(): Record<number, number> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
      const cart: Record<number, number> = {};
      for (const [id, qty] of Object.entries(raw)) {
        if (Number.isInteger(qty) && (qty as number) > 0) cart[+id] = qty as number;
      }
      return cart;
    } catch {
      return {};
    }
  }

  ngOnInit() {
    if (this.isBrowser) window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      window.removeEventListener('scroll', this.onScroll);
      document.body.style.overflow = '';
    }
  }

  // Scroll-spy: the active chip is the last section whose top has passed 180px.
  private readonly onScroll = () => {
    const groups = this.groups();
    if (!groups.length) return;
    let cur = groups[0].slug;
    for (const g of groups) {
      const el = document.getElementById(g.slug);
      if (el && el.getBoundingClientRect().top < 180) cur = g.slug;
    }
    if (cur !== this.active()) {
      this.active.set(cur);
      const chip = document.querySelector<HTMLElement>(`.chip[data-slug="${cur}"]`);
      chip?.parentElement?.scrollTo({ left: chip.offsetLeft - 16, behavior: 'smooth' });
    }
  };

  goTo(slug: string) {
    const el = document.getElementById(slug);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 150, behavior: 'smooth' });
  }

  openDetail(item: MenuItem) {
    this.detailId.set(item.id);
    this.draft.set(this.cart()[item.id] || 1);
  }

  // Items already on the list may go down to 0 (saving 0 removes them); new items start at 1.
  decDraft() {
    const min = this.cart()[this.detailId()!] ? 0 : 1;
    this.draft.set(Math.max(min, this.draft() - 1));
  }

  saveDraft() {
    this.setQty(this.detailId()!, this.draft());
    this.detailId.set(null);
  }

  setQty(id: number, qty: number) {
    const cart = { ...this.cart() };
    if (qty <= 0) delete cart[id]; else cart[id] = qty;
    this.cart.set(cart);
    if (!Object.keys(cart).length) this.cartOpen.set(false);
  }

  clearCart() {
    this.cart.set({});
    this.cartOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  closeAll() {
    this.detailId.set(null);
    this.cartOpen.set(false);
  }

  fetchMenu(lang: LanguageCode) {
    this.loading.set(true);
    this.loadError.set(false);
    this.http.get<{ categories: Category[]; items: MenuItem[] }>(`${getApiBase()}/menu?lang=${lang}`).subscribe({
      next: (data) => {
        this.categories.set(data.categories || []);
        this.items.set(data.items || []);
        this.loading.set(false);
      },
      error: (err) => {
        // Never show fabricated menu data: prices here are what a guest orders and pays.
        console.error('Error fetching menu from backend', err);
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }
}
