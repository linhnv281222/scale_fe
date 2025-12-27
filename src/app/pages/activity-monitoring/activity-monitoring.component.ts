import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Scale, ScaleData } from '../../models';
import {
  ActivityMonitoringItem,
  ActivityMonitoringService,
} from '../../services/activity-monitoring.service';
import { ScaleDataService } from '../../services/scale-data.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-activity-monitoring',
  templateUrl: './activity-monitoring.component.html',
  styleUrls: ['./activity-monitoring.component.css'],
})
export class ActivityMonitoringComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Combined data
  activityData: ActivityMonitoringItem[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  filterData: any = {};

  // Historical data (shown when row is clicked)
  selectedScaleId: number | null = null;
  selectedScale: Scale | null = null;
  historicalData: ScaleData[] = [];
  historicalDataLoading = false;
  historicalPageIndex = 1;
  historicalPageSize = 20;
  historicalTotal = 0;
  showHistoricalData = false;

  // Thresholds
  WARNING_THRESHOLD_MINUTES = 5;
  ERROR_THRESHOLD_MINUTES = 15;

  filterFields: FilterField[] = [
    {
      key: 'scaleName',
      label: 'scales.name',
      type: 'text',
      placeholder: 'scales.name',
    },
    {
      key: 'status',
      label: 'connectionStatus.status',
      type: 'select',
      placeholder: 'connectionStatus.status',
      options: [
        { label: 'connectionStatus.online', value: 'ONLINE' },
        { label: 'connectionStatus.offline', value: 'OFFLINE' },
        { label: 'connectionStatus.error', value: 'ERROR' },
      ],
    },
  ];

  constructor(
    private activityMonitoringService: ActivityMonitoringService,
    private scaleDataService: ScaleDataService
  ) {}

  ngOnInit(): void {
    this.loadActivityData();

    // Auto-refresh every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadActivityData();
        // Refresh historical data if showing
        if (this.showHistoricalData && this.selectedScaleId) {
          this.loadHistoricalData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadActivityData(): Promise<void> {
    this.loading = true;
    try {
      const data = await this.activityMonitoringService.getActivityData({
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      });
      const items = Array.isArray(data) ? data : data?.data || [];
      this.activityData = items.map((item: any) => ({
        ...item,
        lastDataTime: item.lastDataTime
          ? new Date(item.lastDataTime)
          : undefined,
        currentTimestamp: item.currentTimestamp
          ? new Date(item.currentTimestamp)
          : undefined,
        minutesWithoutData: this.getMinutesWithoutData(
          item.lastDataTime ? new Date(item.lastDataTime) : undefined
        ),
      }));
      this.total = data?.total || this.activityData.length;
    } catch (error) {
      this.activityData = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  }

  async loadHistoricalData(): Promise<void> {
    if (!this.selectedScaleId) return;

    this.historicalDataLoading = true;
    const params: any = {
      scaleId: this.selectedScaleId,
      page: this.historicalPageIndex,
      size: this.historicalPageSize,
    };

    try {
      const data = await this.scaleDataService.getScaleData(params);
      this.historicalData = Array.isArray(data) ? data : data?.data || [];
      this.historicalTotal = data?.total || this.historicalData.length;
    } catch (error) {
      this.historicalData = [];
      this.historicalTotal = 0;
    } finally {
      this.historicalDataLoading = false;
    }
  }

  onRowClick(item: ActivityMonitoringItem): void {
    this.selectedScaleId = item.scaleId;
    this.selectedScale = item.scale || null;
    this.showHistoricalData = true;
    this.historicalPageIndex = 1;
    this.loadHistoricalData();
  }

  closeHistoricalData(): void {
    this.showHistoricalData = false;
    this.selectedScaleId = null;
    this.selectedScale = null;
    this.historicalData = [];
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadActivityData();
  }

  onReset(): void {
    this.filterData = {};
    this.pageIndex = 1;
    this.loadActivityData();
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadActivityData();
  }

  onHistoricalPaginationChange(event: { page: number; size: number }): void {
    this.historicalPageIndex = event.page;
    this.historicalPageSize = event.size;
    this.loadHistoricalData();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'OFFLINE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'ERROR':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getMinutesWithoutData(lastDataTime?: Date): number | null {
    if (!lastDataTime) return null;
    const now = new Date();
    const diff = now.getTime() - new Date(lastDataTime).getTime();
    return Math.floor(diff / (1000 * 60));
  }

  getTimeWithoutDataText(item: ActivityMonitoringItem): string {
    if (!item.lastDataTime) return 'Không có dữ liệu';
    const minutes = item.minutesWithoutData;
    if (minutes === null || minutes === undefined) return 'Không có dữ liệu';

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;

    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  getRowClass(item: ActivityMonitoringItem): string {
    const minutes = item.minutesWithoutData;

    if (!item.lastDataTime || minutes === null || minutes === undefined) {
      return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20';
    }

    if (minutes >= this.ERROR_THRESHOLD_MINUTES) {
      return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20';
    }

    if (minutes >= this.WARNING_THRESHOLD_MINUTES) {
      return 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/20';
    }

    return 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800';
  }

  getLastDataTimeClass(item: ActivityMonitoringItem): string {
    const minutes = item.minutesWithoutData;

    if (!item.lastDataTime || minutes === null || minutes === undefined) {
      return 'text-red-600 dark:text-red-400 font-semibold';
    }

    if (minutes >= this.ERROR_THRESHOLD_MINUTES) {
      return 'text-red-600 dark:text-red-400 font-semibold';
    }

    if (minutes >= this.WARNING_THRESHOLD_MINUTES) {
      return 'text-orange-600 dark:text-orange-400 font-medium';
    }

    return 'text-gray-900 dark:text-white';
  }

  formatDate(date?: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
