import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivityMonitoringComponent } from './pages/activity-monitoring/activity-monitoring.component';
import { ConfigsComponent } from './pages/configs/configs.component';
import { ConnectionStatusComponent } from './pages/connection-status/connection-status.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { LocationsComponent } from './pages/locations/locations.component';
import { LoginComponent } from './pages/login/login.component';
import { PermissionsComponent } from './pages/permissions/permissions.component';
import { ProtocolsComponent } from './pages/protocols/protocols.component';
import { RolesComponent } from './pages/roles/roles.component';
import { ScaleDataComponent } from './pages/scale-data/scale-data.component';
import { ScaleManufacturersComponent } from './pages/scale-manufacturers/scale-manufacturers.component';
import { ScaleReportComponent } from './pages/scale-report/scale-report.component';
import { ScalesComponent } from './pages/scales/scales.component';
import { ShiftReportComponent } from './pages/shift-report/shift-report.component';
import { ShiftsComponent } from './pages/shifts/shifts.component';
import { TemplatesComponent } from './pages/templates/templates.component';
import { UsersComponent } from './pages/users/users.component';
import { WebsiteSettingsComponent } from './pages/website-settings/website-settings.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: DashboardComponent,
    // // canActivate: [AuthGuard] // Temporarily disabled // Temporarily disabled
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    // // canActivate: [AuthGuard] // Temporarily disabled // Temporarily disabled
  },
  {
    path: 'manage-info',
    children: [
      {
        path: 'locations',
        component: LocationsComponent,
        // // canActivate: [AuthGuard] // Temporarily disabled // Temporarily disabled
      },
    ],
  },
  {
    path: 'manage-scales',
    children: [
      {
        path: 'list',
        component: ScalesComponent,
        // canActivate: [AuthGuard] // Temporarily disabled
      },
      {
        path: 'manufacturers',
        component: ScaleManufacturersComponent,
        // canActivate: [AuthGuard] // Temporarily disabled
      },
      {
        path: 'protocols',
        component: ProtocolsComponent,
        // canActivate: [AuthGuard] // Temporarily disabled
      },
    ],
  },
  {
    path: 'manage-shifts',
    component: ShiftsComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: 'manage-accounts',
    component: UsersComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: 'manage-permissions',
    component: PermissionsComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: 'manage-roles',
    component: RolesComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: 'manage-configs',
    component: ConfigsComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: 'website-settings',
    component: WebsiteSettingsComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: 'activity-monitoring',
    component: ActivityMonitoringComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: 'data-collection',
    component: ScaleDataComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: 'reports',
    children: [
      {
        path: 'scale-report',
        component: ScaleReportComponent,
        // canActivate: [AuthGuard] // Temporarily disabled
      },
      {
        path: 'shift-report',
        component: ShiftReportComponent,
        // canActivate: [AuthGuard] // Temporarily disabled
      },
    ],
  },
  {
    path: 'manage-templates',
    component: TemplatesComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: 'manage-licenses',
    component: LicensesComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: 'connection-status',
    component: ConnectionStatusComponent,
    // canActivate: [AuthGuard] // Temporarily disabled
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
