import { Injectable } from '@angular/core';
import { Permission } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor(private baseService: BaseService) {}

  async getPermissions(): Promise<Permission[]> {
    const res = await this.baseService.getData('permissions');
    if (res && res.success === true && res.data) {
      return res.data || [];
    }
    return [];
  }

  async getPermissionById(id: number): Promise<Permission | null> {
    const res = await this.baseService.getData(`permissions/${id}`);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async createPermission(data: { code: string; description?: string }): Promise<{ success: boolean; data?: Permission }> {
    try {
      const res = await this.baseService.postData('permissions', data);
      if (res && res.success === true) {
        return { success: true, data: res.data || null };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  async updatePermission(id: number, data: { code?: string; description?: string }): Promise<{ success: boolean; data?: Permission }> {
    try {
      const res = await this.baseService.putData(`permissions/${id}`, data);
      if (res && res.success === true) {
        return { success: true, data: res.data || null };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  async deletePermission(id: number): Promise<boolean> {
    try {
      await this.baseService.deleteData(`permissions/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

