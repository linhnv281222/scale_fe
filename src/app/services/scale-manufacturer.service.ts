import { Injectable } from '@angular/core';
import { ScaleManufacturer } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ScaleManufacturerService {
  constructor(private baseService: BaseService) {}

  // TODO: API 'scale-manufacturers' chưa có trong api-docs.json - tạm thời comment lại
  // async getScaleManufacturers(params?: any): Promise<{ data: ScaleManufacturer[]; total: number }> {
  //   const res = await this.baseService.getData('scale-manufacturers', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // async getScaleManufacturerById(id: number): Promise<ScaleManufacturer | null> {
  //   const res = await this.baseService.getData(`scale-manufacturers/${id}`);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async createScaleManufacturer(data: Partial<ScaleManufacturer>): Promise<ScaleManufacturer | null> {
  //   const res = await this.baseService.postData('scale-manufacturers', data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async updateScaleManufacturer(id: number, data: Partial<ScaleManufacturer>): Promise<ScaleManufacturer | null> {
  //   const res = await this.baseService.putData(`scale-manufacturers/${id}`, data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async deleteScaleManufacturer(id: number): Promise<boolean> {
  //   try {
  //     await this.baseService.deleteData(`scale-manufacturers/${id}`);
  //     return true;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  // Use new API /api/v1/manufacturers
  async getScaleManufacturers(
    params?: any
  ): Promise<{ data: ScaleManufacturer[]; total: number; content?: ScaleManufacturer[]; total_elements?: number }> {
    const res = await this.baseService.getData('manufacturers', params);
    if (res && res.success === true && res.data) {
      if (res.data.content) {
        // Paginated response
        const content = res.data.content;
        const total = res.data.total_elements;
        return { data: content, total, content: content, total_elements: total };
      } else if (Array.isArray(res.data)) {
        // Array response
        const data = res.data;
        return { data, total: data.length };
      }
    }
    return { data: [], total: 0 };
  }

  async getScaleManufacturerById(
    id: number
  ): Promise<ScaleManufacturer | null> {
    const res = await this.baseService.getData(`manufacturers/${id}`);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async createScaleManufacturer(
    data: any
  ): Promise<ScaleManufacturer | null> {
    const res = await this.baseService.postData('manufacturers', data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async updateScaleManufacturer(
    id: number,
    data: any
  ): Promise<ScaleManufacturer | null> {
    const res = await this.baseService.putData(`manufacturers/${id}`, data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async deleteScaleManufacturer(id: number): Promise<boolean> {
    try {
      await this.baseService.deleteData(`manufacturers/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}
