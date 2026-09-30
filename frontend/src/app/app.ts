import { Component, signal, inject, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from './language.service';
import { getApiBase } from './api-base';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  langService = inject(LanguageService);
  private http = inject(HttpClient);
  private router = inject(Router);
  readonly isAdmin = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects.startsWith('/admin'))
    ),
    { initialValue: false }
  );
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDesignSettings();
    }
  }

  loadDesignSettings() {
    const apiBase = getApiBase();
    this.http.get<any>(`${apiBase}/admin/design`).subscribe({
      next: (settings) => {
        if (settings.background_url) {
          document.body.style.backgroundImage = `linear-gradient(rgba(253, 249, 245, 0.88), rgba(253, 249, 245, 0.88)), url('${settings.background_url}')`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundAttachment = 'fixed';
          document.body.style.backgroundPosition = 'center';
        }
      },
      error: (err) => console.error('Error loading design settings', err)
    });
  }
}
