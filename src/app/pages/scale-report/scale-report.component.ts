import { Component, OnDestroy, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { saveAs } from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import {
  AggregationType,
  IntervalReportResponse,
  IntervalReportRow,
  IntervalType,
  Location,
  Scale,
  ScaleHistoryItem
} from '../../models';
import { LocationService } from '../../services/location.service';
import { ReportService } from '../../services/report.service';
import { ScaleDataService } from '../../services/scale-data.service';
import { ScaleService } from '../../services/scale.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-scale-report',
  templateUrl: './scale-report.component.html',
  styleUrls: ['./scale-report.component.css'],
})
export class ScaleReportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  scales: Scale[] = [];
  locations: Location[] = [];
  reportData: IntervalReportResponse | null = null;
  reportRows: IntervalReportRow[] = [];
  loading = false;

  // Data columns (dynamic based on API response)
  dataColumns: { key: string; name: string }[] = [];

  // Filter data
  filterData: any = {
    dateRange: null,
    scaleIds: [],
    locationIds: [],
    interval: 'HOUR' as IntervalType,
    aggregationByField: {} as { [key: string]: AggregationType },
  };

  // Chart data
  chartData: any[] = [];
  chartOptions: any = {};

  // History modal
  isHistoryModalVisible = false;
  selectedRow: IntervalReportRow | null = null;
  historyData: ScaleHistoryItem[] = [];
  historyLoading = false;
  historyPageIndex = 1;
  historyPageSize = 10;
  historyTotal = 0;

  // Aggregation options
  aggregationOptions = [
    { label: 'ABS', value: 'ABS' },
    { label: 'SUM', value: 'SUM' },
    { label: 'MAX', value: 'MAX' },
    { label: 'AVG', value: 'AVG' },
  ];

  filterFields: FilterField[] = [
    {
      key: 'dateRange',
      label: 'reports.dateRange',
      type: 'dateRange',
      placeholder: 'reports.dateRange',
      format: 'dd/MM/yyyy',
      showTime: false,
    },
    {
      key: 'locationIds',
      label: 'locations.name',
      type: 'multiselect',
      placeholder: 'locations.selectLocations',
      options: [],
    },
    {
      key: 'scaleIds',
      label: 'reports.selectScales',
      type: 'multiselect',
      placeholder: 'reports.selectScales',
      options: [],
    },
    {
      key: 'interval',
      label: 'reports.interval',
      type: 'select',
      placeholder: 'reports.selectInterval',
      options: [
        { label: 'reports.hour', value: 'HOUR' },
        { label: 'reports.day', value: 'DAY' },
        { label: 'reports.week', value: 'WEEK' },
        { label: 'reports.month', value: 'MONTH' },
        { label: 'reports.year', value: 'YEAR' },
      ],
    },
  ];

  // Export
  exporting = false;

  constructor(
    private scaleService: ScaleService,
    private reportService: ReportService,
    private scaleDataService: ScaleDataService,
    private locationService: LocationService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadLocations();
    this.loadScales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadLocations(): Promise<void> {
    try {
      const response = await this.locationService.getLocations();
      this.locations = response.data ?? [];
      this.updateLocationOptions();
    } catch (error) {
      this.locations = [];
    }
  }

  updateLocationOptions(): void {
    const locationField = this.filterFields.find((f) => f.key === 'locationIds');
    if (locationField) {
      locationField.options = this.locations.map((location) => ({
        label: location.name ?? '',
        value: location.id,
      }));
    }
  }

  async loadScales(): Promise<void> {
    try {
      const data = await this.scaleService.getScales({});
      this.scales = Array.isArray(data) ? data : (data?.data ?? []);
      this.updateScaleOptions();
      // Load scale configs to get data fields
      await this.loadScaleConfigs();
    } catch (error) {
      this.scales = [];
    }
  }

  async loadScaleConfigs(): Promise<void> {
    // Load configs for selected scales to get data field names
    const selectedScaleIds = this.filterData.scaleIds ?? [];
    if (selectedScaleIds.length === 0) {
      // If no scales selected, use first scale as default to get data fields
      if (this.scales.length > 0 && this.scales[0].id) {
        try {
          const config = await this.scaleService.getScaleConfig(this.scales[0].id);
          if (config && config.data) {
            this.initializeAggregationFields(config.data);
          }
        } catch (error) {
          // Ignore error
        }
      }
    } else {
      // Load config for first selected scale
      const firstScaleId = selectedScaleIds[0];
      try {
        const config = await this.scaleService.getScaleConfig(firstScaleId);
        if (config && config.data) {
          this.initializeAggregationFields(config.data);
        }
      } catch (error) {
        // Ignore error
      }
    }
  }

  initializeAggregationFields(config: any): void {
    // Initialize aggregationByField for data_1 to data_5
    const aggregation: { [key: string]: AggregationType } = {};
    const columns: { key: string; name: string }[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const channel = config[`data_${i}`];
      if (channel && channel.is_used) {
        const dataKey = `data_${i}`;
        const dataName = channel.name ?? `Data ${i}`;
        // Default to ABS for all fields
        aggregation[dataKey] = 'ABS';
        columns.push({ key: dataKey, name: dataName });
      }
    }
    
    this.filterData.aggregationByField = aggregation;
    this.dataColumns = columns;
  }

  updateScaleOptions(): void {
    const scaleField = this.filterFields.find((f) => f.key === 'scaleIds');
    if (scaleField) {
      scaleField.options = this.scales.map((scale) => ({
        label: scale.name || `Scale ${scale.id}`,
        value: scale.id,
      }));
    }
  }

  async loadReportData(): Promise<void> {
    if (!this.filterData.dateRange || this.filterData.dateRange.length !== 2) {
      return;
    }

    this.loading = true;
    try {
      const fromDate = moment(this.filterData.dateRange[0]).format('YYYY-MM-DD');
      const toDate = moment(this.filterData.dateRange[1]).format('YYYY-MM-DD');
      const fromTime = moment(this.filterData.dateRange[0]).toISOString();
      const toTime = moment(this.filterData.dateRange[1]).endOf('day').toISOString();

      const data = await this.reportService.getIntervalReport({
        scaleIds: this.filterData.scaleIds ?? [],
        fromDate,
        toDate,
        fromTime,
        toTime,
        interval: this.filterData.interval ?? 'HOUR',
        aggregationByField: this.filterData.aggregationByField ?? {},
      });

      if (data) {
        this.reportData = data;
        this.reportRows = data.rows ?? [];
        // Update data columns from API response if available (for display names)
        if (data.dataFieldNames) {
          const apiColumns = Object.keys(data.dataFieldNames).map((key) => ({
            key,
            name: data.dataFieldNames![key],
          }));
          // Merge with existing columns, update names if key matches
          if (this.dataColumns.length > 0) {
            this.dataColumns = this.dataColumns.map(col => {
              const apiCol = apiColumns.find(ac => ac.key === col.key);
              return apiCol ? { ...col, name: apiCol.name } : col;
            });
          } else {
            // If no columns from config, use API columns
            this.dataColumns = apiColumns;
          }
        }
        this.prepareChartData();
      } else {
        this.reportData = null;
        this.reportRows = [];
        // Keep dataColumns for filter display
      }
    } catch (error) {
      this.reportData = null;
      this.reportRows = [];
      this.dataColumns = [];
    } finally {
      this.loading = false;
    }
  }

  prepareChartData(): void {
    if (!this.reportData || !this.reportRows.length) {
      this.chartData = [];
      this.chartOptions = {};
      return;
    }

    // Get data_1 (Weight) for chart
    const weightData = this.reportRows
      .map((row, index) => {
        const data1 = row.data_values?.data_1;
        if (data1 && data1.used && data1.value) {
          return {
            period: row.period,
            value: parseFloat(data1.value) ?? 0,
            index,
          };
        }
        return null;
      })
      .filter((item) => item !== null) as any[];

    this.chartData = weightData;

    // Prepare ECharts options
    this.updateChartOptions();
  }

  updateChartOptions(): void {
    if (!this.chartData.length) {
      this.chartOptions = {};
      return;
    }

    const periods = this.chartData.map((d) => d.period);
    const values = this.chartData.map((d) => d.value);

    // Detect dark theme
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const lineColor = isDark ? '#4b5563' : '#e5e7eb';
    const splitLineColor = isDark ? '#374151' : '#f3f4f6';

    const data1Name = this.reportData?.dataFieldNames?.['data_1'] ?? '';

    this.chartOptions = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: {
          color: textColor,
        },
        formatter: (params: any) => {
          const param = params[0];
          const data = this.chartData[param.dataIndex];
          return `
            <div>
              <div><strong>${param.axisValue}</strong></div>
              <div>${param.seriesName}: ${param.value.toFixed(1)}</div>
            </div>
          `;
        },
      },
      grid: {
        left: '5%',
        right: '2%',
        top: '13%',
        bottom: '15%',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: periods,
        axisLabel: {
          color: textColor,
        },
        axisLine: {
          lineStyle: {
            color: lineColor,
          },
        },
      },
      yAxis: {
        type: 'value',
        name: data1Name,
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: textColor,
        },
        axisLabel: {
          color: textColor,
          formatter: (value: number) => value.toFixed(1),
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: splitLineColor,
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: data1Name,
          type: 'line',
          smooth: true,
          data: values,
          itemStyle: {
            color: '#3b82f6',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(59, 130, 246, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(59, 130, 246, 0.05)',
                },
              ],
            },
          },
        },
      ],
    };
  }

  async onSearch(filters?: any): Promise<void> {
    if (filters) {
      if (filters.dateRangeFrom && filters.dateRangeTo) {
        this.filterData.dateRange = [
          filters.dateRangeFrom,
          filters.dateRangeTo,
        ];
      } else {
        this.filterData.dateRange = null;
      }
      if (filters.locationIds !== undefined) {
        this.filterData.locationIds = filters.locationIds;
        // Update scale options based on selected locations
        this.updateScaleOptions();
      }
      if (filters.scaleIds !== undefined) {
        this.filterData.scaleIds = filters.scaleIds;
        // Reload scale configs when scales change to update data columns
        await this.loadScaleConfigs();
      }
      if (filters.interval !== undefined) {
        this.filterData.interval = filters.interval;
      }
    }
    this.loadReportData();
  }

  onReset(): void {
    this.filterData = {
      dateRange: null,
      scaleIds: [],
      locationIds: [],
      interval: 'HOUR' as IntervalType,
      aggregationByField: {} as { [key: string]: AggregationType },
    };
    this.reportData = null;
    this.reportRows = [];
    this.dataColumns = [];
    this.chartData = [];
    this.chartOptions = {};
    this.updateScaleOptions();
  }

  onRowClick(row: IntervalReportRow): void {
    this.selectedRow = row;
    this.isHistoryModalVisible = true;
    this.historyPageIndex = 1;
    this.loadHistoryData();
  }

  async loadHistoryData(): Promise<void> {
    if (!this.selectedRow || !this.selectedRow.scale.id) {
      return;
    }

    if (!this.filterData.dateRange || this.filterData.dateRange.length !== 2) {
      return;
    }

    this.historyLoading = true;
    try {
      const startTime = moment(this.filterData.dateRange[0]).toISOString();
      const endTime = moment(this.filterData.dateRange[1]).endOf('day').toISOString();

      const data = await this.scaleDataService.getScaleHistory({
        scaleId: this.selectedRow.scale.id,
        startTime,
        endTime,
        page: this.historyPageIndex - 1, // API uses 0-based index
        size: this.historyPageSize,
      });

      if (data) {
        this.historyData = data.content ?? [];
        this.historyTotal = data.totalElements ?? 0;
      } else {
        this.historyData = [];
        this.historyTotal = 0;
      }
    } catch (error) {
      this.historyData = [];
      this.historyTotal = 0;
    } finally {
      this.historyLoading = false;
    }
  }

  onHistoryPaginationChange(event: { page: number; size: number }): void {
    this.historyPageIndex = event.page;
    this.historyPageSize = event.size;
    this.loadHistoryData();
  }

  closeHistoryModal(): void {
    this.isHistoryModalVisible = false;
    this.selectedRow = null;
    this.historyData = [];
  }

  getDataValue(row: IntervalReportRow, dataKey: string): string {
    const dataValue = row.data_values?.[dataKey as keyof typeof row.data_values] as any;
    if (dataValue && dataValue.used && dataValue.value !== null && dataValue.value !== undefined) {
      return dataValue.value;
    }
    return '';
  }

  getHistoryDataValue(item: ScaleHistoryItem, dataKey: string): string {
    const dataValue = item.dataValues?.[dataKey as keyof typeof item.dataValues] as any;
    if (dataValue && dataValue.used && dataValue.value !== null && dataValue.value !== undefined) {
      return dataValue.value;
    }
    return '';
  }

  updateAggregation(fieldKey: string, aggregation: AggregationType): void {
    this.filterData.aggregationByField[fieldKey] = aggregation;
  }

  async exportReport(): Promise<void> {
    if (!this.filterData.dateRange || this.filterData.dateRange.length !== 2) {
      this.toastr.warning('Vui lòng chọn khoảng thời gian', 'Cảnh báo');
      return;
    }

    if (!this.filterData.scaleIds || this.filterData.scaleIds.length === 0) {
      this.toastr.warning('Vui lòng chọn ít nhất một cân', 'Cảnh báo');
      return;
    }

    this.exporting = true;
    try {
      // Filter scales by locationIds if selected
      let scaleIds = this.filterData.scaleIds ?? [];
      if (this.filterData.locationIds && this.filterData.locationIds.length > 0) {
        const filteredScales = this.scales.filter(scale => {
          const locationId = scale.location_id ?? scale.locationId;
          return locationId && this.filterData.locationIds.includes(locationId);
        });
        scaleIds = filteredScales.map(s => s.id).filter(id => id !== undefined) as number[];
        if (this.filterData.scaleIds && this.filterData.scaleIds.length > 0) {
          scaleIds = scaleIds.filter((id: number) => this.filterData.scaleIds.includes(id));
        }
      }

      const startTime = moment(this.filterData.dateRange[0]).toISOString();
      const endTime = moment(this.filterData.dateRange[1]).endOf('day').toISOString();

      // Get dataFields from dataColumns
      const dataFields = this.dataColumns.map(col => col.key);

      const payload = {
        type: 'WORD',
        scaleIds,
        startTime,
        endTime,
        dataFields: dataFields.length > 0 ? dataFields : ['data_1', 'data_2', 'data_3', 'data_4', 'data_5'],
        aggregationMethod: 'SUM',
        aggregationByField: this.filterData.aggregationByField ?? {},
        intervalReport: true,
        timeInterval: this.filterData.interval ?? 'HOUR',
        locationIds: this.filterData.locationIds ?? [],
        activeOnly: true,
        reportTitle: 'Báo cáo kết quả cân',
        reportCode: 'BCSL',
        preparedBy: 'System'
      };

      const base64String = await this.reportService.exportReport(payload);

      if (!base64String) {
        this.toastr.error('Không nhận được dữ liệu từ server', 'Lỗi');
        return;
      }

      // Parse base64 string
      let base64Data = '';
      if (typeof base64String === 'string') {
        try {
          const jsonData = JSON.parse(base64String);
          base64Data = jsonData.base64 ?? jsonData.data ?? jsonData.file ?? jsonData.content ?? base64String;
        } catch {
          base64Data = base64String;
        }
      } else if (base64String && typeof base64String === 'object') {
        base64Data = (base64String as any).base64 ?? (base64String as any).data ?? (base64String as any).file ?? (base64String as any).content ?? '';
      }

      if (!base64Data) {
        this.toastr.error('Không tìm thấy dữ liệu base64 trong response', 'Lỗi');
        return;
      }

      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      // Generate filename
      const fromDate = moment(this.filterData.dateRange[0]).format('YYYY-MM-DD');
      const toDate = moment(this.filterData.dateRange[1]).format('YYYY-MM-DD');
      const fileName = `Bao_cao_ket_qua_can_${fromDate}_${toDate}.docx`;

      // Download file
      saveAs(blob, fileName);
      this.toastr.success('Xuất báo cáo thành công', 'Thành công');
    } catch (error: any) {
      let errorMessage = 'Đã có lỗi xảy ra, vui lòng thử lại';
      if (error.error) {
        if (typeof error.error === 'object') {
          errorMessage = error.error.result?.message ?? error.error.message ?? errorMessage;
        } else if (typeof error.error === 'string') {
          try {
            const json = JSON.parse(error.error);
            errorMessage = json.result?.message ?? json.message ?? errorMessage;
          } catch {
            errorMessage = error.error ?? errorMessage;
          }
        }
      }
      this.toastr.error(errorMessage, 'Lỗi');
    } finally {
      this.exporting = false;
    }
  }
}
