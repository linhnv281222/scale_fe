import { Injectable } from '@angular/core';
import { Permission } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserPermissionService {
  private permissions: Permission[] = [];

  constructor() {
    this.loadPermissionsFromStorage();
  }

  /**
   * Load permissions from localStorage
   */
  loadPermissionsFromStorage(): void {
    const permissionsStr = localStorage.getItem('userPermissions');
    if (permissionsStr) {
      try {
        this.permissions = JSON.parse(permissionsStr);
      } catch (error) {
        this.permissions = [];
      }
    }
  }

  /**
   * Set permissions (called after getting user info from /auth/me)
   */
  setPermissions(permissions: Permission[]): void {
    this.permissions = permissions;
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
  }

  /**
   * Get all permissions
   */
  getPermissions(): Permission[] {
    return this.permissions;
  }

  /**
   * Check if user has a specific permission by name/code
   * @param permissionName - Permission name/code (e.g., 'USER_MANAGE', 'SCALE_VIEW')
   */
  hasPermission(permissionName: string): boolean {
    if (!permissionName) return true; // If no permission required, allow access
    return this.permissions.some(
      p => p.name === permissionName || p.code === permissionName
    );
  }

  /**
   * Check if user has permission by resource and action
   * @param resource - Resource name (e.g., 'USER', 'SCALE', 'ROLE')
   * @param action - Action name (e.g., 'MANAGE', 'VIEW', 'OPERATE')
   */
  hasPermissionByResourceAction(resource: string, action: string): boolean {
    if (!resource || !action) return true;
    return this.permissions.some(
      p => p.resource === resource && p.action === action
    );
  }

  /**
   * Check if user has any of the provided permissions
   * @param permissionNames - Array of permission names/codes
   */
  hasAnyPermission(permissionNames: string[]): boolean {
    if (!permissionNames || permissionNames.length === 0) return true;
    return permissionNames.some(name => this.hasPermission(name));
  }

  /**
   * Check if user has all of the provided permissions
   * @param permissionNames - Array of permission names/codes
   */
  hasAllPermissions(permissionNames: string[]): boolean {
    if (!permissionNames || permissionNames.length === 0) return true;
    return permissionNames.every(name => this.hasPermission(name));
  }

  /**
   * Clear permissions (on logout)
   */
  clearPermissions(): void {
    this.permissions = [];
    localStorage.removeItem('userPermissions');
  }
}

