import { Routes } from '@angular/router';
import { RoleSelectorComponent } from '../components/role-selector/role-selector';
import { DashboardComponent } from '../components/dashboard/dashboard';

export const routes: Routes = [
  { path: '', redirectTo: '/role', pathMatch: 'full' },
  { path: 'role', component: RoleSelectorComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '**', redirectTo: '/role' },
];
