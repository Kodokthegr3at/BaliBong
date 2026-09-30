import { Component, inject, signal, effect, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { LanguageService, LanguageCode } from './language.service';
import { SiteHeaderComponent } from './site-header';
import { getApiBase } from './api-base';
import { toInfoRows, HOURS_SEPARATOR, CONTACT_SEPARATOR } from './info-rows';

interface Dish {
  id: number;
  name: string;
  name_ja: string | null;
  description: string;
  image_url: string | null;
  is_recommended: boolean;
}

const MAPS_URL = 'https://maps.google.com/?q=バリボン+我孫子+大阪';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet, SiteHeaderComponent],
  template: `
  <div class="bb">
    <app-site-header active="home" />

    <!-- HERO -->
    <section class="hero-pad">
      <div class="hero">
        <img src="/public/images/assets/storefront.webp" alt="Bali Bong, Osaka" class="hero-img">
        <div class="hero-shade"></div>
        <div class="hero-body">
          <div>
            <div class="hero-eyebrow"><span class="rule"></span><span>{{ t('hero_subtitle') }}</span></div>
            <h1 class="hero-title">Yang Penting<br><em>Happy.</em></h1>
          </div>
          <div class="hero-side">
            <p>{{ t('hero_lead') }}</p>
            <div class="btns">
              <a routerLink="/menu" class="bb-btn btn-cream">{{ t('view_menu') }} <span>→</span></a>
              <a [href]="mapsUrl" target="_blank" rel="noopener" class="bb-btn btn-ghost">{{ t('directions') }}</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- QUICK FACTS -->
    <section class="bb-wrap facts-pad">
      <div class="facts">
        <div><span class="fact-k">Tabelog</span><span class="fact-v">★ 3.41 · {{ t('reviews_count') }}</span></div>
        <div><span class="fact-k">{{ t('nav_location') }}</span><span class="fact-v">{{ t('fact_location_val') }}</span></div>
        <div><span class="fact-k">{{ t('menu_title') }}</span><span class="fact-v">{{ t('fact_menu_val') }}</span></div>
        <div><span class="fact-k">{{ t('fact_suited') }}</span><span class="fact-v">{{ t('fact_suited_val') }}</span></div>
      </div>
    </section>

    <!-- ABOUT -->
    <section id="tentang" class="bb-wrap section anchor">
      <div class="about">
        <div class="about-text">
          <div class="bb-eyebrow-row mb20">
            <span class="bb-eyebrow">{{ t('concept_story') }}</span>
            @if (showJp()) { <span class="bb-jp">私たちについて</span> }
          </div>
          <h2 class="h2 about-h2">{{ t('about_h2_a') }}<em>{{ t('about_h2_em') }}</em>{{ t('about_h2_b') }}</h2>
          @if (info().about) {
            <p class="about-p">{{ info().about }}</p>
          } @else {
            <ng-container *ngTemplateOutlet="status" />
          }
          <a routerLink="/menu" class="underline-link">{{ t('explore_menu') }} →</a>
        </div>
        <div class="about-grid">
          <figure class="fig wide"><img src="/public/images/assets/interior-bar.webp" alt="Interior Bali Bong"></figure>
          <figure class="fig tall"><img src="/public/images/assets/interior-dining.webp" alt="Ruang makan Bali Bong"></figure>
          <div class="welcome">
            <span class="bb-mono welcome-k">Om Swastiastu</span>
            <p>{{ t('welcome_quote') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SIGNATURE -->
    @if (dishes().length) {
      <section class="sig">
        <div class="bb-wrap">
          <div class="sig-head">
            <div>
              <div class="bb-eyebrow-row mb16">
                <span class="bb-eyebrow">{{ t('signature_eyebrow') }}</span>
                @if (showJp()) { <span class="bb-jp">おすすめ料理</span> }
              </div>
              <h2 class="h2">{{ t('signature_title') }}</h2>
            </div>
            <a routerLink="/menu" class="bb-btn btn-line">{{ t('all_menu') }} →</a>
          </div>
          <div class="sig-grid">
            @for (d of dishes(); track d.id) {
              <a routerLink="/menu" class="dish">
                <div class="dish-img bb-ph">
                  @if (d.image_url) { <img [src]="d.image_url" [alt]="d.name" loading="lazy"> }
                </div>
                <div class="dish-meta">
                  <div>
                    <h3>{{ d.name }}</h3>
                    <p>{{ d.description }}</p>
                  </div>
                  @if (showJp() && d.name_ja && d.name_ja !== d.name) { <span class="bb-jp nowrap">{{ d.name_ja }}</span> }
                </div>
              </a>
            }
          </div>
        </div>
      </section>
    }

    <!-- VISIT -->
    <section id="lokasi" class="visit anchor">
      <div class="bb-wrap">
        <div class="bb-eyebrow-row mb16">
          <span class="bb-eyebrow peach">{{ t('visit_eyebrow') }}</span>
          @if (showJp()) { <span class="bb-jp sage">店舗情報</span> }
        </div>
        <h2 class="h2 visit-h2">{{ t('visit_title') }}</h2>
        <div class="panels">
          <div class="panel">
            <h3 class="bb-mono panel-k">{{ t('hours_title') }}</h3>
            @if (hoursRows().length) {
              <div class="hours">
                @for (h of hoursRows(); track $index) {
                  <div class="hour"><span>{{ h.label }}</span><b>{{ h.value }}</b></div>
                }
              </div>
            } @else { <ng-container *ngTemplateOutlet="status" /> }
          </div>
          <div class="panel">
            <h3 class="bb-mono panel-k">{{ t('transport_title') }}</h3>
            <p class="station">{{ t('station_name') }}</p>
            @if (info().transportation) {
              <p class="panel-p">{{ info().transportation }}</p>
            } @else { <ng-container *ngTemplateOutlet="status" /> }
            <a [href]="mapsUrl" target="_blank" rel="noopener" class="peach-link">{{ t('map_button') }} ↗</a>
          </div>
          <div class="panel">
            <h3 class="bb-mono panel-k">{{ t('contact_title') }}</h3>
            @if (contactRows().length) {
              <div class="contact">
                @for (c of contactRows(); track $index) {
                  <div><span class="sage small">{{ c.label }}</span><b>{{ c.value }}</b></div>
                }
              </div>
            } @else { <ng-container *ngTemplateOutlet="status" /> }
          </div>
        </div>
      </div>
    </section>

    <!-- REVIEW + MAP -->
    <section class="bb-wrap section">
      <div class="review">
        <div class="review-left">
          <div>
            <div class="bb-eyebrow-row mb28">
              <span class="bb-eyebrow">{{ t('reviews_title') }}</span>
              @if (showJp()) { <span class="bb-jp">お客様の声</span> }
            </div>
            <blockquote><span class="q">“</span>{{ quote() }}<span class="q">”</span></blockquote>
          </div>
          <div class="score-row">
            <div class="score">
              <span class="score-n">3.41</span>
              <div class="score-meta">
                <span class="stars" aria-label="3.41 / 5">★★★☆☆</span>
                <span>{{ t('review_source') }}</span>
              </div>
            </div>
            <div class="chips">
              <span>{{ t('feature_curry') }}</span>
              <span>{{ t('feature_family') }}</span>
              <span>{{ t('feature_solo') }}</span>
            </div>
          </div>
        </div>
        <div class="map">
          <iframe title="Peta Bali Bong" loading="lazy"
            src="https://maps.google.com/maps?q=%E3%83%90%E3%83%AA%E3%83%9C%E3%83%B3%20%E3%81%82%E3%81%B3%E3%81%93%20%E5%A4%A7%E9%98%AA&t=&z=16&ie=UTF8&iwloc=&output=embed"></iframe>
          <a [href]="mapsUrl" target="_blank" rel="noopener" class="bb-btn map-btn">{{ t('map_button') }} ↗</a>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-pad">
      <div class="cta">
        <h2>{{ t('cta_title_a') }}<em>{{ t('cta_title_em') }}</em></h2>
        <a routerLink="/menu" class="bb-btn btn-cta">{{ t('view_menu') }} →</a>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="bb-wrap foot">
      <div class="foot-grid">
        <div class="foot-brand">
          <img src="/public/images/assets/logo.png" alt="BALI BONG">
          <p>{{ t('footer_tagline') }}</p>
        </div>
        <div>
          <h4 class="bb-mono foot-k">{{ t('footer_nav_title') }}</h4>
          <div class="foot-list">
            <a routerLink="/" fragment="tentang">{{ t('about_title') }}</a>
            <a routerLink="/menu">{{ t('menu_title') }}</a>
            <a routerLink="/admin">{{ t('admin_panel') }}</a>
          </div>
        </div>
        <div>
          <h4 class="bb-mono foot-k">{{ t('hours_title') }}</h4>
          <div class="foot-list">
            @for (h of hoursRows(); track $index) {
              <span>{{ h.label }}{{ h.value ? ' · ' + h.value : '' }}</span>
            }
          </div>
        </div>
      </div>
      <div class="foot-bottom">
        <span>© 2026 Bali Bong. {{ t('all_rights') }}</span>
        <span class="bb-jp">バリボン · 大阪 我孫子</span>
      </div>
    </footer>

    <ng-template #status>
      @if (infoLoadError()) {
        <p class="status">{{ t('info_error') }} <button type="button" (click)="fetchInfo(lang.currentLang())">{{ t('retry_button') }}</button></p>
      } @else {
        <p class="status">{{ t('loading') }}</p>
      }
    </ng-template>
  </div>
  `,
  styles: [`
    .anchor { scroll-margin-top: 80px; }
    .section { padding-top: clamp(72px, 10vw, 140px); padding-bottom: clamp(72px, 10vw, 140px); }
    .mb16 { margin-bottom: 16px; } .mb20 { margin-bottom: 20px; } .mb28 { margin-bottom: 28px; }
    .nowrap { white-space: nowrap; }
    .h2 { font-size: clamp(40px, 5vw, 64px); line-height: 1; letter-spacing: -0.015em; }
    .h2 em { font-style: italic; color: var(--accent); }

    /* Hero */
    .hero-pad { padding: clamp(12px, 2vw, 24px); }
    .hero {
      position: relative; max-width: 1320px; margin: 0 auto; overflow: hidden;
      border-radius: clamp(18px, 2.4vw, 32px); min-height: min(86vh, 820px);
      display: flex; align-items: flex-end; background: #3a2b20;
    }
    .hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }
    .hero-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(26,18,12,.25) 0%, rgba(26,18,12,.55) 45%, rgba(26,18,12,.85) 100%); }
    .hero-body {
      position: relative; width: 100%; padding: clamp(28px, 5vw, 72px); color: var(--cream);
      text-shadow: 0 1px 18px rgba(0,0,0,.35);
      display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 32px; align-items: end;
    }
    .hero-eyebrow { display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; opacity: .9; margin-bottom: 22px; }
    .rule { width: 28px; height: 1px; background: var(--cream); flex: none; }
    .hero-title { font-size: clamp(56px, 9vw, 132px); line-height: .92; letter-spacing: -0.02em; }
    .hero-title em { font-style: italic; color: var(--accent-light); }
    .hero-side { max-width: 440px; justify-self: end; }
    .hero-side p { margin-bottom: 28px; font-size: clamp(16px, 1.4vw, 18px); line-height: 1.6; opacity: .92; }
    .btns { display: flex; flex-wrap: wrap; gap: 10px; }
    .btns .bb-btn { height: 52px; padding: 0 26px; text-shadow: none; letter-spacing: 0; }
    .btn-cream { background: var(--cream); color: var(--ink); }
    .btn-cream:hover { background: var(--accent-light); }
    .btn-ghost { border: 1px solid rgba(251,246,238,.5); color: var(--cream); }
    .btn-ghost:hover { background: rgba(251,246,238,.12); }

    /* Facts */
    .facts-pad { padding-top: 8px; }
    .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .facts > div { padding: 22px 0; display: flex; flex-direction: column; gap: 4px; }
    .fact-k { font: 400 11px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    .fact-v { font-size: 15px; font-weight: 600; }

    /* About */
    .about { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: clamp(40px, 6vw, 96px); align-items: start; }
    .about-text { position: sticky; top: 110px; }
    .about-h2 { font-size: clamp(40px, 5.2vw, 72px); margin-bottom: 28px; }
    .about-p { margin-bottom: 18px; max-width: 520px; font-size: 17px; line-height: 1.7; color: var(--ink-2); white-space: pre-line; }
    .underline-link { display: inline-flex; align-items: center; gap: 10px; margin-top: 12px; font-size: 14px; font-weight: 600; color: var(--ink); border-bottom: 1px solid var(--ink); padding-bottom: 4px; }
    .underline-link:hover { color: var(--accent); border-color: var(--accent); }
    .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .fig { margin: 0; border-radius: 24px; overflow: hidden; background: #d9cbb8; }
    .fig img { width: 100%; height: 100%; object-fit: cover; }
    .wide { grid-column: 1 / span 2; aspect-ratio: 16 / 11; }
    .tall { aspect-ratio: 4 / 5; }
    .welcome { border-radius: 24px; background: var(--accent); color: var(--cream); padding: clamp(20px, 2.4vw, 32px); display: flex; flex-direction: column; justify-content: space-between; aspect-ratio: 4 / 5; }
    .welcome-k { color: inherit; opacity: .85; }
    .welcome p { font-family: var(--serif); font-size: clamp(24px, 2.4vw, 34px); line-height: 1.1; }
    @media (max-width: 960px) { .about-text { position: static; } }

    /* Signature */
    .sig { background: var(--bg-alt); padding: clamp(72px, 9vw, 120px) 0; }
    .sig-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 24px; margin-bottom: 48px; }
    .btn-line { height: 48px; padding: 0 22px; border: 1px solid rgba(42,33,27,.25); color: var(--ink); letter-spacing: 0; }
    .btn-line:hover { background: var(--ink); color: var(--bg); }
    .sig-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 20px; }
    .dish { display: flex; flex-direction: column; gap: 18px; color: var(--ink); }
    .dish-img { aspect-ratio: 4 / 5; border-radius: 22px; overflow: hidden; }
    .dish-meta { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 0 4px; }
    .dish h3 { margin-bottom: 6px; font-size: 30px; line-height: 1; }
    .dish p { font-size: 14px; line-height: 1.5; color: var(--ink-3); }

    /* Visit */
    .visit { background: var(--green-dark); color: var(--bg-alt); padding: clamp(72px, 9vw, 120px) 0; }
    .peach { color: var(--peach); }
    .sage { color: #9aa89c; }
    .small { font-size: 13px; }
    .visit-h2 { margin-bottom: 56px; color: var(--cream); }
    .panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 1px; background: rgba(239,230,216,.14); border: 1px solid rgba(239,230,216,.14); border-radius: 24px; overflow: hidden; }
    .panel { background: var(--green-dark); padding: clamp(24px, 3vw, 40px); }
    .panel-k { margin-bottom: 24px; font-family: var(--mono); color: #9aa89c; }
    .hours { display: flex; flex-direction: column; gap: 14px; }
    .hour { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 14px; border-bottom: 1px solid rgba(239,230,216,.1); font-size: 15px; }
    .hour span { color: #c9c0b2; }
    .hour b { font-weight: 600; color: var(--cream); text-align: right; }
    .station { margin-bottom: 16px; font-family: var(--serif); font-size: 28px; line-height: 1.15; color: var(--cream); }
    .panel-p { margin-bottom: 24px; font-size: 15px; line-height: 1.65; color: #c9c0b2; }
    .peach-link { font-size: 14px; font-weight: 600; color: var(--peach); border-bottom: 1px solid var(--peach); padding-bottom: 3px; }
    .peach-link:hover { color: var(--cream); border-color: var(--cream); }
    .contact { display: flex; flex-direction: column; gap: 18px; font-size: 15px; }
    .contact div { display: flex; flex-direction: column; gap: 4px; }
    .contact b { font-weight: 600; color: var(--cream); line-height: 1.5; }
    .visit .status { color: #c9c0b2; }

    /* Review + map */
    .review { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: clamp(32px, 5vw, 72px); align-items: stretch; }
    .review-left { display: flex; flex-direction: column; justify-content: space-between; gap: 40px; }
    blockquote { margin: 0; font-family: var(--serif); font-size: clamp(30px, 3.4vw, 46px); line-height: 1.15; letter-spacing: -0.01em; text-wrap: pretty; }
    .q { color: var(--accent); }
    .score-row { display: flex; flex-wrap: wrap; align-items: center; gap: 28px; padding-top: 28px; border-top: 1px solid var(--line); }
    .score { display: flex; align-items: baseline; gap: 10px; }
    .score-n { font-family: var(--serif); font-size: 64px; line-height: 1; }
    .score-meta { display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: var(--ink-3); }
    .stars { color: #c27a2c; letter-spacing: 2px; font-size: 14px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chips span { padding: 8px 14px; border-radius: 999px; background: var(--bg-alt); font-size: 13px; font-weight: 500; }
    .map { position: relative; min-height: 440px; border-radius: 24px; overflow: hidden; background: #e2d5c2; }
    .map iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; filter: grayscale(.85) sepia(.2) contrast(1.05); }
    .map-btn { position: absolute; left: 16px; bottom: 16px; height: 44px; padding: 0 18px; background: var(--ink); color: var(--bg); font-size: 13px; box-shadow: 0 10px 24px -8px rgba(0,0,0,.4); }
    .map-btn:hover { background: var(--accent); color: #fff; }

    /* CTA */
    .cta-pad { padding: 0 clamp(12px, 2vw, 24px) clamp(12px, 2vw, 24px); }
    .cta { max-width: 1320px; margin: 0 auto; border-radius: clamp(18px, 2.4vw, 32px); background: var(--accent); color: var(--cream); padding: clamp(48px, 7vw, 96px) clamp(24px, 5vw, 72px); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 32px; }
    .cta h2 { max-width: 720px; font-size: clamp(40px, 5.6vw, 80px); line-height: .98; letter-spacing: -0.02em; }
    .cta h2 em { font-style: italic; }
    .btn-cta { height: 60px; padding: 0 32px; background: var(--cream); color: var(--ink); font-size: 15px; letter-spacing: 0; }
    .btn-cta:hover { background: var(--ink); color: var(--cream); }

    /* Footer */
    .foot { padding-top: clamp(56px, 7vw, 88px); padding-bottom: 40px; }
    .foot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; padding-bottom: 48px; border-bottom: 1px solid var(--line); }
    .foot-brand { grid-column: span 2; max-width: 380px; }
    .foot-brand img { height: 48px; width: auto; margin-bottom: 20px; }
    .foot-brand p { font-size: 15px; line-height: 1.65; color: var(--ink-2); }
    .foot-k { margin-bottom: 18px; font-family: var(--mono); }
    .foot-list { display: flex; flex-direction: column; gap: 10px; font-size: 15px; color: var(--ink); }
    .foot-list a { color: var(--ink); }
    .foot-list a:hover { color: var(--accent); }
    .foot-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; padding-top: 28px; font-size: 13px; color: var(--muted); }
    @media (max-width: 480px) { .foot-brand { grid-column: auto; } }

    .status { font-size: 15px; color: var(--ink-3); margin-bottom: 18px; }
    .status button { margin-left: 8px; background: none; border: 0; border-bottom: 1px solid currentColor; color: inherit; font: 600 14px var(--sans); cursor: pointer; }
  `]
})
export class HomeComponent {
  readonly lang = inject(LanguageService);
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly mapsUrl = MAPS_URL;
  readonly t = (key: string) => this.lang.t(key);
  // The Japanese secondary labels are redundant when the page is already in Japanese.
  readonly showJp = computed(() => this.lang.currentLang() !== 'ja');

  readonly info = signal({ about: '', transportation: '', contact: '', hours: '' });
  readonly infoLoadError = signal(false);
  readonly dishes = signal<Dish[]>([]);

  readonly hoursRows = computed(() => toInfoRows(this.info().hours, HOURS_SEPARATOR));
  readonly contactRows = computed(() => toInfoRows(this.info().contact, CONTACT_SEPARATOR));
  readonly quote = computed(() => this.lang.t('review_quote').replace(/^["“「]|["”」]$/g, ''));

  constructor() {
    // Browser only: the backend isn't reachable during build-time prerendering,
    // and baking a failed fetch into static HTML shows a stale error after hydration.
    effect(() => {
      const lang = this.lang.currentLang();
      if (this.isBrowser) {
        this.fetchInfo(lang);
        this.fetchDishes(lang);
      }
    });

    effect(() => {
      const title = `BALI BONG — ${this.lang.t('hero_subtitle')}`;
      const description = this.lang.t('hero_desc');
      this.titleService.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
    });
  }

  fetchInfo(lang: LanguageCode) {
    this.infoLoadError.set(false);
    this.http.get<any>(`${getApiBase()}/restaurant-info?lang=${lang}`).subscribe({
      next: (data) => this.info.set({
        about: data.about || '',
        transportation: data.transportation || '',
        contact: data.contact || '',
        hours: data.hours || ''
      }),
      error: (err) => {
        // Never substitute fabricated hours/phone/address for a failed fetch —
        // a customer could show up when the restaurant is actually closed.
        console.error('Error fetching restaurant info', err);
        this.infoLoadError.set(true);
      }
    });
  }

  private fetchDishes(lang: LanguageCode) {
    // The signature section is decorative; on failure it simply stays hidden.
    this.http.get<{ items: Dish[] }>(`${getApiBase()}/menu?lang=${lang}`).subscribe({
      next: (data) => this.dishes.set((data.items || []).filter(i => i.is_recommended).slice(0, 3)),
      error: (err) => console.error('Error fetching signature dishes', err)
    });
  }
}
