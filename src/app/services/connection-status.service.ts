import { Injectable } from '@angular/core';
import { ConnectionStatus } from '../models';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ConnectionStatusService {
  constructor(private baseService: BaseService) {}

  // TODO: API 'connection-status' chưa có trong api-docs.json - tạm thời comment lại
  // async getConnectionStatuses(params?: any): Promise<{ data: ConnectionStatus[]; total: number }> {
  //   const res = await this.baseService.getData('connection-status', params);
  //   if (res && res.success === true && res.data) {
  //     const data = res.data || [];
  //     return { data, total: data.length };
  //   }
  //   return { data: [], total: 0 };
  // }

  // Temporary mock implementation
  async getConnectionStatuses(
    params?: any
  ): Promise<{ data: ConnectionStatus[]; total: number }> {
    return { data: [], total: 0 };
  }
}
