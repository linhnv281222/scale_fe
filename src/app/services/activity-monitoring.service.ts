import { Injectable } from '@angular/core';
import { BaseService } from './base.service';

export interface ActivityMonitoringItem {
  scaleId: number;
  scale?: any;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  isConnected: boolean;
  lastDataTime?: Date;
  errorMessage?: string;
  currentWeight?: number;
  currentTimestamp?: Date;
  minutesWithoutData?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityMonitoringService {
  constructor(private baseService: BaseService) {}

  // TODO: API 'activity-monitoring' chưa có trong api-docs.json - tạm thời comment lại
  // async getActivityData(params?: any): Promise<{ data: ActivityMonitoringItem[]; total: number }> {
  //   const res = await this.baseService.getData('activity-monitoring', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // Temporary mock implementation
  async getActivityData(
    params?: any
  ): Promise<{ data: ActivityMonitoringItem[]; total: number }> {
    return { data: [], total: 0 };
  }
}
