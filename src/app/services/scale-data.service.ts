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
    content: any[];
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
    
    // Handle different response formats
    let responseData: any = null;
    
    if (res) {
      // Check if response has success wrapper
      if (res.success === true && res.data) {
        responseData = res.data;
      } else if (res.content || res.total_elements !== undefined) {
        // Direct paginated response (no success wrapper)
        responseData = res;
      } else if (Array.isArray(res)) {
        // Direct array response
        return {
          content: res,
          total_elements: res.length,
          page: 0,
          size: res.length,
          total_pages: 1,
          is_first: true,
          is_last: true,
          has_next: false,
          has_previous: false,
        };
      }
    }
    
    if (responseData) {
      // Check if response has content array (paginated response)
      if (responseData.content) {
        return {
          content: responseData.content,
          total_elements: responseData.total_elements ?? 0,
          page: responseData.page ?? 0,
          size: responseData.size ?? 20,
          total_pages: responseData.total_pages ?? 0,
          is_first: responseData.is_first ?? true,
          is_last: responseData.is_last ?? false,
          has_next: responseData.has_next ?? false,
          has_previous: responseData.has_previous ?? false,
        };
      } else if (Array.isArray(responseData)) {
        // Flat array response
        return {
          content: responseData,
          total_elements: responseData.length,
          page: 0,
          size: responseData.length,
          total_pages: 1,
          is_first: true,
          is_last: true,
          has_next: false,
          has_previous: false,
        };
      }
    }
    
    return null;
  }
}
