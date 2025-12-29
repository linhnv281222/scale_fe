import { Injectable } from '@angular/core';
import { BaseService } from './base.service';

export interface DataValue {
  value: string;
  name: string;
  used: boolean;
}

export interface ActivityMonitoringItem {
  scaleId: number;
  scaleName: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  lastTime: string;
  dataValues: {
    data_1?: DataValue;
    data_2?: DataValue;
    data_3?: DataValue;
    data_4?: DataValue;
    data_5?: DataValue;
  };
  // For backward compatibility
  scale?: any;
  isConnected?: boolean;
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

  async getCurrentStates(params?: any): Promise<{ data: ActivityMonitoringItem[]; total: number }> {
    try {
      const res = await this.baseService.getData('scales/current-states', params);
      if (res && res.success === true && res.data) {
        const data = Array.isArray(res.data) ? res.data : [];
        return { data, total: data.length };
      }
      return { data: [], total: 0 };
    } catch (error) {
      console.error('Error getting current states:', error);
      return { data: [], total: 0 };
    }
  }
}
