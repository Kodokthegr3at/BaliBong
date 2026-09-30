import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService, LanguageCode } from './language.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="hdr">
      <div class="bb-wrap row">
        <a routerLink="/" class="logo">
          <img src="/public/images/assets/logo.png" alt="BALI BONG">
        </a>
        <nav class="nav">
          <a routerLink="/" fragment="tentang">{{ lang.t('nav_about') }}</a>
          <a routerLink="/menu" [class.on]="active() === 'menu'">{{ lang.t('menu_title') }}</a>
          <a routerLink="/" fragment="lokasi">{{ lang.t('nav_location') }}</a>
        </nav>
        <div class="right">
          <div class="lang">
            <button type="button" class="lang-btn" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-haspopup="listbox">
              <span>{{ lang.currentLangCode() }}</span><span class="caret">▾</span>
            </button>
            @if (open()) {
              <div class="lang-menu" role="listbox">
                @for (l of lang.languages; track l.code) {
                  <button type="button" role="option" [attr.aria-selected]="l.code === lang.currentLang()"
                    [class.sel]="l.code === lang.currentLang()" (click)="pick(l.code)">
                    <span>{{ l.name }}</span><span class="code">{{ l.code.toUpperCase() }}</span>
                  </button>
                }
              </div>
            }
          </div>
          @if (active() === 'home') {
            <a routerLink="/menu" class="cta">{{ lang.t('view_menu') }}</a>
          }
        </div>
      </div>
      <ng-content />
    </header>
  `,
  styles: [`
    :host { display: contents; }
    .hdr {
      position: sticky; top: 0; z-index: 50;
      background: rgba(246, 241, 232, 0.88);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(42, 33, 27, 0.08);
    }
    .row { padding-top: 14px; padding-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .logo img { height: 40px; width: auto; }
    .nav { display: flex; align-items: center; gap: clamp(16px, 3vw, 36px); font-size: 14px; font-weight: 500; letter-spacing: 0.01em; }
    .nav a { color: var(--ink); }
    .nav a:hover { color: var(--accent); }
    .nav a.on { color: var(--accent); font-weight: 600; }
    .right { display: flex; align-items: center; gap: 10px; }
    .lang { position: relative; }
    .lang-btn {
      display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px;
      border-radius: 999px; border: 1px solid rgba(42, 33, 27, 0.16); background: transparent;
      font: 600 12px var(--sans); letter-spacing: 0.08em; color: var(--ink); cursor: pointer;
    }
    .lang-btn:hover { border-color: var(--ink); }
    .caret { font-size: 9px; opacity: 0.6; }
    .lang-menu {
      position: absolute; right: 0; top: 48px; min-width: 180px; padding: 6px;
      background: var(--surface); border: 1px solid rgba(42, 33, 27, 0.1); border-radius: 14px;
      box-shadow: 0 18px 40px -12px rgba(42, 33, 27, 0.25);
    }
    .lang-menu button {
      display: flex; width: 100%; justify-content: space-between; align-items: center;
      padding: 10px 12px; border: 0; border-radius: 9px; background: transparent;
      font: 500 14px var(--sans); color: var(--ink); cursor: pointer; text-align: left;
    }
    .lang-menu button:hover, .lang-menu button.sel { background: var(--hover-soft-2); }
    .code { font: 400 11px var(--mono); opacity: 0.5; }
    .cta {
      display: flex; align-items: center; height: 40px; padding: 0 20px; border-radius: 999px;
      background: var(--ink); color: var(--bg); font-size: 13px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap;
    }
    .cta:hover { background: var(--accent); color: #fff; }
    /* Phones: the three links don't fit beside logo + controls; the logo and CTAs still route everywhere. */
    @media (max-width: 720px) { .nav { display: none; } }
  `]
})
export class SiteHeaderComponent {
  readonly lang = inject(LanguageService);
  private readonly el = inject(ElementRef);
  readonly active = input<'home' | 'menu'>('home');
  readonly open = signal(false);

  pick(code: LanguageCode) {
    this.lang.setLanguage(code);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: EventTarget | null) {
    if (this.open() && !this.el.nativeElement.querySelector('.lang')?.contains(target)) this.open.set(false);
  }
}
