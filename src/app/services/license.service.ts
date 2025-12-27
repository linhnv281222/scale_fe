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

  // Temporary mock implementation
  async getLicenses(params?: any): Promise<{ data: License[]; total: number }> {
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
