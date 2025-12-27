import { Injectable } from '@angular/core';
import { Scale } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ScaleService {
  constructor(private baseService: BaseService) {}

  async getScales(params?: any): Promise<{ data: Scale[]; total: number }> {
    const res = await this.baseService.getData('scales', params);
    if (res && res.success === true && res.data) {
      const data = res.data || [];
      const total = res.totalElements || res.total || data.length;
      return { data, total };
    }
    return { data: [], total: 0 };
  }

  async getScaleById(id: number): Promise<Scale | null> {
    const res = await this.baseService.getData(`scales/${id}`);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async createScale(data: { name: string; model?: string; location_id?: number; is_active?: boolean }): Promise<Scale | null> {
    const res = await this.baseService.postData('scales', data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async updateScale(id: number, data: { name?: string; model?: string; location_id?: number; is_active?: boolean }): Promise<Scale | null> {
    const res = await this.baseService.putData(`scales/${id}`, data);
    if (res && res.success === true && res.data) {
      return res.data || null;
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

  async getScaleConfig(id: number): Promise<any | null> {
    const res = await this.baseService.getData(`scales/${id}/config`);
    return res || null;
  }

  async updateScaleConfig(id: number, data: {
    protocol: string;
    conn_params: any;
    poll_interval?: number;
    data_1?: any;
    data_2?: any;
    data_3?: any;
    data_4?: any;
    data_5?: any;
  }): Promise<any | null> {
    const res = await this.baseService.putData(`scales/${id}/config`, data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }
}

