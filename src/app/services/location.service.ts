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

  async getLocations(params?: any): Promise<{ data: Location[]; total: number; content?: Location[]; total_elements?: number; page?: number; size?: number; total_pages?: number }> {
    const res = await this.baseService.getData('locations', params);
    if (!res) return { data: [], total: 0 };

    const payload = res.success === true ? res.data : res;

    // Check if payload has nested data object (new format with pagination)
    if (payload?.data && Array.isArray(payload.data)) {
      const data = payload.data;
      // Check if it's tree structure (has children property)
      if (data.length > 0 && data[0].children !== undefined) {
        // Tree structure (no pagination)
        const total = this.countAllNodes(data);
        return { data, total };
      } else {
        // Flat array with pagination
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
    }

    // Old format: direct array or content array
    if (Array.isArray(payload)) {
      // Check if it's tree structure
      if (payload.length > 0 && payload[0].children !== undefined) {
        const total = this.countAllNodes(payload);
        return { data: payload, total };
      } else {
        return { data: payload, total: payload.length };
      }
    }

    return { data: [], total: 0 };
  }

  private countAllNodes(items: Location[]): number {
    let count = 0;
    const countNodes = (nodes: Location[]) => {
      nodes.forEach((node) => {
        count++;
        if (node.children && node.children.length > 0) {
          countNodes(node.children);
        }
      });
    };
    countNodes(items);
    return count;
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

