import { Injectable } from '@angular/core';
import { License } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class LicenseService {
  constructor(private baseService: BaseService) {}

  // TODO: API 'licenses' chưa có trong api-docs.json - tạm thời comment lại
  // async getLicenses(params?: any): Promise<{ data: License[]; total: number }> {
  //   const res = await this.baseService.getData('licenses', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // async getLicenseById(id: number): Promise<License | null> {
  //   const res = await this.baseService.getData(`licenses/${id}`);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async createLicense(data: Partial<License>): Promise<License | null> {
  //   const res = await this.baseService.postData('licenses', data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async updateLicense(id: number, data: Partial<License>): Promise<License | null> {
  //   const res = await this.baseService.putData(`licenses/${id}`, data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async deleteLicense(id: number): Promise<boolean> {
  //   try {
  //     await this.baseService.deleteData(`licenses/${id}`);
  //     return true;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  async getLicenses(params?: any): Promise<{ data: License[]; total: number; content?: License[]; total_elements?: number; page?: number; size?: number; total_pages?: number }> {
    const res = await this.baseService.getData('licenses', params);
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

  async getLicenseById(id: number): Promise<License | null> {
    return null;
  }

  async createLicense(data: Partial<License>): Promise<License | null> {
    return null;
  }

  async updateLicense(
    id: number,
    data: Partial<License>
  ): Promise<License | null> {
    return null;
  }

  async deleteLicense(id: number): Promise<boolean> {
    return false;
  }
}
