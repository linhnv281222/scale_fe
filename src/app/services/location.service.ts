import { Injectable } from '@angular/core';
import { Location } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  constructor(private baseService: BaseService) {}

  async getLocationsTree(): Promise<Location[]> {
    const res = await this.baseService.getData('locations/tree');
    if (res && res.success === true && res.data) {
      return res.data || [];
    }
    return [];
  }

  async getLocations(params?: any): Promise<{ data: Location[]; total: number }> {
    const res = await this.baseService.getData('locations', params);
    if (res && res.success === true && res.data) {
      const data = res.data || [];
      const total = data.length;
      return { data, total };
    }
    return { data: [], total: 0 };
  }

  async getLocationById(id: number): Promise<Location | null> {
    const res = await this.baseService.getData(`locations/${id}`);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async createLocation(data: { code: string; name: string; description?: string; parentId?: number }): Promise<{ success: boolean; data?: Location }> {
    const requestData: any = {
      code: data.code,
      name: data.name,
    };
    if (data.description) {
      requestData.description = data.description;
    }
    if (data.parentId) {
      requestData.parentId = data.parentId;
    }

    try {
      const res = await this.baseService.postData('locations', requestData);
      if (res && res.success === true) {
        return { success: true, data: res.data || null };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  async updateLocation(id: number, data: { name: string; description?: string; parentId?: number }): Promise<{ success: boolean; data?: Location }> {
    const requestData: any = {
      name: data.name,
    };
    if (data.description !== undefined) {
      requestData.description = data.description;
    }
    if (data.parentId !== undefined) {
      requestData.parentId = data.parentId;
    }

    try {
      const res = await this.baseService.putData(`locations/${id}`, requestData);
      if (res && res.success === true) {
        return { success: true, data: res.data || null };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  async deleteLocation(id: number): Promise<boolean> {
    try {
      await this.baseService.deleteData(`locations/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

