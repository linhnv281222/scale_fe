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
  Location,
  ReportTemplateImport,
  Scale,
  ScaleHistoryItem,
} from '../../models';
import { LocationService } from '../../services/location.service';
import { ReportService } from '../../services/report.service';
import { ScaleDataService } from '../../services/scale-data.service';
import { ScaleService } from '../../services/scale.service';
import { TemplateService } from '../../services/template.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

// Extended interfaces with formatted data
interface FormattedIntervalReportRow extends IntervalReportRow {
  formattedData: { [key: string]: number | string };
}

interface FormattedScaleHistoryItem extends ScaleHistoryItem {
  formattedData: { [key: string]: number | string };
}

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
  reportRows: FormattedIntervalReportRow[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;

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
  isChartExpanded = false; // Default collapsed

  // History section (displayed below main table)
  selectedRow: FormattedIntervalReportRow | null = null;
  selectedRowIndex: number | null = null;
  historyData: FormattedScaleHistoryItem[] = [];
  historyLoading = false;
  historyPageIndex = 1;
  historyPageSize = 10;
  historyTotal = 0;
  isHistoryExpanded = false;

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

  // Template selection modal
  isTemplateModalVisible = false;
  templates: ReportTemplateImport[] = [];
  templatesLoading = false;
  exportingWithTemplate = false;

  constructor(
    private scaleService: ScaleService,
    private reportService: ReportService,
    private scaleDataService: ScaleDataService,
    private locationService: LocationService,
    private templateService: TemplateService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Set default date range: 7 days ago to today
    const today = moment();
    const sevenDaysAgo = moment().subtract(7, 'days');
    this.filterData.dateRange = [sevenDaysAgo.toDate(), today.toDate()];

    this.loadLocations();
    this.loadScales().then(() => {
      // Auto load report data after scales and configs are loaded
      this.loadReportData();
    });
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
    const locationField = this.filterFields.find(
      (f) => f.key === 'locationIds'
    );
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
      this.scales = Array.isArray(data) ? data : data?.data ?? [];
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
          const scale = await this.scaleService.getScaleById(this.scales[0].id);
          const config = scale?.scale_config;
          if (config) {
            this.initializeAggregationFields(config);
          }
        } catch (error) {
          // Ignore error
        }
      }
    } else {
      // Load config for first selected scale
      const firstScaleId = selectedScaleIds[0];
      try {
        const scale = await this.scaleService.getScaleById(firstScaleId);
        const config = scale?.scale_config;
        if (config) {
          this.initializeAggregationFields(config);
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

      const apiData: any = await this.reportService.getIntervalReport({
        scaleIds: this.filterData.scaleIds ?? [],
        fromDate,
        toDate,
        fromTime,
        toTime,
        interval: this.filterData.interval ?? 'HOUR',
        aggregationByField: this.filterData.aggregationByField ?? {},
        page: this.pageIndex - 1,
        size: this.pageSize,
      });

      if (apiData) {
        // Support both old and new response shapes
        const rawRows: IntervalReportRow[] = Array.isArray(apiData)
          ? apiData
          : Array.isArray(apiData?.rows)
          ? apiData.rows!
          : Array.isArray(apiData?.data)
          ? apiData.data
          : [];

        // Derive dataFieldNames from response or data_values
        let dataFieldNames = apiData?.dataFieldNames || {};
        if (
          (!dataFieldNames || Object.keys(dataFieldNames).length === 0) &&
          rawRows.length > 0
        ) {
          const firstRow = rawRows[0];
          const firstDataValues: any = firstRow.data_values || {};
          const keys = Object.keys(firstDataValues);
          dataFieldNames = keys.reduce((acc: any, key: string) => {
            const dv = firstDataValues[key];
            if (dv?.name) acc[key] = dv.name;
            return acc;
          }, {});
        }

        // Update data columns from API response first (for display names)
        if (dataFieldNames && Object.keys(dataFieldNames).length > 0) {
          const apiColumns = Object.keys(dataFieldNames).map((key) => ({
            key,
            name: dataFieldNames![key],
          }));
          // Merge with existing columns, update names if key matches
          if (this.dataColumns.length > 0) {
            this.dataColumns = this.dataColumns.map((col) => {
              const apiCol = apiColumns.find((ac) => ac.key === col.key);
              return apiCol ? { ...col, name: apiCol.name } : col;
            });
          } else {
            // If no columns from config, use API columns
            this.dataColumns = apiColumns;
          }
        } else if (this.dataColumns.length === 0 && rawRows.length > 0) {
          // Fallback: build columns from keys in data_values
          const firstRow = rawRows[0];
          const firstDataValues: any = firstRow.data_values || {};
          this.dataColumns = Object.keys(firstDataValues).map((key) => ({
            key,
            name: key,
          }));
        }

        // Format data for each row (after dataColumns is updated)
        this.reportRows = rawRows.map((row): FormattedIntervalReportRow => {
          const formattedRow: FormattedIntervalReportRow = {
            ...row,
            formattedData: {},
          };
          // Format each data column
          this.dataColumns.forEach((col) => {
            const rowDataValues: any = row.data_values || {};
            const dataValue = rowDataValues[col.key];
            if (
              dataValue &&
              dataValue.used &&
              dataValue.value !== null &&
              dataValue.value !== undefined
            ) {
              const numValue = parseFloat(dataValue.value);
              formattedRow.formattedData[col.key] = !isNaN(numValue)
                ? numValue
                : '';
            } else {
              formattedRow.formattedData[col.key] = '';
            }
          });
          return formattedRow;
        });

        // Store simplified reportData + pagination for downstream use (chart label)
        this.reportData = {
          interval: this.filterData.interval ?? 'HOUR',
          fromDate,
          toDate,
          dataFieldNames,
          aggregationByField: this.filterData.aggregationByField ?? {},
          rows: rawRows,
        };

        // Update pagination
        this.total =
          apiData.total_elements ??
          apiData.totalElements ??
          apiData.total ??
          rawRows.length ??
          0;
        this.pageIndex =
          (apiData.page ?? apiData.pageNumber ?? this.pageIndex - 1) + 1;
        this.pageSize =
          apiData.size ?? apiData.pageSize ?? this.pageSize ?? rawRows.length;

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
    const weightData: any[] = this.reportRows
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
      .filter((item) => item !== null);

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
      // Check for NaN, null, or undefined
      if (value === null || value === undefined || isNaN(value)) {
        return '-';
      }
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
      } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'k';
      }
      return value.toFixed(1);
    };

    // Format number with thousand separators
    const formatNumber = (value: number): string => {
      // Check for NaN, null, or undefined
      if (value === null || value === undefined || isNaN(value)) {
        return '-';
      }
      return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    };

    this.chartOptions = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: {
          color: textColor,
        },
        formatter: (params: any) => {
          // Handle markPoint tooltip
          if (params.componentType === 'markPoint') {
            const value = params.value;
            // Check for NaN, null, or undefined
            if (value === null || value === undefined || isNaN(value)) {
              return `
                <div>
                  <div><strong>${
                    periods[params.dataIndex] || params.name || ''
                  }</strong></div>
                  <div>${data1Name}: -</div>
                </div>
              `;
            }
            const period = periods[params.dataIndex] || params.name || '';
            return `
              <div>
                <div><strong>${period}</strong></div>
                <div>${data1Name}: ${formatNumber(value)}</div>
              </div>
            `;
          }
          // Handle line series tooltip
          const period = params.axisValue || periods[params.dataIndex] || '';
          const tooltipValue = params.value;
          // Check for NaN, null, or undefined
          if (
            tooltipValue === null ||
            tooltipValue === undefined ||
            isNaN(tooltipValue)
          ) {
            return `
              <div>
                <div><strong>${period}</strong></div>
                <div>${params.seriesName}: -</div>
              </div>
            `;
          }
          return `
            <div>
              <div><strong>${period}</strong></div>
              <div>${params.seriesName}: ${formatNumber(tooltipValue)}</div>
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
          lineStyle: {
            color: '#3b82f6',
            width: 2,
          },
          itemStyle: {
            color: '#3b82f6',
          },
          symbol: 'none',
          showSymbol: false,
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
          markPoint: {
            data: values
              .map((value, index) => {
                // Skip NaN, null, or undefined values
                if (value === null || value === undefined || isNaN(value)) {
                  return null;
                }
                return {
                  coord: [index, value],
                  itemStyle: {
                    color: 'red',
                    borderColor: '#ffffff',
                    borderWidth: 2,
                  },
                  symbolSize: 60,
                  label: {
                    show: true,
                    position: 'inside',
                    formatter: formatLargeNumber(value),
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 'bold',
                  },
                };
              })
              .filter((item) => item !== null),
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
    this.pageIndex = 1;
    this.pageSize = 20;
    this.total = 0;
    this.updateScaleOptions();
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadReportData();
  }

  onRowClick(row: FormattedIntervalReportRow, index: number): void {
    // If clicking the same row, toggle history visibility
    if (this.selectedRowIndex === index) {
      this.isHistoryExpanded = !this.isHistoryExpanded;
      if (!this.isHistoryExpanded) {
        // Collapse: clear selection
        this.selectedRow = null;
        this.selectedRowIndex = null;
        this.historyData = [];
      } else {
        // Keep selectedRowIndex when expanding
        this.selectedRowIndex = index;
      }
    } else {
      // Select new row
      this.selectedRow = row;
      this.selectedRowIndex = index;
      this.isHistoryExpanded = true;
      this.historyPageIndex = 1;
      this.loadHistoryData();
    }
  }

  async loadHistoryData(): Promise<void> {
    if (!this.selectedRow || !this.selectedRow.scale?.id) {
      return;
    }

    this.historyLoading = true;
    try {
      // Use default date range if not set
      let dateRange = this.filterData.dateRange;
      if (!dateRange || dateRange.length !== 2) {
        const today = moment();
        const sevenDaysAgo = moment().subtract(7, 'days');
        dateRange = [sevenDaysAgo.toDate(), today.toDate()];
      }

      const startTime = moment(dateRange[0]).toISOString();
      const endTime = moment(dateRange[1]).endOf('day').toISOString();

      const data: any = await this.scaleDataService.getScaleHistory({
        scaleId: this.selectedRow.scale.id,
        startTime,
        endTime,
        page: this.historyPageIndex - 1, // API uses 0-based index
        size: this.historyPageSize,
      });

      if (data) {
        const rawHistoryData = data.data ?? [];
        // Format history data
        this.historyData = rawHistoryData.map(
          (item: ScaleHistoryItem): FormattedScaleHistoryItem => {
            const formattedItem: FormattedScaleHistoryItem = {
              ...item,
              formattedData: {},
            };
            // Format each data column
            this.dataColumns.forEach((col) => {
              const historyDataValues: any = item.dataValues || {};
              const dataValue = historyDataValues[col.key];
              if (
                dataValue &&
                dataValue.used &&
                dataValue.value !== null &&
                dataValue.value !== undefined
              ) {
                const numValue = parseFloat(dataValue.value);
                formattedItem.formattedData[col.key] = !isNaN(numValue)
                  ? numValue
                  : '';
              } else {
                formattedItem.formattedData[col.key] = '';
              }
            });
            return formattedItem;
          }
        );
        this.historyTotal = data.total_elements ?? rawHistoryData.length ?? 0;
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

  closeHistorySection(): void {
    this.isHistoryExpanded = false;
    this.selectedRow = null;
    this.selectedRowIndex = null;
    this.historyData = [];
  }

  updateAggregation(fieldKey: string, aggregation: AggregationType): void {
    this.filterData.aggregationByField[fieldKey] = aggregation;
  }

  async exportReport(): Promise<void> {
    // Open template selection modal
    await this.loadTemplates();
    this.isTemplateModalVisible = true;
  }

  async loadTemplates(): Promise<void> {
    this.templatesLoading = true;
    try {
      // Load templates for "Báo cáo cân"
      this.templates = await this.templateService.getTemplateImports(
        'Báo cáo cân'
      );
    } catch (error) {
      this.templates = [];
      this.toastr.error('Không thể tải danh sách biểu mẫu', 'Lỗi');
    } finally {
      this.templatesLoading = false;
    }
  }

  async exportWithTemplate(template: ReportTemplateImport): Promise<void> {
    if (!template.id) {
      this.toastr.error('Template không hợp lệ', 'Lỗi');
      return;
    }

    // Use default date range if not set
    let dateRange = this.filterData.dateRange;
    if (!dateRange || dateRange.length !== 2) {
      const today = moment();
      const sevenDaysAgo = moment().subtract(7, 'days');
      dateRange = [sevenDaysAgo.toDate(), today.toDate()];
    }

    this.exportingWithTemplate = true;
    try {
      // Filter scales by locationIds if selected
      let scaleIds = this.filterData.scaleIds ?? [];
      if (
        this.filterData.locationIds &&
        this.filterData.locationIds.length > 0
      ) {
        const filteredScales = this.scales.filter((scale) => {
          const locationId = scale.location_id ?? scale.locationId;
          return locationId && this.filterData.locationIds.includes(locationId);
        });
        scaleIds = filteredScales
          .map((s) => s.id)
          .filter((id) => id !== undefined) as number[];
        if (this.filterData.scaleIds && this.filterData.scaleIds.length > 0) {
          scaleIds = scaleIds.filter((id: number) =>
            this.filterData.scaleIds.includes(id)
          );
        }
      }

      const startTime = moment(dateRange[0]).toISOString();
      const endTime = moment(dateRange[1]).endOf('day').toISOString();

      // Get dataFields from dataColumns
      const dataFields = this.dataColumns.map((col) => col.key);

      const payload = {
        type: 'WORD',
        scaleIds,
        startTime,
        endTime,
        dataFields:
          dataFields.length > 0
            ? dataFields
            : ['data_1', 'data_2', 'data_3', 'data_4', 'data_5'],
        aggregationMethod: 'SUM',
        aggregationByField: this.filterData.aggregationByField ?? {},
        intervalReport: true,
        timeInterval: this.filterData.interval ?? 'HOUR',
        locationIds: this.filterData.locationIds ?? [],
        activeOnly: true,
        reportTitle: 'Báo cáo kết quả cân',
        reportCode: 'BCSL',
        preparedBy: 'System',
      };

      // Use new API with importId
      const blob = await this.reportService.exportReportWithTemplate(
        template.id,
        payload
      );

      // Generate filename
      const fromDate = moment(dateRange[0]).format('YYYY-MM-DD');
      const toDate = moment(dateRange[1]).format('YYYY-MM-DD');
      const fileName = `${
        template.templateCode || 'Bao_cao'
      }_${fromDate}_${toDate}.docx`;

      // Download file
      saveAs(blob, fileName);
      this.toastr.success('Xuất báo cáo thành công', 'Thành công');
      this.isTemplateModalVisible = false;
    } catch (error: any) {
      let errorMessage = 'Đã có lỗi xảy ra, vui lòng thử lại';
      if (error.error) {
        if (typeof error.error === 'object') {
          errorMessage =
            error.error.result?.message ?? error.error.message ?? errorMessage;
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
      this.exportingWithTemplate = false;
    }
  }

  closeTemplateModal(): void {
    this.isTemplateModalVisible = false;
  }
}
