import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models';
import { UserPermissionService } from './user-permission.service';
import { BaseService } from './base.service';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  username: string;
  fullName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;

  constructor(
    private baseService: BaseService,
    private router: Router,
    private userPermissionService: UserPermissionService
  ) {
    this.loadUserFromStorage();
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res = await this.baseService.postData('auth/login', { username, password });
      if (res && res.success === true && res.data) {
        const loginData = res.data;
        if (loginData.accessToken) {
          localStorage.setItem('token', loginData.accessToken);
          localStorage.setItem('refreshToken', loginData.refreshToken);
          localStorage.setItem('tokenType', loginData.tokenType || 'Bearer');

          const user: User = {
            id: loginData.userId,
            username: loginData.username,
            fullName: loginData.fullName
          };
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser = user;
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        this.clearAuthData();
        this.router.navigate(['/login']);
        return false;
      }

      const res = await this.baseService.postData('auth/refresh', { refreshToken });
      if (res && res.success === true && res.data) {
        const loginData = res.data;
        if (loginData.accessToken) {
          localStorage.setItem('token', loginData.accessToken);
          if (loginData.refreshToken) {
            localStorage.setItem('refreshToken', loginData.refreshToken);
          }
          return true;
        }
      }
      this.clearAuthData();
      this.router.navigate(['/login']);
      return false;
    } catch (error) {
      this.clearAuthData();
      this.router.navigate(['/login']);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.baseService.postData('auth/logout', {});
    } catch (error) {
      // Nếu API logout fail, vẫn clear local data
    } finally {
      this.clearAuthData();
      this.router.navigate(['/login']);
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('user');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userPermissions');
    this.currentUser = null;
    this.userPermissionService.clearPermissions();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getUserRoles(): string[] {
    const roles = localStorage.getItem('userRoles');
    return roles ? JSON.parse(roles) : [];
  }

  async getMe(): Promise<User | null> {
    try {
      const res = await this.baseService.getData('auth/me');
      if (res && res.success === true && res.data) {
        const userData = res.data;
        const user: User = {
          id: userData.id,
          username: userData.username,
          fullName: userData.fullName,
          roles: userData.roles,
        };
        localStorage.setItem('user', JSON.stringify(user));
        if (userData.roles && Array.isArray(userData.roles)) {
          const roleCodes = userData.roles.map((r: any) => r.code || r.name).filter(Boolean);
          localStorage.setItem('userRoles', JSON.stringify(roleCodes));
          
          // Extract all permissions from roles
          const allPermissions: any[] = [];
          userData.roles.forEach((role: any) => {
            if (role.permissions && Array.isArray(role.permissions)) {
              role.permissions.forEach((permission: any) => {
                // Avoid duplicates
                if (!allPermissions.find(p => p.id === permission.id || p.name === permission.name)) {
                  allPermissions.push(permission);
                }
              });
            }
          });
          localStorage.setItem('userPermissions', JSON.stringify(allPermissions));
          // Update permission service
          this.userPermissionService.setPermissions(allPermissions);
        }
        this.currentUser = user;
        return user;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }
}

