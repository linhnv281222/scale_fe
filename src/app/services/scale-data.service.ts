import { Injectable } from '@angular/core';
import { ScaleData } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ScaleDataService {
  constructor(private baseService: BaseService) {}

  // TODO: API 'scale-data/current' chưa có trong api-docs.json - tạm thời comment lại
  // Có thể sử dụng '/scales/current-states' thay thế
  // async getCurrentScaleData(params?: any): Promise<{ data: ScaleData[]; total: number }> {
  //   const res = await this.baseService.getData('scale-data/current', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // TODO: API 'scale-data' chưa có trong api-docs.json - tạm thời comment lại
  // async getScaleData(params?: any): Promise<{ data: ScaleData[]; total: number }> {
  //   const res = await this.baseService.getData('scale-data', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // Temporary mock implementation
  async getCurrentScaleData(
    params?: any
  ): Promise<{ data: ScaleData[]; total: number }> {
    return { data: [], total: 0 };
  }

  async getScaleData(
    params?: any
  ): Promise<{ data: ScaleData[]; total: number }> {
    return { data: [], total: 0 };
  }

  async getScalesCurrentStates(): Promise<any[]> {
    const res = await this.baseService.getData('scales/current-states');
    if (res && res.success === true && res.data) {
      return res.data || [];
    }
    return [];
  }

  async getScaleHistory(params: {
    scaleId?: number;
    scaleCode?: string;
    direction?: string;
    locationId?: number;
    protocolId?: number;
    startTime?: string;
    endTime?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<{
    data: any[];
    total_elements: number;
    page: number;
    size: number;
    total_pages: number;
    is_first: boolean;
    is_last: boolean;
    has_next: boolean;
    has_previous: boolean;
  } | null> {
    const queryParams: any = {};
    
    // Build query params according to API documentation
    if (params.page !== undefined) {
      queryParams.page = params.page;
    }
    if (params.size !== undefined) {
      queryParams.size = params.size;
    }
    if (params.sort) {
      queryParams.sort = params.sort;
    }
    if (params.search) {
      queryParams.search = params.search;
    }
    if (params.scaleId !== undefined) {
      queryParams.scaleId = params.scaleId;
    }
    if (params.scaleCode) {
      queryParams.scaleCode = params.scaleCode;
    }
    if (params.direction) {
      queryParams.direction = params.direction;
    }
    if (params.locationId !== undefined) {
      queryParams.locationId = params.locationId;
    }
    if (params.protocolId !== undefined) {
      queryParams.protocolId = params.protocolId;
    }
    if (params.startTime) {
      queryParams.startTime = params.startTime;
    }
    if (params.endTime) {
      queryParams.endTime = params.endTime;
    }

    const res = await this.baseService.getData('weighing-history', queryParams);

    if (!res) return null;

    // New format: { data: [...], page, size, total_elements, ... }
    const payload = res.success === true ? res.data ?? res : res;

    if (Array.isArray(payload)) {
      return {
        data: payload,
        total_elements: payload.length,
        page: 0,
        size: payload.length,
        total_pages: 1,
        is_first: true,
        is_last: true,
        has_next: false,
        has_previous: false,
      };
    }

    if (payload?.data && Array.isArray(payload.data)) {
      return {
        data: payload.data,
        total_elements: payload.total_elements ?? payload.totalElements ?? payload.data.length ?? 0,
        page: payload.page ?? payload.pageNumber ?? 0,
        size: payload.size ?? payload.pageSize ?? payload.data.length ?? 0,
        total_pages: payload.total_pages ?? payload.totalPages ?? 1,
        is_first: payload.is_first ?? payload.isFirst ?? payload.page === 0 ?? true,
        is_last: payload.is_last ?? payload.isLast ?? false,
        has_next: payload.has_next ?? payload.hasNext ?? false,
        has_previous: payload.has_previous ?? payload.hasPrevious ?? false,
      };
    }

    return null;
  }
}
