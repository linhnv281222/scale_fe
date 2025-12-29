import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { UserPermissionService } from './services/user-permission.service';
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
      permission: null, // No permission required
    },
    {
      label: 'menu.activityMonitoring',
      icon: 'monitor',
      path: '/activity-monitoring',
      permission: 'SCALE_VIEW', // View scales permission
    },
    {
      label: 'menu.reports',
      icon: 'file-text',
      path: '/reports',
      permission: 'SCALE_VIEW', // View scales permission
      children: [
        {
          label: 'reports.scaleReport',
          path: '/reports/scale-report',
          permission: 'SCALE_VIEW',
        },
        {
          label: 'reports.shiftReport',
          path: '/reports/shift-report',
          permission: 'SCALE_VIEW',
        },
      ],
    },
    {
      label: 'menu.manageInfo',
      icon: 'folder',
      path: '/manage-info',
      permission: null, // Parent menu, check children
      children: [
        {
          label: 'locations.title',
          path: '/manage-info/locations',
          permission: null, // No permission required
        },
        {
          label: 'scales.title',
          path: '/manage-scales/list',
          permission: 'SCALE_MANAGE', // Manage scales permission
        },
        {
          label: 'scales.manufacturers',
          path: '/manage-scales/manufacturers',
          permission: 'SCALE_MANAGE',
        },
        {
          label: 'scales.protocols',
          path: '/manage-scales/protocols',
          permission: 'SCALE_MANAGE',
        },
        {
          label: 'shifts.title',
          path: '/manage-shifts',
          permission: null, // No permission required
        },
      ],
    },
    {
      label: 'menu.manageUsers',
      icon: 'user',
      path: '/manage-users',
      permission: null, // Parent menu, check children
      children: [
        {
          label: 'users.title',
          path: '/manage-accounts',
          permission: 'USER_MANAGE', // Manage users permission
        },
        {
          label: 'permissions.title',
          path: '/manage-permissions',
          permission: 'USER_MANAGE', // Manage users permission (permissions management)
        },
        {
          label: 'roles.title',
          path: '/manage-roles',
          permission: 'ROLE_MANAGE', // Manage roles permission
        },
        {
          label: 'licenses.title',
          path: '/manage-licenses',
          permission: null, // No permission required
        },
      ],
    },
    {
      label: 'menu.configs',
      icon: 'setting',
      path: '/configs',
      permission: null, // No permission required
      children: [
        {
          label: 'configs.title',
          path: '/manage-configs',
          permission: null,
        },
        {
          label: 'templates.title',
          path: '/manage-templates',
          permission: null,
        },
        {
          label: 'systemConfig.title',
          path: '/website-settings',
          permission: null,
        },
      ],
    },
  ];

  filteredMenuItems: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private userPermissionService: UserPermissionService
  ) {}

  async ngOnInit(): Promise<void> {
    // Check if current route is login page
    this.checkLoginPage();

    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkLoginPage();
      });

    // Load user info and permissions
    await this.loadUserPermissions();
    this.filterMenuItems();
  }

  async loadUserPermissions(): Promise<void> {
    // Load user info from API if authenticated
    if (this.authService.isAuthenticated()) {
      await this.authService.getMe();
      this.userPermissionService.loadPermissionsFromStorage();
    }
  }

  filterMenuItems(): void {
    this.filteredMenuItems = this.menuItems
      .map(item => {
        // Check if parent menu item has permission
        if (item.permission && !this.userPermissionService.hasPermission(item.permission)) {
          return null;
        }

        // Filter children if exists
        if (item.children && item.children.length > 0) {
          const filteredChildren = item.children.filter((child: any) => {
            if (!child.permission) return true; // No permission required
            return this.userPermissionService.hasPermission(child.permission);
          });

          // If no children visible, hide parent menu
          if (filteredChildren.length === 0) {
            return null;
          }

          return {
            ...item,
            children: filteredChildren
          };
        }

        return item;
      })
      .filter(item => item !== null);
  }

  checkLoginPage(): void {
    // Check if current route path starts with '/login' (ignore query params)
    const url = this.router.url.split('?')[0]; // Remove query params
    this.isLoginPage = url === '/login';
  }
}
