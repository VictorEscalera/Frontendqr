import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'escritorio',
    pathMatch: 'full', // Redirige automáticamente la raíz a /escritorio
  },
  {
    path: 'escritorio',
    loadComponent: () => import('./escritorio/escritorio.component').then((m) => m.EscritorioComponent)
  },
  {
    path: 'movil',
    loadComponent: () => import('./movil/movil.component').then((m) => m.MovilComponent),
  },
  {
    path: 'tabs', // Es mejor darle un path propio a las tabs para que no choque con la raíz limpia
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  }
];