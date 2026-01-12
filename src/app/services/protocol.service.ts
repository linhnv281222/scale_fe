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
  ): Promise<{ data: Protocol[]; total: number; content?: Protocol[]; total_elements?: number; page?: number; size?: number; total_pages?: number }> {
    const res = await this.baseService.getData('protocols', params);
    if (!res) return { data: [], total: 0 };

    const payload = res.success === true ? res.data : res;

    // New format: { data: { data: [...], page, size, total_elements, ... } }
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

    // Old format: direct array
    if (Array.isArray(payload)) {
      return { data: payload, total: payload.length };
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
