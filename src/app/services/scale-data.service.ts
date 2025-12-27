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
}
