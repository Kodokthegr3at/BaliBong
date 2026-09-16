import { Routes } from '@angular/router';
import { HomeComponent } from './home';
import { MenuComponent } from './menu';
import { AdminComponent } from './admin';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'BALI BONG — Hidangan Khas Bali & Nusantara' },
  { path: 'menu', component: MenuComponent, title: 'Menu — BALI BONG' },
  { path: 'admin', component: AdminComponent, title: 'Admin — BALI BONG' },
  { path: '**', redirectTo: '' }
];
