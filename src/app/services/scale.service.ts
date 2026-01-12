import { Injectable } from '@angular/core';
import { Scale } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ScaleService {
  constructor(private baseService: BaseService) {}

  async getScales(
    params?: any
  ): Promise<{
    data: Scale[];
    total: number;
    content?: Scale[];
    total_elements?: number;
    page?: number;
    size?: number;
    total_pages?: number;
  }> {
    const res = await this.baseService.getData('scales', params);
    if (!res) return { data: [], total: 0 };

    // New format: { success: true, data: { data: [...], page, size, total_elements, ... } }
    const payload = res.success === true ? res.data : res;

    // Check if payload has nested data object (new format)
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

    // Old format: flat array response
    if (Array.isArray(payload)) {
      const data = payload;
      return { data, total: data.length };
    }

    return { data: [], total: 0 };
  }

  async getScaleById(id: number): Promise<Scale | null> {
    const res = await this.baseService.getData(`scales/${id}`);
    if (res?.success === true && res?.data) {
      return res.data;
    }
    return res || null;
  }

  async createScale(data: any): Promise<Scale | null> {
    const res = await this.baseService.postData('scales', data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    } else if (res && res.id) {
      // Response without success wrapper
      return res || null;
    }
    return null;
  }

  async updateScale(id: number, data: any): Promise<Scale | null> {
    const res = await this.baseService.putData(`scales/${id}`, data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    } else if (res && res.id) {
      // Response without success wrapper
      return res || null;
    }
    return null;
  }

  async deleteScale(id: number): Promise<boolean> {
    try {
      await this.baseService.deleteData(`scales/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}
