import { Injectable } from '@angular/core';
import { Protocol } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ProtocolService {
  constructor(private baseService: BaseService) {}

  // TODO: API 'protocols' chưa có trong api-docs.json - tạm thời comment lại
  // async getProtocols(params?: any): Promise<{ data: Protocol[]; total: number }> {
  //   const res = await this.baseService.getData('protocols', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // async getProtocolById(id: number): Promise<Protocol | null> {
  //   const res = await this.baseService.getData(`protocols/${id}`);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async createProtocol(data: Partial<Protocol>): Promise<Protocol | null> {
  //   const res = await this.baseService.postData('protocols', data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async updateProtocol(id: number, data: Partial<Protocol>): Promise<Protocol | null> {
  //   const res = await this.baseService.putData(`protocols/${id}`, data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async deleteProtocol(id: number): Promise<boolean> {
  //   try {
  //     await this.baseService.deleteData(`protocols/${id}`);
  //     return true;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  async getProtocols(
    params?: any
  ): Promise<{ data: Protocol[]; total: number; content?: Protocol[]; total_elements?: number }> {
    const res = await this.baseService.getData('protocols', params);
    if (res && res.success === true && res.data) {
      if (Array.isArray(res.data)) {
        // Array response
        const data = res.data;
        return { data, total: data.length };
      }
    }
    return { data: [], total: 0 };
  }

  async getProtocolById(id: number): Promise<Protocol | null> {
    const res = await this.baseService.getData(`protocols/${id}`);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async createProtocol(data: any): Promise<Protocol | null> {
    const res = await this.baseService.postData('protocols', data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async updateProtocol(
    id: number,
    data: any
  ): Promise<Protocol | null> {
    const res = await this.baseService.putData(`protocols/${id}`, data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async deleteProtocol(id: number): Promise<boolean> {
    try {
      await this.baseService.deleteData(`protocols/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}
