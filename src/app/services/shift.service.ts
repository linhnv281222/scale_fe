import { Injectable } from '@angular/core';
import { Shift } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ShiftService {
  constructor(private baseService: BaseService) {}

  // TODO: API 'shifts' chưa có trong api-docs.json - tạm thời comment lại
  // async getShifts(params?: any): Promise<{ data: Shift[]; total: number }> {
  //   const res = await this.baseService.getData('shifts', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // async getShiftById(id: number): Promise<Shift | null> {
  //   const res = await this.baseService.getData(`shifts/${id}`);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async createShift(data: Partial<Shift>): Promise<Shift | null> {
  //   const res = await this.baseService.postData('shifts', data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async updateShift(id: number, data: Partial<Shift>): Promise<Shift | null> {
  //   const res = await this.baseService.putData(`shifts/${id}`, data);
  //   if (res && res.success === true && res.data) {
  //     return res.data || null;
  //   }
  //   return null;
  // }

  // async deleteShift(id: number): Promise<boolean> {
  //   try {
  //     await this.baseService.deleteData(`shifts/${id}`);
  //     return true;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  // Temporary mock implementation
  async getShifts(params?: any): Promise<{ data: Shift[]; total: number }> {
    return { data: [], total: 0 };
  }

  async getShiftById(id: number): Promise<Shift | null> {
    return null;
  }

  async createShift(data: Partial<Shift>): Promise<Shift | null> {
    return null;
  }

  async updateShift(id: number, data: Partial<Shift>): Promise<Shift | null> {
    return null;
  }

  async deleteShift(id: number): Promise<boolean> {
    return false;
  }
}
