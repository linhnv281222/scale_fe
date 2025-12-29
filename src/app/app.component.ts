import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
// import { MenuItem } from './shared/components/layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isLoginPage = false;
  menuItems: any[] = [
    {
      label: 'menu.dashboard',
      icon: 'dashboard',
      path: '/dashboard',
    },
    {
      label: 'menu.activityMonitoring',
      icon: 'monitor',
      path: '/activity-monitoring',
    },
    {
      label: 'menu.reports',
      icon: 'file-text',
      path: '/reports',
      children: [
        {
          label: 'reports.scaleReport',
          path: '/reports/scale-report',
        },
        {
          label: 'reports.shiftReport',
          path: '/reports/shift-report',
        },
      ],
    },
    {
      label: 'menu.manageInfo',
      icon: 'folder',
      path: '/manage-info',
      children: [
        {
          label: 'locations.title',
          path: '/manage-info/locations',
        },
        {
          label: 'scales.title',
          path: '/manage-scales/list',
        },
        {
          label: 'scales.manufacturers',
          path: '/manage-scales/manufacturers',
        },
        {
          label: 'scales.protocols',
          path: '/manage-scales/protocols',
        },
        {
          label: 'shifts.title',
          path: '/manage-shifts',
        },
      ],
    },
    {
      label: 'menu.manageUsers',
      icon: 'user',
      path: '/manage-users',
      children: [
        {
          label: 'users.title',
          path: '/manage-accounts',
        },
        {
          label: 'permissions.title',
          path: '/manage-permissions',
        },
        {
          label: 'roles.title',
          path: '/manage-roles',
        },
        {
          label: 'licenses.title',
          path: '/manage-licenses',
        },
      ],
    },
    {
      label: 'menu.configs',
      icon: 'setting',
      path: '/configs',
      children: [
        {
          label: 'configs.title',
          path: '/manage-configs',
        },
        {
          label: 'templates.title',
          path: '/manage-templates',
        },
        {
          label: 'systemConfig.title',
          path: '/website-settings',
        },
      ],
    },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Check if current route is login page
    this.checkLoginPage();

    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkLoginPage();
      });
  }

  checkLoginPage(): void {
    // Check if current route path starts with '/login' (ignore query params)
    const url = this.router.url.split('?')[0]; // Remove query params
    this.isLoginPage = url === '/login';
  }
}
