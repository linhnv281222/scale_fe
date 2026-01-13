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
    total_scales?: number;
    active_scales?: number;
    inactive_scales?: number;
  }> {
    // Use v2 API which returns summary statistics and paginated list
    const res = await this.baseService.getData('scales/v2', params);
    if (!res) return { data: [], total: 0 };

    const payload = res.success === true ? res.data : res;

    // New v2 format: res.data.data.data (3 layers nested)
    // { success: true, data: { data: { data: [...], page, size, total_elements, ... }, total_scales, active_scales, inactive_scales } }
    if (payload?.data?.data?.data && Array.isArray(payload.data.data.data)) {
      const pageData = payload.data.data;
      const data: Scale[] = pageData.data;
      const total =
        pageData.total_elements ?? pageData.totalElements ?? data.length;
      return {
        data,
        total,
        content: data,
        total_elements: total,
        page: pageData.page ?? 0,
        size: pageData.size ?? data.length,
        total_pages: pageData.total_pages ?? pageData.totalPages ?? 1,
        total_scales: payload.data.total_scales,
        active_scales: payload.data.active_scales,
        inactive_scales: payload.data.inactive_scales,
      };
    }
    
    // Fallback: try 2-layer nested format
    const container = payload?.data ?? payload;
    if (container?.data && Array.isArray(container.data)) {
      const pageData = container;
      const data: Scale[] = pageData.data;
      const total =
        pageData.total_elements ?? pageData.totalElements ?? data.length;
      return {
        data,
        total,
        content: data,
        total_elements: total,
        page: pageData.page ?? 0,
        size: pageData.size ?? data.length,
        total_pages: pageData.total_pages ?? pageData.totalPages ?? 1,
        total_scales: container.total_scales,
        active_scales: container.active_scales,
        inactive_scales: container.inactive_scales,
      };
    }

    // Fallback: previous paginated format { data: [...], page, size, total_elements, ... }
    if (payload?.data && Array.isArray(payload.data)) {
      const data: Scale[] = payload.data;
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
