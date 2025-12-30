import { Component, OnDestroy, OnInit } from '@angular/core';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import {
  AggregationType,
  IntervalReportResponse,
  IntervalReportRow,
  IntervalType,
  Scale
} from '../../models';
import { ReportService } from '../../services/report.service';
import { ScaleService } from '../../services/scale.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

// Extended interface with formatted data
interface FormattedIntervalReportRow extends IntervalReportRow {
  formattedData: { [key: string]: number | string };
}

@Component({
  selector: 'app-shift-report',
  templateUrl: './shift-report.component.html',
  styleUrls: ['./shift-report.component.css']
})
export class ShiftReportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  scales: Scale[] = [];
  reportData: IntervalReportResponse | null = null;
  reportRows: FormattedIntervalReportRow[] = [];
  loading = false;

  // Data columns (dynamic based on API response)
  dataColumns: { key: string; name: string }[] = [];

  // Filter data
  filterData: any = {
    dateRange: null,
    scaleIds: [],
    interval: 'SHIFT' as IntervalType,
    aggregationByField: {} as { [key: string]: AggregationType },
  };

  // Chart data
  chartData: any[] = [];
  chartOptions: any = {};

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
      key: 'scaleIds',
      label: 'reports.selectScales',
      type: 'multiselect',
      placeholder: 'reports.selectScales',
      options: [],
    },
  ];

  // Export
  exporting = false;

  constructor(
    private scaleService: ScaleService,
    private reportService: ReportService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Set default date range: 7 days ago to today
    const today = moment();
    const sevenDaysAgo = moment().subtract(7, 'days');
    this.filterData.dateRange = [sevenDaysAgo.toDate(), today.toDate()];

    this.loadScales().then(() => {
      // Auto load report data after scales are loaded
      this.loadReportData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.loading = true;
    try {
      // Use default date range if not set
      let dateRange = this.filterData.dateRange;
      if (!dateRange || dateRange.length !== 2) {
        const today = moment();
        const sevenDaysAgo = moment().subtract(7, 'days');
        dateRange = [sevenDaysAgo.toDate(), today.toDate()];
      }

      const fromDate = moment(dateRange[0]).format('YYYY-MM-DD');
      const toDate = moment(dateRange[1]).format('YYYY-MM-DD');
      const fromTime = moment(dateRange[0]).toISOString();
      const toTime = moment(dateRange[1]).endOf('day').toISOString();

      const data = await this.reportService.getIntervalReport({
        scaleIds: this.filterData.scaleIds ?? [],
        fromDate,
        toDate,
        fromTime,
        toTime,
        interval: 'SHIFT' as IntervalType,
        aggregationByField: this.filterData.aggregationByField ?? {},
      });

      if (data) {
        this.reportData = data;
        const rawRows = data.rows ?? [];

        // Update data columns from API response first (for display names)
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

        // Format data for each row (after dataColumns is updated)
        this.reportRows = rawRows.map((row): FormattedIntervalReportRow => {
          const formattedRow: FormattedIntervalReportRow = { ...row, formattedData: {} };
          // Format each data column
          this.dataColumns.forEach(col => {
            const dataValue = row.data_values?.[col.key as keyof typeof row.data_values] as any;
            if (dataValue && dataValue.used && dataValue.value !== null && dataValue.value !== undefined) {
              const numValue = parseFloat(dataValue.value);
              formattedRow.formattedData[col.key] = !isNaN(numValue) ? numValue : '';
            } else {
              formattedRow.formattedData[col.key] = '';
            }
          });
          return formattedRow;
        });

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

    // Format large numbers (divide by 1000 and add 'k' suffix, or use compact notation)
    const formatLargeNumber = (value: number): string => {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
      } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'k';
      }
      return value.toFixed(1);
    };

    // Format number with thousand separators
    const formatNumber = (value: number): string => {
      return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    };

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
              <div>${param.seriesName}: ${formatNumber(param.value)}</div>
            </div>
          `;
        },
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '15%',
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
        nameGap: 60,
        nameTextStyle: {
          color: textColor,
          fontSize: 12,
        },
        axisLabel: {
          color: textColor,
          formatter: (value: number) => formatLargeNumber(value),
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
      if (filters.scaleIds !== undefined) {
        this.filterData.scaleIds = filters.scaleIds;
        // Reload scale configs when scales change to update data columns
        await this.loadScaleConfigs();
      }
    }
    this.loadReportData();
  }

  onReset(): void {
    this.filterData = {
      dateRange: null,
      scaleIds: [],
      interval: 'SHIFT' as IntervalType,
      aggregationByField: {} as { [key: string]: AggregationType },
    };
    this.reportData = null;
    this.reportRows = [];
    this.dataColumns = [];
    this.chartData = [];
    this.chartOptions = {};
  }


  updateAggregation(fieldKey: string, aggregation: AggregationType): void {
    this.filterData.aggregationByField[fieldKey] = aggregation;
  }

  async exportReport(): Promise<void> {
    // Use default date range if not set
    let dateRange = this.filterData.dateRange;
    if (!dateRange || dateRange.length !== 2) {
      const today = moment();
      const sevenDaysAgo = moment().subtract(7, 'days');
      dateRange = [sevenDaysAgo.toDate(), today.toDate()];
    }

    this.exporting = true;
    try {
      const scaleIds = this.filterData.scaleIds ?? [];
      const startTime = moment(dateRange[0]).toISOString();
      const endTime = moment(dateRange[1]).endOf('day').toISOString();

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
        timeInterval: 'SHIFT' as IntervalType,
        activeOnly: true,
        reportTitle: 'Báo cáo ca',
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
      const fromDate = moment(dateRange[0]).format('YYYY-MM-DD');
      const toDate = moment(dateRange[1]).format('YYYY-MM-DD');
      const fileName = `Bao_cao_ca_${fromDate}_${toDate}.docx`;

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
