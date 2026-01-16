import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Scale, ScaleData } from '../../models';
import { PageActionService } from '../../services/page-action.service';
import { ScaleDataService } from '../../services/scale-data.service';
import { ScaleService } from '../../services/scale.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-scale-data',
  templateUrl: './scale-data.component.html',
  styleUrls: ['./scale-data.component.css'],
})
export class ScaleDataComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Current data (latest data for each scale)
  currentData: ScaleData[] = [];
  currentDataLoading = false;

  // Historical data (with pagination and filters)
  historicalData: ScaleData[] = [];
  historicalDataLoading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  filterData: any = {};
  sidebarVisible = true;
  sidebarSize = 15; // Percentage

  // Scales list for filter
  scales: Scale[] = [];

  filterFields: FilterField[] = [
    {
      key: 'scaleId',
      label: 'scales.name',
      type: 'select',
      placeholder: 'scales.selectScale',
      options: [],
    },
    {
      key: 'dateRange',
      label: 'common.dateRange',
      type: 'dateRange',
      placeholder: 'common.selectDateRange',
    },
  ];

  constructor(
    private scaleService: ScaleService,
    private scaleDataService: ScaleDataService,
    private pageActionService: PageActionService
  ) {}

  ngOnInit(): void {
    this.loadScales();
    this.loadCurrentData();
    this.loadHistoricalData();

    // Auto-refresh current data every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCurrentData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadScales(): Promise<void> {
    try {
      const data = await this.scaleService.getScales({});
      const allScales = Array.isArray(data) ? data : data?.data || [];
      this.scales = allScales;
      const scaleField = this.filterFields.find((f) => f.key === 'scaleId');
      if (scaleField) {
        scaleField.options = allScales.map((scale: Scale) => ({
          label: scale.name,
          value: scale.id,
        }));
      }
    } catch (error) {
      this.scales = [];
    }
  }

  async loadCurrentData(): Promise<void> {
    this.currentDataLoading = true;
    try {
      const data = await this.scaleDataService.getCurrentScaleData({});
      this.currentData = Array.isArray(data) ? data : data?.data || [];
    } catch (error) {
      this.currentData = [];
    } finally {
      this.currentDataLoading = false;
    }
  }

  async loadHistoricalData(): Promise<void> {
    this.historicalDataLoading = true;
    const params: any = {
      page: this.pageIndex,
      size: this.pageSize,
      ...this.filterData,
    };

    if (
      this.filterData.dateRange &&
      Array.isArray(this.filterData.dateRange) &&
      this.filterData.dateRange.length === 2
    ) {
      params.dateFrom = this.filterData.dateRange[0];
      params.dateTo = this.filterData.dateRange[1];
      delete params.dateRange;
    }

    try {
      const data = await this.scaleDataService.getScaleData(params);
      this.historicalData = Array.isArray(data) ? data : data?.data || [];
      this.total = data?.total || this.historicalData.length;
    } catch (error) {
      this.historicalData = [];
      this.total = 0;
    } finally {
      this.historicalDataLoading = false;
    }
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadHistoricalData();
  }

  onReset(): void {
    this.filterData = {};
    this.pageIndex = 1;
    this.loadHistoricalData();
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadHistoricalData();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadHistoricalData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadHistoricalData();
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
