import { Injectable } from '@angular/core';
import { Permission } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor(private baseService: BaseService) {}

  async getPermissions(params?: any): Promise<{
    data: Permission[];
    total: number;
    content?: Permission[];
    total_elements?: number;
    page?: number;
    size?: number;
    total_pages?: number;
  }> {
    const res = await this.baseService.getData('permissions', params);
    if (!res) return { data: [], total: 0 };

    const payload = res.success === true ? res.data : res;

    // New format: { data: { data: [...], page, size, total_elements, ... } }
    if (payload?.data && Array.isArray(payload.data)) {
      const data = payload.data;
      const total =
        payload.total_elements ?? payload.totalElements ?? data.length;
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

  async getPermissionById(id: number): Promise<Permission | null> {
    const res = await this.baseService.getData(`permissions/${id}`);
    if (res && res.success === true && res.data) {
      return res.data ?? null;
    }
    return null;
  }

  async createPermission(data: {
    code: string;
    description?: string;
  }): Promise<{ success: boolean; data?: Permission }> {
    try {
      const res = await this.baseService.postData('permissions', data);
      if (res && res.success === true) {
        return { success: true, data: res.data ?? null };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  async updatePermission(
    id: number,
    data: { code?: string; description?: string }
  ): Promise<{ success: boolean; data?: Permission }> {
    try {
      const res = await this.baseService.putData(`permissions/${id}`, data);
      if (res && res.success === true) {
        return { success: true, data: res.data ?? null };
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
