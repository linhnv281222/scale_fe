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
    interval: 'SHIFT' as IntervalType,
    aggregationByField: {} as { [key: string]: AggregationType },
    ratioFormula: 'data_1/data_3',
    shiftIds: [],
  };

  chartData: any[] = [];
  chartOptions: any = {};
  isChartExpanded = false;

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
  ) {}

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
      this.updateScaleOptions();
      if (this.scales.length > 0 && this.selectedScaleIds.length === 0) {
        this.allScalesChecked = true;
        this.updateAllScalesChecked();
      }
      await this.loadScaleConfigs();
    } catch (error) {
      this.scales = [];
    }
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
        } catch (error) {}
      }
    } else {
      const firstScaleIdentifier = selectedScaleIdentifiers[0];
      try {
        const scale = await this.scaleService.getScaleById(firstScaleIdentifier);
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
          const columnsFromApi = Object.keys(dataFieldNames).map((key) => ({
            key,
            name: dataFieldNames![key],
          }));
          if (this.dataColumns.length > 0) {
            this.dataColumns = this.dataColumns.map((column) => {
              const matchingApiColumn = columnsFromApi.find(
                (apiColumn) => apiColumn.key === column.key
              );
              return matchingApiColumn ? { ...column, name: matchingApiColumn.name } : column;
            });
          } else {
            this.dataColumns = columnsFromApi;
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
          interval: 'SHIFT' as IntervalType,
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
              <div>${tooltipParameter.seriesName}: ${formatNumber(tooltipValue)}</div>
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
        this.updateScaleOptions();
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
    this.updateScaleOptions();
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
        if (
          this.filterData.scaleIds &&
          this.filterData.scaleIds.length > 0
        ) {
          scaleIdentifiers = scaleIdentifiers.filter((identifier: number) =>
            this.filterData.scaleIds.includes(identifier)
          );
        }
      }

      const startTime = moment(dateRange[0]).toISOString();
      const endTime = moment(dateRange[1]).endOf('day').toISOString();

      const dataFields = this.dataColumns.map((column) => column.key);

      const payload = {
        type: 'WORD',
        scaleIds: scaleIdentifiers,
        startTime,
        endTime,
        dataFields:
          dataFields.length > 0
            ? dataFields
            : ['data_1', 'data_2', 'data_3', 'data_4', 'data_5'],
        aggregationMethod: 'SUM',
        aggregationByField: this.filterData.aggregationByField ?? {},
        intervalReport: true,
        timeInterval: 'SHIFT' as IntervalType,
        locationIds: this.filterData.locationIds ?? [],
        activeOnly: true,
        reportTitle: 'Báo cáo ca',
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
}
