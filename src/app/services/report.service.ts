import { Injectable } from '@angular/core';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private baseService: BaseService) {}

  async generateReport(data: {
    scaleIds: number[];
    dataField: string;
    method: 'SUM' | 'AVG' | 'MAX';
    fromDate: string;
    toDate: string;
    interval: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  }): Promise<any> {
    const res = await this.baseService.postData('reports/generate', data);
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }

  async aggregateDailyData(): Promise<string | null> {
    const res = await this.baseService.postData('reports/aggregate-daily', {});
    if (res && res.success === true && res.data) {
      return res.data || null;
    }
    return null;
  }
}

