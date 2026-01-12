import { Injectable } from '@angular/core';
import { Scale } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ScaleService {
  constructor(private baseService: BaseService) {}

  async getScales(params?: any): Promise<{ data: Scale[]; total: number; content?: Scale[]; total_elements?: number }> {
    const res = await this.baseService.getData('scales', params);
    if (res && res.success === true && res.data) {
      // Check if response has content array (paginated)
    if (Array.isArray(res.data)) {
        // Flat array
        const data = res.data;
        return { data, total: data.length };
      }
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

  async getScaleConfig(id: number): Promise<any | null> {
    const res = await this.baseService.getData(`scales/${id}/config`);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async updateScaleConfig(id: number, data: {
    protocol: string;
    poll_interval: number;
    conn_params: {
      ip: string;
      port: number;
    };
    data_1?: {
      name?: string;
      start_registers?: number;
      num_registers?: number;
      is_used: boolean;
    };
    data_2?: {
      name?: string;
      start_registers?: number;
      num_registers?: number;
      is_used: boolean;
    };
    data_3?: {
      is_used: boolean;
    };
    data_4?: {
      is_used: boolean;
    };
    data_5?: {
      is_used: boolean;
    };
  }): Promise<any | null> {
    const res = await this.baseService.putData(`scales/${id}/config`, data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }
}

