import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Shift } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ShiftService {
  constructor(private baseService: BaseService) {}

  async getShifts(): Promise<Shift[]> {
    try {
      // API endpoint is 'shift' (not 'shifts') and doesn't support pagination or query params
      const res = await this.baseService.getData('shifts');
      if (res && res.success === true && res.data) {
        const shifts = Array.isArray(res.data) ? res.data : [];
        // Map API response to Shift model
        return shifts.map((shift: any) => this.mapApiToShift(shift));
      }
      return [];
    } catch (error) {
      console.error('Error getting shifts:', error);
      return [];
    }
  }

  async getShiftById(id: number): Promise<Shift | null> {
    try {
      const res = await this.baseService.getData(`shifts/${id}`);
      if (res && res.success === true && res.data) {
        return this.mapApiToShift(res.data);
      }
      return null;
    } catch (error) {
      console.error('Error getting shift by id:', error);
      return null;
    }
  }

  async createShift(data: Partial<Shift>): Promise<Shift | null> {
    try {
      // Map to API format
      const payload = {
        code: data.code || data.name?.toUpperCase().replace(/\s+/g, ''),
        name: data.name,
        start_time: data.start_time || data.startTime || '',
        end_time: data.end_time || data.endTime || '',
        is_active: data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true),
      };
      const res = await this.baseService.postData('shifts', payload);
      if (res && res.success === true && res.data) {
        return this.mapApiToShift(res.data);
      }
      return null;
    } catch (error) {
      console.error('Error creating shift:', error);
      return null;
    }
  }

  async updateShift(id: number, data: Partial<Shift>): Promise<Shift | null> {
    try {
      // API only accepts: name, start_time, end_time, is_active (no code)
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.start_time !== undefined) payload.start_time = data.start_time;
      else if (data.startTime !== undefined) payload.start_time = data.startTime;
      if (data.end_time !== undefined) payload.end_time = data.end_time;
      else if (data.endTime !== undefined) payload.end_time = data.endTime;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      else if (data.isActive !== undefined) payload.is_active = data.isActive;

      const res = await this.baseService.putData(`shifts/${id}`, payload);
      if (res && res.success === true && res.data) {
        return this.mapApiToShift(res.data);
      }
      return null;
    } catch (error) {
      console.error('Error updating shift:', error);
      return null;
    }
  }

  async deleteShift(id: number): Promise<boolean> {
    try {
      await this.baseService.deleteData(`shifts/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting shift:', error);
      return false;
    }
  }

  // Map API response to Shift model
  private mapApiToShift(apiData: any): Shift {
    return {
      id: apiData.id,
      code: apiData.code,
      name: apiData.name,
      start_time: apiData.start_time,
      end_time: apiData.end_time,
      is_active: apiData.is_active,
      created_at: apiData.created_at,
      created_by: apiData.created_by,
      updated_at: apiData.updated_at,
      updated_by: apiData.updated_by,
      // For backward compatibility
      startTime: apiData.start_time ? moment(apiData.start_time, 'HH:mm:ss').format('HH:mm') : undefined, // HH:mm
      endTime: apiData.end_time ? moment(apiData.end_time, 'HH:mm:ss').format('HH:mm') : undefined, // HH:mm
      isActive: apiData.is_active,
      status: apiData.is_active ? 'active' : 'inactive',
      createdAt: apiData.created_at ? new Date(apiData.created_at) : undefined,
      updatedAt: apiData.updated_at ? new Date(apiData.updated_at) : undefined,
    };
  }
}
