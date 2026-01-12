import { Injectable } from '@angular/core';
import { Role } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  constructor(private baseService: BaseService) {}

  async getRoles(params?: any): Promise<{ data: Role[]; total: number; content?: Role[]; total_elements?: number; page?: number; size?: number; total_pages?: number }> {
    const res = await this.baseService.getData('roles', params);
    if (!res) return { data: [], total: 0 };

    const payload = res.success === true ? res.data : res;

    // New format: { data: { data: [...], page, size, total_elements, ... } }
    if (payload?.data && Array.isArray(payload.data)) {
      const data = payload.data;
      const total = payload.total_elements ?? payload.totalElements ?? data.length;
      return {
        data,
        total,
        content: data,
        total_elements: total,
        page: payload.page ?? 0,
        size: payload.size ?? data.length,
        total_pages: payload.total_pages ?? payload.totalPages ?? 1,
      };
    }

    // Old format: direct array
    if (Array.isArray(payload)) {
      return { data: payload, total: payload.length };
    }

    return { data: [], total: 0 };
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

