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

  scales: Scale[] = [];
  locations: Location[] = [];
  reportData: IntervalReportResponse | null = null;
  reportRows: FormattedIntervalReportRow[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;

  dataColumns: { key: string; name: string }[] = [];

  selectedScaleIds: number[] = [];
  allScalesChecked = false;
  indeterminate = false;
  scaleCheckboxOptions: Array<{
    label: string;
    value: number;
    checked: boolean;
  }> = [];

  filterData: any = {
    dateRange: null,
    scaleIds: [],
    locationIds: [],
    manufacturerIds: [],
    direction: null,
    interval: 'HOUR' as IntervalType,
    aggregationByField: {} as { [key: string]: AggregationType },
    ratioFormula: 'data_1/data_3',
  };

  chartData: any[] = [];
  chartOptions: any = {};
  isChartExpanded = false;

  selectedRow: FormattedIntervalReportRow | null = null;
  selectedRowIndex: number | null = null;
  historyData: FormattedScaleHistoryItem[] = [];
  historyLoading = false;
  historyPageIndex = 1;
  historyPageSize = 10;
  historyTotal = 0;
  isHistoryExpanded = false;

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

  exporting = false;

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
    const today = moment();
    const sevenDaysAgo = moment().subtract(7, 'days');
    this.filterData.dateRange = [sevenDaysAgo.toDate(), today.toDate()];

    this.loadLocations();
    this.loadScales().then(() => {
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
      (field) => field.key === 'locationIds'
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
      const data = await this.scaleService.getScales();
      this.scales = Array.isArray(data) ? data : data?.data ?? [];
      if (this.scales.length > 0 && this.selectedScaleIds.length === 0) {
        this.selectedScaleIds = this.scales
          .filter((scale) => scale.id !== undefined)
          .map((scale) => scale.id!);
        this.allScalesChecked = true;
        this.indeterminate = false;
        this.filterData.scaleIds = [...this.selectedScaleIds];
      }
      this.updateScaleOptions();
      await this.loadScaleConfigs();
    } catch (error) {
      this.scales = [];
    }
  }

  async loadScaleConfigs(): Promise<void> {
    const selectedScaleIds = this.filterData.scaleIds ?? [];
    if (selectedScaleIds.length === 0) {
      if (this.scales.length > 0 && this.scales[0].id) {
        try {
          const scale = await this.scaleService.getScaleById(this.scales[0].id);
          const config = scale?.scale_config;
          if (config) {
            this.initializeAggregationFields(config);
          }
        } catch (error) {}
      }
    } else {
      const firstScaleId = selectedScaleIds[0];
      try {
        const scale = await this.scaleService.getScaleById(firstScaleId);
        const config = scale?.scale_config;
        if (config) {
          this.initializeAggregationFields(config);
        }
      } catch (error) {}
    }
  }

  initializeAggregationFields(config: any): void {
    const aggregation: { [key: string]: AggregationType } = {};
    const columns: { key: string; name: string }[] = [];

    for (let i = 1; i <= 5; i++) {
      const channel = config[`data_${i}`];
      if (channel && channel.is_used) {
        const dataKey = `data_${i}`;
        const dataName = channel.name ?? `Data ${i}`;
        aggregation[dataKey] = 'ABS';
        columns.push({ key: dataKey, name: dataName });
      }
    }

    this.filterData.aggregationByField = aggregation;
    this.dataColumns = columns;
  }

  updateScaleOptions(): void {
    this.scaleCheckboxOptions = this.scales
      .filter((scale) => scale.id !== undefined)
      .map((scale) => ({
        label: scale.name || `Scale ${scale.id}`,
        value: scale.id!,
        checked: this.selectedScaleIds.includes(scale.id!),
      }));
  }

  updateAllScalesChecked(): void {
    this.indeterminate = false;
    if (this.allScalesChecked) {
      this.scaleCheckboxOptions = this.scaleCheckboxOptions.map((option) => ({
        ...option,
        checked: true,
      }));
    } else {
      this.scaleCheckboxOptions = this.scaleCheckboxOptions.map((option) => ({
        ...option,
        checked: false,
      }));
    }
    this.syncSelectedScaleIdsFromOptions();
  }

  updateSingleScaleChecked(): void {
    if (this.scaleCheckboxOptions.every((option) => !option.checked)) {
      this.allScalesChecked = false;
      this.indeterminate = false;
    } else if (this.scaleCheckboxOptions.every((option) => option.checked)) {
      this.allScalesChecked = true;
      this.indeterminate = false;
    } else {
      this.indeterminate = true;
    }
    this.syncSelectedScaleIdsFromOptions();
  }

  syncSelectedScaleIdsFromOptions(): void {
    this.selectedScaleIds = this.scaleCheckboxOptions
      .filter((option) => option.checked)
      .map((option) => option.value);
    this.filterData.scaleIds = [...this.selectedScaleIds];
  }

  async loadReportData(): Promise<void> {
    this.loading = true;
    try {
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
        scaleIds: this.filterData.scaleIds?.length
          ? this.filterData.scaleIds
          : undefined,
        manufacturerIds: this.filterData.manufacturerIds?.length
          ? this.filterData.manufacturerIds
          : undefined,
        locationIds: this.filterData.locationIds?.length
          ? this.filterData.locationIds
          : undefined,
        direction: this.filterData.direction || undefined,
        fromTime,
        toTime,
        interval: this.filterData.interval ?? 'HOUR',
        aggregationByField: this.filterData.aggregationByField ?? {},
        ratioFormula: this.filterData.ratioFormula || 'data_1/data_3',
        page: this.pageIndex - 1,
        size: this.pageSize,
      });

      if (apiData) {
        let rawRows: IntervalReportRow[] = [];
        let overviewData: any = null;

        if (Array.isArray(apiData.data)) {
          if (apiData.data.length > 0 && apiData.data[0].rows) {
            rawRows = apiData.data[0].rows;
            overviewData = apiData.data[0].overview;
          } else if (apiData.data.length > 0 && apiData.data[0].data) {
            rawRows = apiData.data[0].data;
            overviewData = apiData.data[0].overview;
          }
        } else if (apiData.data?.data && Array.isArray(apiData.data.data)) {
          rawRows = apiData.data.data;
          overviewData = apiData.data.overview || apiData.overview;
        } else if (Array.isArray(apiData.rows)) {
          rawRows = apiData.rows;
          overviewData = apiData.overview;
        } else if (Array.isArray(apiData.data)) {
          rawRows = apiData.data;
          overviewData = apiData.overview;
        }

        let dataFieldNames = apiData?.dataFieldNames || {};
        if (
          (!dataFieldNames || Object.keys(dataFieldNames).length === 0) &&
          rawRows.length > 0
        ) {
          const firstRow = rawRows[0];
          const firstDataValues: any = firstRow.data_values || {};
          const keys = Object.keys(firstDataValues);
          dataFieldNames = keys.reduce((accumulator: any, key: string) => {
            const dataValue = firstDataValues[key];
            if (dataValue?.name) accumulator[key] = dataValue.name;
            return accumulator;
          }, {});
        }

        if (dataFieldNames && Object.keys(dataFieldNames).length > 0) {
          const apiColumns = Object.keys(dataFieldNames).map((key) => ({
            key,
            name: dataFieldNames![key],
          }));
          if (this.dataColumns.length > 0) {
            this.dataColumns = this.dataColumns.map((column) => {
              const apiColumn = apiColumns.find(
                (apiCol) => apiCol.key === column.key
              );
              return apiColumn ? { ...column, name: apiColumn.name } : column;
            });
          } else {
            this.dataColumns = apiColumns;
          }
        } else if (this.dataColumns.length === 0 && rawRows.length > 0) {
          const firstRow = rawRows[0];
          const firstDataValues: any = firstRow.data_values || {};
          this.dataColumns = Object.keys(firstDataValues).map((key) => ({
            key,
            name: key,
          }));
        }

        this.reportRows = rawRows.map((row): FormattedIntervalReportRow => {
          const formattedRow: FormattedIntervalReportRow = {
            ...row,
            formattedData: {},
          };
          this.dataColumns.forEach((column) => {
            const rowDataValues: any = row.data_values || {};
            const dataValue = rowDataValues[column.key];
            if (
              dataValue &&
              dataValue.used &&
              dataValue.value !== null &&
              dataValue.value !== undefined
            ) {
              const numValue = parseFloat(dataValue.value);
              formattedRow.formattedData[column.key] = !isNaN(numValue)
                ? numValue
                : '';
            } else {
              formattedRow.formattedData[column.key] = '';
            }
          });
          return formattedRow;
        });

        this.reportData = {
          interval: this.filterData.interval ?? 'HOUR',
          fromDate,
          toDate,
          dataFieldNames,
          aggregationByField: this.filterData.aggregationByField ?? {},
          ratioFormula: this.filterData.ratioFormula || 'data_1/data_3',
          overview: overviewData,
          rows: rawRows,
        };

        const paginationData = apiData.data || apiData;
        this.total =
          paginationData.total_elements ??
          paginationData.totalElements ??
          paginationData.total ??
          rawRows.length ??
          0;
        this.pageIndex =
          (paginationData.page ??
            paginationData.pageNumber ??
            this.pageIndex - 1) + 1;
        this.pageSize =
          paginationData.size ??
          paginationData.pageSize ??
          this.pageSize ??
          rawRows.length;

        this.prepareChartData();
      } else {
        this.reportData = null;
        this.reportRows = [];
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

    this.updateChartOptions();
  }

  updateChartOptions(): void {
    if (!this.chartData.length) {
      this.chartOptions = {};
      return;
    }

    const periods = this.chartData.map((dataItem) => dataItem.period);
    const values = this.chartData.map((dataItem) => dataItem.value);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const lineColor = isDark ? '#4b5563' : '#e5e7eb';
    const splitLineColor = isDark ? '#374151' : '#f3f4f6';

    const data1Name = this.reportData?.dataFieldNames?.['data_1'] ?? '';

    const formatLargeNumber = (value: number): string => {
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

    const formatNumber = (value: number): string => {
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
          if (params.componentType === 'markPoint') {
            const value = params.value;
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
          const period = params.axisValue || periods[params.dataIndex] || '';
          const tooltipValue = params.value;
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
        this.updateScaleOptions();
      }
      if (filters.scaleIds !== undefined) {
        this.filterData.scaleIds = filters.scaleIds;
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
    if (this.selectedRowIndex === index) {
      this.isHistoryExpanded = !this.isHistoryExpanded;
      if (!this.isHistoryExpanded) {
        this.selectedRow = null;
        this.selectedRowIndex = null;
        this.historyData = [];
      } else {
        this.selectedRowIndex = index;
      }
    } else {
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
        page: this.historyPageIndex - 1,
        size: this.historyPageSize,
      });

      if (data) {
        const rawHistoryData = data.data ?? [];
        this.historyData = rawHistoryData.map(
          (item: ScaleHistoryItem): FormattedScaleHistoryItem => {
            const formattedItem: FormattedScaleHistoryItem = {
              ...item,
              formattedData: {},
            };
            this.dataColumns.forEach((column) => {
              const historyDataValues: any = item.dataValues || {};
              const dataValue = historyDataValues[column.key];
              if (
                dataValue &&
                dataValue.used &&
                dataValue.value !== null &&
                dataValue.value !== undefined
              ) {
                const numValue = parseFloat(dataValue.value);
                formattedItem.formattedData[column.key] = !isNaN(numValue)
                  ? numValue
                  : '';
              } else {
                formattedItem.formattedData[column.key] = '';
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
    await this.loadTemplates();
    this.isTemplateModalVisible = true;
  }

  async loadTemplates(): Promise<void> {
    this.templatesLoading = true;
    try {
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

    let dateRange = this.filterData.dateRange;
    if (!dateRange || dateRange.length !== 2) {
      const today = moment();
      const sevenDaysAgo = moment().subtract(7, 'days');
      dateRange = [sevenDaysAgo.toDate(), today.toDate()];
    }

    this.exportingWithTemplate = true;
    try {
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
          .map((scale) => scale.id)
          .filter((identifier) => identifier !== undefined) as number[];
        if (this.filterData.scaleIds && this.filterData.scaleIds.length > 0) {
          scaleIds = scaleIds.filter((identifier: number) =>
            this.filterData.scaleIds.includes(identifier)
          );
        }
      }

      const startTime = moment(dateRange[0]).toISOString();
      const endTime = moment(dateRange[1]).endOf('day').toISOString();

      const dataFields = this.dataColumns.map((column) => column.key);

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

      const blob = await this.reportService.exportReportWithTemplate(
        template.id,
        payload
      );

      const fromDate = moment(dateRange[0]).format('YYYY-MM-DD');
      const toDate = moment(dateRange[1]).format('YYYY-MM-DD');
      const fileName = `${
        template.templateCode || 'Bao_cao'
      }_${fromDate}_${toDate}.docx`;

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

  getOverviewDirectionKeys(): string[] {
    if (!this.reportData?.overview) return [];
    return Object.keys(this.reportData.overview);
  }

  getDirectionLabel(directionKey: string): string {
    const directionMap: { [key: string]: string } = {
      '0': 'Unknown',
      '1': 'Nhập',
      '2': 'Xuất',
    };
    return directionMap[directionKey] || directionKey;
  }

  getOverviewDataKeys(directionKey: string): string[] {
    if (!this.reportData?.overview?.[directionKey]) return [];
    return Object.keys(this.reportData.overview[directionKey]);
  }

  getOverviewValue(directionKey: string, dataKey: string): string {
    if (!this.reportData?.overview?.[directionKey]?.[dataKey]) return '';
    const item = this.reportData.overview[directionKey][dataKey];
    const value = parseFloat(item.value || '0');
    const name = item.name || dataKey;
    return `${value.toFixed(2)} ${name}`;
  }

  getOverviewDataLabel(dataKey: string): string {
    return dataKey.toUpperCase().replace('_', ' ');
  }

  getOverviewBadgeClass(directionKey: string): string {
    const baseClass = 'px-3 py-1 text-xs font-semibold rounded-full border';
    if (directionKey === '0') {
      return `${baseClass} text-gray-800 bg-gray-100 border-gray-200 dark:bg-gray-900/40 dark:text-gray-100 dark:border-gray-700`;
    } else if (directionKey === '1') {
      return `${baseClass} text-green-800 bg-green-100 border-green-200 dark:bg-green-900/40 dark:text-green-100 dark:border-green-700`;
    } else if (directionKey === '2') {
      return `${baseClass} text-blue-800 bg-blue-100 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700`;
    }
    return baseClass;
  }
}
