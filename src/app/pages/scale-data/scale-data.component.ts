import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ScaleData, Scale } from '../../models';
import { HttpService } from '../../services/http.service';
import { PageActionService } from '../../services/page-action.service';
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
    private http: HttpService,
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

  loadScales(): void {
    this.http.get<Scale[]>('api/scales', {}).subscribe({
      next: (data: any) => {
        const allScales = Array.isArray(data) ? data : (data?.data || []);
        this.scales = allScales;
        // Update filter options
        const scaleField = this.filterFields.find(f => f.key === 'scaleId');
        if (scaleField) {
          scaleField.options = allScales.map((scale: Scale) => ({
            label: scale.name,
            value: scale.id,
          }));
        }
      },
    });
  }

  loadCurrentData(): void {
    this.currentDataLoading = true;
    this.http.get<ScaleData[]>('api/scale-data/current', {}).subscribe({
      next: (data: any) => {
        this.currentData = Array.isArray(data) ? data : (data?.data || []);
        this.currentDataLoading = false;
      },
      error: () => {
        this.currentDataLoading = false;
      },
    });
  }

  loadHistoricalData(): void {
    this.historicalDataLoading = true;
    const params: any = {
      page: this.pageIndex,
      size: this.pageSize,
      ...this.filterData,
    };
    
    // Handle date range
    if (this.filterData.dateRange && Array.isArray(this.filterData.dateRange) && this.filterData.dateRange.length === 2) {
      params.dateFrom = this.filterData.dateRange[0];
      params.dateTo = this.filterData.dateRange[1];
      delete params.dateRange;
    }
    
    this.http.get<ScaleData[]>('api/scale-data', params).subscribe({
      next: (data: any) => {
        this.historicalData = Array.isArray(data) ? data : (data?.data || []);
        this.total = data?.total || this.historicalData.length;
        this.historicalDataLoading = false;
      },
      error: () => {
        this.historicalDataLoading = false;
      },
    });
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
}
