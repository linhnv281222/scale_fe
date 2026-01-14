import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environment/environment';
import {
    AggregationType,
    IntervalType
} from '../models/scale-report.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private baseService: BaseService, private http: HttpClient) {}

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
    scaleIds?: number[];
    manufacturerIds?: number[];
    locationIds?: number[];
    direction?: string;
    shiftIds?: number[];
    fromDate?: string;
    toDate?: string;
    fromTime: string;
    toTime: string;
    interval: IntervalType;
    aggregationByField: {
      [key: string]: AggregationType;
    };
    ratioFormula?: string;
    page?: number;
    size?: number;
  }): Promise<any> {
    const res = await this.baseService.postData('reports/interval/v2', data);
    if (res && res.success === true && res.data) {
      return res.data;
    }
    return res ?? null;
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

  async exportReportWithTemplate(
    importId: number,
    data: {
      type: string;
      scaleIds: number[];
      startTime: string;
      endTime: string;
      dataFields: string[];
      aggregationMethod: string;
      aggregationByField: {
        [key: string]: AggregationType;
      };
      intervalReport: boolean;
      timeInterval: IntervalType;
      locationIds?: number[];
      activeOnly: boolean;
      reportTitle?: string;
      reportCode?: string;
      preparedBy?: string;
    }
  ): Promise<Blob> {
    const url = `${environment.api_end_point}/api/v1/reports/export`;
    const token = localStorage.getItem('token');
    const language = localStorage.getItem('language') ?? 'vi_VN';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Language': language,
      ...(token && { Authorization: `Bearer ${token}` }),
    });

    const params = new HttpParams().set('importId', importId.toString());

    try {
      const response = await firstValueFrom(
        this.http.post(url, data, {
          headers,
          params,
          responseType: 'blob',
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

  async exportIntervalReportV2(data: {
    importId: number;
    scaleIds?: number[];
    manufacturerIds?: number[];
    locationIds?: number[];
    direction?: string;
    shiftIds?: number[];
    fromTime: string;
    toTime: string;
    interval: IntervalType;
    aggregationByField: {
      [key: string]: AggregationType;
    };
    ratioFormula?: string;
    page?: number;
    size?: number;
  }): Promise<Blob> {
    const url = `${environment.api_end_point}/api/v1/reports/export/v2`;
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
          responseType: 'blob',
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
