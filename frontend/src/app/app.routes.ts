import { Routes } from '@angular/router';
import { HomeComponent } from './home';
import { MenuComponent } from './menu';
import { AdminComponent } from './admin';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];
