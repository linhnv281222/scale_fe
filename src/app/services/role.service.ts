import { Injectable } from '@angular/core';
import { Role } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  constructor(private baseService: BaseService) {}

  async getRoles(): Promise<Role[]> {
    const res = await this.baseService.getData('roles');
    if (res && res.success === true && res.data) {
      return res.data || [];
    }
    return [];
  }

  async getRoleById(id: number): Promise<Role | null> {
    const res = await this.baseService.getData(`roles/${id}`);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    if (res && res.id) {
      return res;
    }
    return null;
  }

  async createRole(data: { name: string; code: string; permissionIds: number[] }): Promise<{ success: boolean; data?: Role }> {
    try {
      const res = await this.baseService.postData('roles', data);
      if (res && res.success === true) {
        return { success: true, data: res.data || null };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  async updateRole(id: number, data: { name?: string; code?: string; permissionIds?: number[] }): Promise<{ success: boolean; data?: Role }> {
    try {
      const res = await this.baseService.putData(`roles/${id}`, data);
      if (res && res.success === true) {
        return { success: true, data: res.data || null };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  async deleteRole(id: number): Promise<boolean> {
    try {
      await this.baseService.deleteData(`roles/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

