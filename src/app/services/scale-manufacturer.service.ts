import { Injectable } from '@angular/core';
import { ScaleManufacturer } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ScaleManufacturerService {
  constructor(private baseService: BaseService) {}

  // TODO: API 'scale-manufacturers' chưa có trong api-docs.json - tạm thời comment lại
  // async getScaleManufacturers(params?: any): Promise<{ data: ScaleManufacturer[]; total: number }> {
  //   const res = await this.baseService.getData('scale-manufacturers', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // async getScaleManufacturerById(id: number): Promise<ScaleManufacturer | null> {
  //   const res = await this.baseService.getData(`scale-manufacturers/${id}`);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async createScaleManufacturer(data: Partial<ScaleManufacturer>): Promise<ScaleManufacturer | null> {
  //   const res = await this.baseService.postData('scale-manufacturers', data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async updateScaleManufacturer(id: number, data: Partial<ScaleManufacturer>): Promise<ScaleManufacturer | null> {
  //   const res = await this.baseService.putData(`scale-manufacturers/${id}`, data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async deleteScaleManufacturer(id: number): Promise<boolean> {
  //   try {
  //     await this.baseService.deleteData(`scale-manufacturers/${id}`);
  //     return true;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  // Use new API /api/v1/manufacturers
  async getScaleManufacturers(
    params?: any
  ): Promise<{ data: ScaleManufacturer[]; total: number; content?: ScaleManufacturer[]; total_elements?: number; page?: number; size?: number; total_pages?: number }> {
    const res = await this.baseService.getData('manufacturers', params);
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

  async getScaleManufacturerById(
    id: number
  ): Promise<ScaleManufacturer | null> {
    const res = await this.baseService.getData(`manufacturers/${id}`);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async createScaleManufacturer(
    data: any
  ): Promise<ScaleManufacturer | null> {
    const res = await this.baseService.postData('manufacturers', data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async updateScaleManufacturer(
    id: number,
    data: any
  ): Promise<ScaleManufacturer | null> {
    const res = await this.baseService.putData(`manufacturers/${id}`, data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async deleteScaleManufacturer(id: number): Promise<boolean> {
    try {
      await this.baseService.deleteData(`manufacturers/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}
