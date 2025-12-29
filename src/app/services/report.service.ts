import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environment/environment';
import { BaseService } from './base.service';
import { IntervalReportResponse, IntervalType, AggregationType } from '../models/scale-report.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(
    private baseService: BaseService,
    private http: HttpClient
  ) {}

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

  async getIntervalReport(data: {
    scaleIds: number[];
    fromDate: string;
    toDate: string;
    fromTime: string;
    toTime: string;
    interval: IntervalType;
    aggregationByField: {
      [key: string]: AggregationType;
    };
  }): Promise<IntervalReportResponse | null> {
    const res = await this.baseService.postData('reports/interval', data);
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

  async exportReport(data: {
    type?: string;
    scaleIds: number[];
    startTime: string;
    endTime: string;
    dataFields: string[];
    aggregationMethod?: string;
    aggregationByField: {
      [key: string]: AggregationType;
    };
    intervalReport?: boolean;
    timeInterval: IntervalType;
    locationIds?: number[];
    activeOnly?: boolean;
    reportTitle?: string;
    reportCode?: string;
    preparedBy?: string;
  }): Promise<any> {
    const url = `${environment.api_end_point}/api/v1/reports/BCSL/export`;
    const token = localStorage.getItem('token');
    const language = localStorage.getItem('language') ?? 'vi_VN';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Language': language,
      ...(token && { Authorization: `Bearer ${token}` }),
    });

    try {
      const response = await firstValueFrom(
        this.http.post(url, data, {
          headers,
          responseType: 'text',
          observe: 'response',
        })
      );

      if (response?.status === 200 && response?.body) {
        return response.body;
      }
      throw new Error('Không thể xuất báo cáo');
    } catch (error: any) {
      throw error;
    }
  }
}

