import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    // Get required permission from route data
    const requiredPermission = route.data['permission'] as string | null | undefined;

    // If no permission required, allow access
    if (!requiredPermission) {
      return true;
    }

    // Ensure permissions are loaded
    if (this.authService.isAuthenticated()) {
      const permissions = this.permissionService.getPermissions();
      if (!permissions || permissions.length === 0) {
        // Try to reload permissions
        await this.authService.getMe();
        this.permissionService.loadPermissionsFromStorage();
      }
    }

    // Check if user has the required permission
    const hasPermission = this.permissionService.hasPermission(requiredPermission);

    if (!hasPermission) {
      // Show error message
      this.toastr.error('Bạn không có quyền truy cập trang này', 'Không có quyền');
      // Redirect to dashboard
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}

