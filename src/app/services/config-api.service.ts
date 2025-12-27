import { Injectable } from '@angular/core';
import { Config } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigApiService {
  constructor(private baseService: BaseService) {}

  // TODO: API 'configs' chưa có trong api-docs.json - tạm thời comment lại
  // async getConfigs(params?: any): Promise<{ data: Config[]; total: number }> {
  //   const res = await this.baseService.getData('configs', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // async getConfigByKey(key: string): Promise<Config | null> {
  //   const res = await this.baseService.getData(`configs/${key}`);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async getDefaultReadCycle(): Promise<Config | null> {
  //   const res = await this.baseService.getData('configs/defaultReadCycle');
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async createConfig(data: Partial<Config>): Promise<Config | null> {
  //   const res = await this.baseService.postData('configs', data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async updateConfig(id: number, data: Partial<Config>): Promise<Config | null> {
  //   const res = await this.baseService.putData(`configs/${id}`, data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async deleteConfig(id: number): Promise<boolean> {
  //   try {
  //     await this.baseService.deleteData(`configs/${id}`);
  //     return true;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  // Temporary mock implementation
  async getConfigs(params?: any): Promise<{ data: Config[]; total: number }> {
    return { data: [], total: 0 };
  }

  async getConfigByKey(key: string): Promise<Config | null> {
    return null;
  }

  async getDefaultReadCycle(): Promise<Config | null> {
    return null;
  }

  async createConfig(data: Partial<Config>): Promise<Config | null> {
    return null;
  }

  async updateConfig(
    id: number,
    data: Partial<Config>
  ): Promise<Config | null> {
    return null;
  }

  async deleteConfig(id: number): Promise<boolean> {
    return false;
  }
}
