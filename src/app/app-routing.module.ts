import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';
import { PermissionGuard } from './guard/permission.guard';
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
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'manage-info',
    children: [
      {
        path: 'locations',
        component: LocationsComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
  {
    path: 'manage-scales',
    children: [
      {
        path: 'list',
        component: ScalesComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'SCALE_MANAGE' },
      },
      {
        path: 'manufacturers',
        component: ScaleManufacturersComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'SCALE_MANAGE' },
      },
      {
        path: 'protocols',
        component: ProtocolsComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'SCALE_MANAGE' },
      },
    ],
  },
  {
    path: 'manage-shifts',
    component: ShiftsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'manage-accounts',
    component: UsersComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'USER_MANAGE' },
  },
  {
    path: 'manage-permissions',
    component: PermissionsComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'USER_MANAGE' },
  },
  {
    path: 'manage-roles',
    component: RolesComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'ROLE_MANAGE' },
  },
  {
    path: 'manage-configs',
    component: ConfigsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'website-settings',
    component: WebsiteSettingsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'activity-monitoring',
    component: ActivityMonitoringComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'SCALE_VIEW' },
  },
  {
    path: 'data-collection',
    component: ScaleDataComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'reports',
    children: [
      {
        path: 'scale-report',
        component: ScaleReportComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'SCALE_VIEW' },
      },
      {
        path: 'shift-report',
        component: ShiftReportComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'SCALE_VIEW' },
      },
    ],
  },
  {
    path: 'manage-templates',
    component: TemplatesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'manage-licenses',
    component: LicensesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'connection-status',
    component: ConnectionStatusComponent,
    canActivate: [AuthGuard],
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
