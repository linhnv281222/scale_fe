import { Component, OnDestroy, OnInit } from '@angular/core';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import { NzFormatEmitEvent, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
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
  Shift,
} from '../../models';
import { LocationService } from '../../services/location.service';
import { ReportService } from '../../services/report.service';
import { ScaleService } from '../../services/scale.service';
import { ShiftService } from '../../services/shift.service';
import { TemplateService } from '../../services/template.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

interface FormattedIntervalReportRow extends IntervalReportRow {
  formattedData: { [key: string]: number | string };
  directionLabelKey: string;
  directionBadgeClass: string;
  start_time?: string;
  end_time?: string;
  ratioDisplayValue: number | string;
}

@Component({
  selector: 'app-shift-report',
  templateUrl: './shift-report.component.html',
  styleUrls: ['./shift-report.component.css'],
})
export class ShiftReportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  scales: Scale[] = [];
  locations: Location[] = [];
  shifts: Shift[] = [];
  reportData: IntervalReportResponse | null = null;
  reportRows: FormattedIntervalReportRow[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;

  dataColumns: { key: string; name: string }[] = [];

  selectedScaleIds: number[] = [];
  scaleTreeNodes: NzTreeNodeOptions[] = [];
  expandKeys: string[] = [];
  checkedKeys: string[] = [];

  filterData: any = {
    dateRange: null,
    scaleIds: [],
    locationIds: [],
    manufacturerIds: [],
    direction: null,
    interval: 'SHIFT' as IntervalType,
    aggregationByField: {} as { [key: string]: AggregationType },
    ratioFormula: 'data_1/data_3',
    shiftIds: [],
  };

  chartData: any[] = [];
  chartOptions: any = {};
  isChartExpanded = false;
  ratioStatisticHeader = '';
  sidebarVisible = true;
  sidebarSize = 260; // Pixel
  overviewDisplay: {
    directionKey: string;
    directionLabel: string;
    badgeClass: string;
    items: { key: string; label: string; value: number | null; unit: string }[];
  }[] = [];
  dataFieldSummaries: {
    [key: string]: {
      value: string;
      aggregation: string;
      name: string;
      unit: string;
      used: boolean;
    };
  } = {};

  private getDataFieldDisplayName(
    dataKey: string,
    dataFieldNames: any
  ): string {
    const rawValue = dataFieldNames?.[dataKey];
    if (rawValue && typeof rawValue === 'object') {
      const name = String(rawValue.name ?? '').trim() || dataKey;
      const unit = String(rawValue.unit ?? '').trim();
      return unit ? `${name} (${unit})` : name;
    }
    if (typeof rawValue === 'string' && rawValue.trim()) {
      return rawValue.trim();
    }
    return dataKey;
  }

  private buildRatioStatisticHeader(dataFieldNames: any, rows: any[]): string {
    const rawFormula =
      rows?.[0]?.ratio?.formula ||
      (this.reportData as any)?.ratioFormula ||
      this.filterData?.ratioFormula ||
      '';
    const formula = String(rawFormula || '').trim();
    const match = formula.match(/(data_\d+)\s*\/\s*(data_\d+)/);
    if (!match) return 'Thống kê';
    const numeratorKey = match[1];
    const denominatorKey = match[2];
    const numeratorName = this.getDataFieldDisplayName(
      numeratorKey,
      dataFieldNames
    );
    const denominatorName = this.getDataFieldDisplayName(
      denominatorKey,
      dataFieldNames
    );
    return `Thống kê (${numeratorName}/${denominatorName})`;
  }

  private getDirectionLabelKey(direction: number | null | undefined): string {
    if (direction === 1) return 'reports.direction.in';
    if (direction === 2) return 'reports.direction.out';
    return 'reports.direction.unknown';
  }

  private getDirectionBadgeClass(direction: number | null | undefined): string {
    if (direction === 1) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800';
    }
    if (direction === 2) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  }

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
  ];

  exporting = false;

  isTemplateModalVisible = false;
  templates: ReportTemplateImport[] = [];
  templatesLoading = false;
  exportingWithTemplate = false;

  constructor(
    private scaleService: ScaleService,
    private reportService: ReportService,
    private locationService: LocationService,
    private shiftService: ShiftService,
    private templateService: TemplateService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    const today = moment();
    const sevenDaysAgo = moment().subtract(7, 'days');
    this.filterData.dateRange = [sevenDaysAgo.toDate(), today.toDate()];

    this.loadLocations();
    this.loadShifts();
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

  async loadShifts(): Promise<void> {
    try {
      const response = await this.shiftService.getShifts();
      this.shifts = response.data ?? [];
    } catch (error) {
      this.shifts = [];
    }
  }

  toggleShift(shiftId: number): void {
    const index = this.filterData.shiftIds.indexOf(shiftId);
    if (index > -1) {
      this.filterData.shiftIds.splice(index, 1);
    } else {
      this.filterData.shiftIds.push(shiftId);
    }
    this.loadReportData();
  }

  isShiftSelected(shiftId: number): boolean {
    return this.filterData.shiftIds.includes(shiftId);
  }

  toggleAllShifts(): void {
    const allShiftIds = this.shifts
      .filter((shift) => shift.id !== undefined)
      .map((shift) => shift.id!);
    const areAllSelected = this.areAllShiftsSelected();
    if (areAllSelected) {
      this.filterData.shiftIds = [];
    } else {
      this.filterData.shiftIds = [...allShiftIds];
    }
    this.loadReportData();
  }

  areAllShiftsSelected(): boolean {
    const allShiftIds = this.shifts
      .filter((shift) => shift.id !== undefined)
      .map((shift) => shift.id!);
    return (
      allShiftIds.length > 0 &&
      allShiftIds.every((shiftId) => this.filterData.shiftIds.includes(shiftId))
    );
  }

  async loadScales(): Promise<void> {
    try {
      const data = await this.scaleService.getScales();
      this.scales = Array.isArray(data) ? data : data?.data ?? [];
      this.buildScaleTreeNodes();
      await this.loadScaleConfigs();
    } catch (error) {
      this.scales = [];
    }
  }

  private buildScaleTreeNodes(): void {
    const scaleChildren = this.scales
      .filter((scale) => scale.id !== undefined)
      .map((scale) => ({
        key: String(scale.id!),
        title: scale.name || `Scale ${scale.id}`,
        isLeaf: true,
        origin: scale,
      }));

    const allNode: NzTreeNodeOptions = {
      key: 'all',
      title: 'Tất cả',
      children: scaleChildren,
      isLeaf: false,
      expanded: true,
    };

    this.scaleTreeNodes = [allNode];
    this.expandKeys = ['all'];

    // Set default: select all scales
    if (this.scales.length > 0 && this.selectedScaleIds.length === 0) {
      this.selectedScaleIds = this.scales
        .filter((scale) => scale.id !== undefined)
        .map((scale) => scale.id!);
      this.filterData.scaleIds = [...this.selectedScaleIds];
    }

    // Set checkedKeys to show checked state (all + all scale ids)
    this.checkedKeys = [
      'all',
      ...this.scales
        .filter((scale) => scale.id !== undefined)
        .map((scale) => String(scale.id!)),
    ];
  }

  async loadScaleConfigs(): Promise<void> {
    const selectedScaleIdentifiers = this.filterData.scaleIds ?? [];
    if (selectedScaleIdentifiers.length === 0) {
      if (this.scales.length > 0 && this.scales[0].id) {
        try {
          const scale = await this.scaleService.getScaleById(this.scales[0].id);
          const config = scale?.scale_config;
          if (config) {
            this.initializeAggregationFields(config);
          }
        } catch (error) { }
      }
    } else {
      const firstScaleIdentifier = selectedScaleIdentifiers[0];
      try {
        const scale = await this.scaleService.getScaleById(
          firstScaleIdentifier
        );
        const config = scale?.scale_config;
        if (config) {
          this.initializeAggregationFields(config);
        }
      } catch (error) { }
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
        // If key is data_1, use SUM; otherwise use ABS
        aggregation[dataKey] = dataKey === 'data_1' ? 'SUM' : 'ABS';
        columns.push({ key: dataKey, name: dataName });
      }
    }

    this.filterData.aggregationByField = aggregation;
    this.dataColumns = columns;
  }

  onScaleTreeCheck(event: NzFormatEmitEvent): void {
    if (event.eventName !== 'check') {
      return;
    }

    const checkedKeys = event.checkedKeys || [];
    let scaleIds: number[] = [];

    // Update checkedKeys for display
    this.checkedKeys = checkedKeys.map((key: any) => {
      if (typeof key === 'string') {
        return key;
      }
      if (key && typeof key === 'object' && key.key) {
        return key.key;
      }
      return String(key);
    });

    if (Array.isArray(checkedKeys)) {
      const checkedIds = checkedKeys
        .map((key: any) => {
          if (typeof key === 'string') {
            // Skip 'all' key
            if (key === 'all') {
              return null;
            }
            const id = Number(key);
            return !isNaN(id) ? id : null;
          }
          if (key && typeof key === 'object' && key.key) {
            if (key.key === 'all') {
              return null;
            }
            const id = Number(key.key);
            return !isNaN(id) ? id : null;
          }
          if (typeof key === 'number') {
            return key;
          }
          return null;
        })
        .filter((id: number | null) => id !== null && !isNaN(id)) as number[];

      scaleIds = [...new Set(checkedIds)];
    }

    // Check if "all" is checked
    const allChecked = checkedKeys.some((key: any) => {
      const keyValue = typeof key === 'string' ? key : key?.key;
      return keyValue === 'all';
    });

    if (allChecked) {
      // Select all scales
      scaleIds = this.scales
        .filter((scale) => scale.id !== undefined)
        .map((scale) => scale.id!);
    }

    this.selectedScaleIds = scaleIds;
    this.filterData.scaleIds = [...this.selectedScaleIds];

    // Reload report data when scale selection changes
    this.loadReportData();
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
        shiftIds: this.filterData.shiftIds?.length
          ? this.filterData.shiftIds
          : undefined,
        fromTime,
        toTime,
        interval: 'SHIFT' as IntervalType,
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

        // Ưu tiên lấy dataFieldNames đúng theo các cấu trúc response khác nhau
        let dataFieldNames =
          apiData?.dataFieldNames ||
          apiData?.data?.dataFieldNames ||
          (Array.isArray(apiData?.data) && apiData.data[0]
            ? apiData.data[0].dataFieldNames
            : {}) ||
          {};
        if (
          (!dataFieldNames || Object.keys(dataFieldNames).length === 0) &&
          rawRows.length > 0
        ) {
          const firstRow = rawRows[0];
          const firstDataValues: any = firstRow.data_values || {};
          const keys = Object.keys(firstDataValues);
          dataFieldNames = keys.reduce((accumulator: any, key: string) => {
            const dataValue = firstDataValues[key];
            if (dataValue?.name) {
              accumulator[key] = {
                name: dataValue.name,
                unit: dataValue.unit ?? '',
              };
            }
            return accumulator;
          }, {});
        }

        // Lấy dataFieldSummaries từ API response
        this.dataFieldSummaries =
          apiData?.dataFieldSummaries ||
          apiData?.data?.dataFieldSummaries ||
          (Array.isArray(apiData?.data) && apiData.data[0]
            ? apiData.data[0].dataFieldSummaries
            : {}) ||
          {};

        if (dataFieldNames && Object.keys(dataFieldNames).length > 0) {
          const columnsFromApi = Object.keys(dataFieldNames)
            .filter((key) => {
              const fieldInfo = dataFieldNames[key];
              const name = fieldInfo?.name?.trim() || '';
              if (name) {
                return true;
              }
              if (rawRows.length > 0) {
                const firstRow = rawRows[0];
                const firstDataValues: any = firstRow.data_values || {};
                const dataValue = firstDataValues[key];
                return dataValue?.used === true;
              }
              return false;
            })
            .map((key) => ({
              key,
              name: this.getDataFieldDisplayName(key, dataFieldNames),
            }));
          if (this.dataColumns.length > 0) {
            this.dataColumns = this.dataColumns
              .filter((column) => {
                return columnsFromApi.some(
                  (apiColumn) => apiColumn.key === column.key
                );
              })
              .map((column) => {
                const matchingApiColumn = columnsFromApi.find(
                  (apiColumn) => apiColumn.key === column.key
                );
                return matchingApiColumn
                  ? { ...column, name: matchingApiColumn.name }
                  : column;
              });
          } else {
            this.dataColumns = columnsFromApi;
          }
        } else if (this.dataColumns.length === 0 && rawRows.length > 0) {
          const firstRow = rawRows[0];
          const firstDataValues: any = firstRow.data_values || {};
          this.dataColumns = Object.keys(firstDataValues)
            .filter((key) => {
              const dataValue = firstDataValues[key];
              return dataValue?.used === true;
            })
            .map((key) => ({
              key,
              name: this.getDataFieldDisplayName(key, dataFieldNames),
            }));
        }

        this.ratioStatisticHeader = this.buildRatioStatisticHeader(
          dataFieldNames,
          rawRows as any[]
        );

        this.reportRows = rawRows.map((row): FormattedIntervalReportRow => {
          const ratioValueRaw = (row as any)?.ratio?.value;
          const ratioValueNumber = parseFloat(String(ratioValueRaw ?? ''));
          const formattedRow: FormattedIntervalReportRow = {
            ...row,
            formattedData: {},
            directionLabelKey: this.getDirectionLabelKey(
              (row as any)?.direction
            ),
            directionBadgeClass: this.getDirectionBadgeClass(
              (row as any)?.direction
            ),
            ratioDisplayValue: !isNaN(ratioValueNumber) ? ratioValueNumber : '',
          };

          this.dataColumns.forEach((column) => {
            const rowStartValues: any = (row as any).start_values || {};
            const rowEndValues: any = (row as any).end_values || {};
            const rowDataValues: any = (row as any).data_values || {};

            const startValue = rowStartValues[column.key];
            const endValue = rowEndValues[column.key];
            const dataValue = rowDataValues[column.key];

            if (
              startValue &&
              startValue.used &&
              startValue.value !== null &&
              startValue.value !== undefined
            ) {
              const numValue = parseFloat(startValue.value);
              formattedRow.formattedData[`${column.key}_start`] = !isNaN(
                numValue
              )
                ? numValue
                : '';
            } else {
              formattedRow.formattedData[`${column.key}_start`] = '';
            }

            if (
              endValue &&
              endValue.used &&
              endValue.value !== null &&
              endValue.value !== undefined
            ) {
              const numValue = parseFloat(endValue.value);
              formattedRow.formattedData[`${column.key}_end`] = !isNaN(numValue)
                ? numValue
                : '';
            } else {
              formattedRow.formattedData[`${column.key}_end`] = '';
            }

            if (
              dataValue &&
              dataValue.used &&
              dataValue.value !== null &&
              dataValue.value !== undefined
            ) {
              const numValue = parseFloat(dataValue.value);
              formattedRow.formattedData[`${column.key}_data`] = !isNaN(
                numValue
              )
                ? numValue
                : '';
            } else {
              formattedRow.formattedData[`${column.key}_data`] = '';
            }
          });

          return formattedRow;
        });

        this.reportData = {
          interval: 'SHIFT' as IntervalType,
          fromDate,
          toDate,
          dataFieldNames,
          aggregationByField: this.filterData.aggregationByField ?? {},
          ratioFormula: this.filterData.ratioFormula || 'data_1/data_3',
          overview: overviewData,
          rows: rawRows,
        };

        const paginationData = apiData.data.data || apiData;
        this.total = paginationData.total_elements ?? 0;
        this.pageIndex = paginationData.page + 1;
        this.pageSize = paginationData.size;

        this.prepareOverviewDisplay();
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

  private prepareOverviewDisplay(): void {
    this.overviewDisplay = [];

    if (!this.reportData?.overview) {
      return;
    }

    const overview = this.reportData.overview as any;

    const directionLabelMap: { [key: string]: string } = {
      '0': 'Unknown',
      '1': 'Nhập',
      '2': 'Xuất',
    };

    const getBadgeClass = (directionKey: string): string => {
      const baseClass =
        'px-3 py-1 text-xs font-semibold rounded-full border flex-shrink-0';
      if (directionKey === '0') {
        return (
          baseClass +
          ' text-gray-800 bg-gray-100 border-gray-200 dark:bg-gray-900/40 dark:text-gray-100 dark:border-gray-700'
        );
      }
      if (directionKey === '1') {
        return (
          baseClass +
          ' text-green-800 bg-green-100 border-green-200 dark:bg-green-900/40 dark:text-green-100 dark:border-green-700'
        );
      }
      if (directionKey === '2') {
        return (
          baseClass +
          ' text-blue-800 bg-blue-100 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700'
        );
      }
      return baseClass;
    };

    const getItemLabel = (dataKey: string): string => {
      return dataKey.toUpperCase().replace('_', ' ');
    };

    Object.keys(overview).forEach((directionKey) => {
      const directionOverview = overview[directionKey] || {};

      const items = Object.keys(directionOverview).map((dataKey) => {
        const item = directionOverview[dataKey] || {};
        const rawValue =
          item && typeof item.value === 'string'
            ? parseFloat(item.value)
            : Number(item?.value);
        const value =
          rawValue === null || isNaN(rawValue as number)
            ? null
            : (rawValue as number);

        const label =
          item && item.name && String(item.name).trim()
            ? String(item.name).trim()
            : getItemLabel(dataKey);

        const unit =
          item && typeof item.unit === 'string' ? String(item.unit).trim() : '';

        return {
          key: dataKey,
          label,
          value,
          unit,
        };
      });

      this.overviewDisplay.push({
        directionKey,
        directionLabel: directionLabelMap[directionKey] || directionKey,
        badgeClass: getBadgeClass(directionKey),
        items,
      });
    });
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

    const data1Name = this.getDataFieldDisplayName(
      'data_1',
      (this.reportData as any)?.dataFieldNames
    );

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
          const tooltipParameter = params[0];
          const tooltipValue = tooltipParameter.value;
          if (
            tooltipValue === null ||
            tooltipValue === undefined ||
            isNaN(tooltipValue)
          ) {
            return `
              <div>
                <div><strong>${tooltipParameter.axisValue}</strong></div>
                <div>${tooltipParameter.seriesName}: -</div>
              </div>
            `;
          }
          return `
            <div>
              <div><strong>${tooltipParameter.axisValue}</strong></div>
              <div>${tooltipParameter.seriesName}: ${formatNumber(
            tooltipValue
          )}</div>
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
      if (filters.locationIds !== undefined) {
        this.filterData.locationIds = filters.locationIds;
        this.buildScaleTreeNodes();
      }
    }
    this.loadReportData();
  }

  onReset(): void {
    this.filterData = {
      dateRange: null,
      scaleIds: [],
      locationIds: [],
      interval: 'SHIFT' as IntervalType,
      aggregationByField: {} as { [key: string]: AggregationType },
      shiftIds: [],
    };
    this.reportData = null;
    this.reportRows = [];
    this.dataColumns = [];
    this.chartData = [];
    this.chartOptions = {};
    this.pageIndex = 1;
    this.pageSize = 20;
    this.total = 0;
    this.buildScaleTreeNodes();
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadReportData();
  }

  formatPeriod(period: string): string {
    if (!period) return '';
    // Split by space to separate date and shift
    const parts = period.split(' ');
    if (parts.length < 2) {
      // If no space, try to parse as date only
      const date = moment(period);
      return date.isValid() ? date.format('DD/MM/YYYY') : period;
    }
    const datePart = parts[0];
    const shiftPart = parts.slice(1).join(' '); // Join remaining parts in case shift has spaces

    // Format date part
    const date = moment(datePart);
    const formattedDate = date.isValid() ? date.format('DD/MM/YYYY') : datePart;

    // Return formatted date + shift
    return `${formattedDate} ${shiftPart}`;
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
        'Báo cáo ca'
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
      let scaleIdentifiers = this.filterData.scaleIds ?? [];
      if (
        this.filterData.locationIds &&
        this.filterData.locationIds.length > 0
      ) {
        const filteredScales = this.scales.filter((scale) => {
          const locationIdentifier = scale.location_id ?? scale.locationId;
          return (
            locationIdentifier &&
            this.filterData.locationIds.includes(locationIdentifier)
          );
        });
        scaleIdentifiers = filteredScales
          .map((scale) => scale.id)
          .filter((identifier) => identifier !== undefined) as number[];
        if (this.filterData.scaleIds && this.filterData.scaleIds.length > 0) {
          scaleIdentifiers = scaleIdentifiers.filter((identifier: number) =>
            this.filterData.scaleIds.includes(identifier)
          );
        }
      }

      const startTime = moment(dateRange[0]).toISOString();
      const endTime = moment(dateRange[1]).endOf('day').toISOString();

      const fromTime = startTime;
      const toTime = endTime;

      const exportPayload = {
        importId: template.id,
        scaleIds: scaleIdentifiers.length ? scaleIdentifiers : undefined,
        manufacturerIds: this.filterData.manufacturerIds?.length
          ? this.filterData.manufacturerIds
          : undefined,
        locationIds: this.filterData.locationIds?.length
          ? this.filterData.locationIds
          : undefined,
        direction: this.filterData.direction || undefined,
        shiftIds: this.filterData.shiftIds?.length
          ? this.filterData.shiftIds
          : undefined,
        fromTime,
        toTime,
        interval: 'SHIFT' as IntervalType,
        aggregationByField: this.filterData.aggregationByField ?? {},
        ratioFormula: this.filterData.ratioFormula || 'data_1/data_3',
        page: this.pageIndex - 1,
        size: this.pageSize,
      };

      const blob = await this.reportService.exportIntervalReportV2(
        exportPayload
      );

      const fromDate = moment(dateRange[0]).format('YYYY-MM-DD');
      const toDate = moment(dateRange[1]).format('YYYY-MM-DD');
      const fileName = `${template.templateCode || 'Bao_cao'
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

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  hasDataFieldSummaries(): boolean {
    return (
      this.dataFieldSummaries && Object.keys(this.dataFieldSummaries).length > 0
    );
  }

  onSplitDragEnd(event: any): void {
    if (event.sizes && event.sizes.length > 0) {
      const firstSize = event.sizes[0];
      this.sidebarSize =
        typeof firstSize === 'number' ? firstSize : parseFloat(firstSize);
      // Ensure sidebar size stays within bounds
      if (this.sidebarSize < 250) {
        this.sidebarSize = 250;
      } else if (this.sidebarSize > 500) {
        this.sidebarSize = 500;
      }
    }
  }
}
