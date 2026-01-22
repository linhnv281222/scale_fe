import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConnectionStatus } from '../../models';
import { ConnectionStatusService } from '../../services/connection-status.service';
import { PageActionService } from '../../services/page-action.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-connection-status',
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.css'],
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  connectionStatuses: ConnectionStatus[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  filterData: any = {};
  sidebarVisible = true;
  sidebarSize = 260; // Pixel

  // Threshold for warning (minutes without data)
  WARNING_THRESHOLD_MINUTES = 5; // 5 minutes
  ERROR_THRESHOLD_MINUTES = 15; // 15 minutes

  filterFields: FilterField[] = [
    {
      key: 'scaleName',
      label: 'connectionStatus.scale',
      type: 'text',
      placeholder: 'connectionStatus.scale',
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
    private connectionStatusService: ConnectionStatusService,
    private pageActionService: PageActionService
  ) { }

  ngOnInit(): void {
    this.loadConnectionStatuses();
    // Auto refresh every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadConnectionStatuses();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadConnectionStatuses(): Promise<void> {
    this.loading = true;
    try {
      const data = await this.connectionStatusService.getConnectionStatuses({
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      });
      this.connectionStatuses = data.data || [];
      this.total = data.total || this.connectionStatuses.length;
    } catch (error) {
      this.connectionStatuses = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadConnectionStatuses();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadConnectionStatuses();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadConnectionStatuses();
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
    return Math.floor(diff / (1000 * 60)); // Convert to minutes
  }

  getTimeWithoutDataText(lastDataTime?: Date): string {
    if (!lastDataTime) return '-';
    const minutes = this.getMinutesWithoutData(lastDataTime);
    if (minutes === null) return '-';

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;

    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  getRowClass(status: ConnectionStatus): string {
    const minutes = this.getMinutesWithoutData(status.lastDataTime);

    if (!status.lastDataTime || minutes === null) {
      return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500';
    }

    if (minutes >= this.ERROR_THRESHOLD_MINUTES) {
      return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500';
    }

    if (minutes >= this.WARNING_THRESHOLD_MINUTES) {
      return 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500';
    }

    return '';
  }

  isLongTimeWithoutData(status: ConnectionStatus): boolean {
    const minutes = this.getMinutesWithoutData(status.lastDataTime);
    return minutes !== null && minutes >= this.WARNING_THRESHOLD_MINUTES;
  }

  getLastDataTimeClass(status: ConnectionStatus): string {
    const minutes = this.getMinutesWithoutData(status.lastDataTime);

    if (!status.lastDataTime || minutes === null) {
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

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadConnectionStatuses();
  }

  onReset(): void {
    this.filterData = {};
    this.loadConnectionStatuses();
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  onSplitDragEnd(event: any): void {
    if (event.sizes && event.sizes.length > 0) {
      const firstSize = event.sizes[0];
      this.sidebarSize = typeof firstSize === 'number' ? firstSize : parseFloat(firstSize);
    }
  }
}
