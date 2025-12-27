import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { Scale, ScaleData, ScaleType } from '../../models';
import { ReportService } from '../../services/report.service';
import { ScaleService } from '../../services/scale.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

interface ScaleReportData extends ScaleData {
  hour?: number; // Giờ để highlight
  isImportant?: boolean; // Mốc quan trọng
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
  reportData: ScaleReportData[] = [];
  loading = false;

  // Filter data
  filterData: any = {
    dateRange: null,
    scaleType: null,
    scaleIds: [],
  };

  // Chart data
  chartData: any[] = [];
  chartOptions: any = {};

  ScaleType = ScaleType;

  filterFields: FilterField[] = [
    {
      key: 'dateRange',
      label: 'reports.dateRange',
      type: 'dateRange',
      placeholder: 'reports.dateRange',
      format: 'dd/MM/yyyy HH:mm',
      showTime: true,
    },
    {
      key: 'scaleType',
      label: 'reports.scaleType',
      type: 'select',
      placeholder: 'reports.selectScaleType',
      options: [
        { label: 'scales.input', value: ScaleType.INPUT },
        { label: 'scales.output', value: ScaleType.OUTPUT },
      ],
      onChange: (value: ScaleType | null) => {
        this.onScaleTypeChange(value);
      },
    },
    {
      key: 'scaleIds',
      label: 'reports.selectScales',
      type: 'multiselect',
      placeholder: 'reports.selectScales',
      options: [],
    },
  ];

  constructor(
    private scaleService: ScaleService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.loadScales();
    this.loadReportData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadScales(): Promise<void> {
    try {
      const data = await this.scaleService.getScales({});
      this.scales = Array.isArray(data) ? data : data?.data || [];
      this.updateScaleOptions();
    } catch (error) {
      this.scales = [];
    }
  }

  updateScaleOptions(): void {
    const scaleField = this.filterFields.find((f) => f.key === 'scaleIds');
    if (scaleField) {
      let filteredScales = [...this.scales];
      // Filter by scaleType if selected
      if (this.filterData.scaleType) {
        filteredScales = filteredScales.filter(
          (s) => s.scaleType === this.filterData.scaleType
        );
      }
      scaleField.options = filteredScales.map((scale) => ({
        label: `${scale.name} (${scale.code})`,
        value: scale.id,
      }));
      // Remove selected scales that are no longer in filtered list
      if (this.filterData.scaleIds) {
        this.filterData.scaleIds = this.filterData.scaleIds.filter(
          (id: number) => filteredScales.some((s) => s.id === id)
        );
      }
    }
  }

  async loadReportData(): Promise<void> {
    this.loading = true;
    const params: any = {};

    if (this.filterData.dateRange && this.filterData.dateRange.length === 2) {
      params.startDate = this.filterData.dateRange[0];
      params.endDate = this.filterData.dateRange[1];
    }

    if (this.filterData.scaleType) {
      params.scaleType = this.filterData.scaleType;
    }

    if (this.filterData.scaleIds && this.filterData.scaleIds.length > 0) {
      params.scaleIds = this.filterData.scaleIds;
    }

    try {
      const data = await this.reportService.generateReport({
        scaleIds: params.scaleIds || [],
        dataField: 'weight',
        method: 'AVG',
        fromDate: params.startDate || '',
        toDate: params.endDate || '',
        interval: 'HOUR',
      });
      const rawData = Array.isArray(data) ? data : data?.data || [];
      this.reportData = this.processReportData(rawData);
      this.prepareChartData();
    } catch (error) {
      this.reportData = [];
    } finally {
      this.loading = false;
    }
  }

  processReportData(data: ScaleData[]): ScaleReportData[] {
    return data.map((item) => {
      const date = new Date(item.timestamp);
      const hour = date.getHours();

      // Highlight important milestones (every hour on the hour, or specific hours)
      const isImportant = hour % 3 === 0 || hour === 0 || hour === 12;

      return {
        ...item,
        hour,
        isImportant,
      };
    });
  }

  prepareChartData(): void {
    // Group data by hour for trend chart
    const hourlyData: { [hour: number]: number[] } = {};

    this.reportData.forEach((item) => {
      if (!hourlyData[item.hour!]) {
        hourlyData[item.hour!] = [];
      }
      hourlyData[item.hour!].push(item.weight);
    });

    // Calculate average weight per hour
    this.chartData = Object.keys(hourlyData)
      .map((hour) => ({
        hour: parseInt(hour),
        averageWeight:
          hourlyData[parseInt(hour)].reduce((a, b) => a + b, 0) /
          hourlyData[parseInt(hour)].length,
        count: hourlyData[parseInt(hour)].length,
      }))
      .sort((a, b) => a.hour - b.hour);

    // Prepare ECharts options
    this.updateChartOptions();
  }

  updateChartOptions(): void {
    const hours = this.chartData.map((d) => `${d.hour}:00`);
    const weights = this.chartData.map((d) => d.averageWeight);

    // Detect dark theme
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const lineColor = isDark ? '#4b5563' : '#e5e7eb';
    const splitLineColor = isDark ? '#374151' : '#f3f4f6';

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
              <div>Số lượng: ${data.count}</div>
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
        data: hours,
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
        name: 'Trọng lượng (kg)',
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
          name: 'Trọng lượng trung bình (kg)',
          type: 'line',
          smooth: true,
          data: weights,
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
          markPoint: {
            data: this.chartData
              .filter((d) => d.hour % 3 === 0 || d.hour === 0 || d.hour === 12)
              .map((d) => {
                const index = this.chartData.findIndex(
                  (item) => item.hour === d.hour
                );
                return {
                  name: d.averageWeight.toFixed(1),
                  value: d.averageWeight,
                  coord: [index, d.averageWeight],
                  itemStyle: {
                    color: '#fbbf24',
                  },
                  label: {
                    show: true,
                    position: 'top',
                    color: isDark ? '#ffffff' : '#1f2937',
                    fontSize: 12,
                    fontWeight: 'bold',
                    backgroundColor: isDark
                      ? 'rgba(31, 41, 55, 0.8)'
                      : 'rgba(255, 255, 255, 0.9)',
                    borderColor: '#fbbf24',
                    borderWidth: 1,
                    borderRadius: 4,
                    padding: [4, 6],
                    formatter: (params: any) => {
                      return params.value.toFixed(1);
                    },
                  },
                };
              }),
          },
        },
      ],
    };
  }

  onScaleTypeChange(scaleType: ScaleType | null): void {
    this.filterData.scaleType = scaleType;
    // Update scale options based on type
    this.updateScaleOptions();
  }

  onSearch(filters?: any): void {
    if (filters) {
      // Handle dateRange from filter-sidebar
      if (filters.dateRangeFrom && filters.dateRangeTo) {
        this.filterData.dateRange = [
          filters.dateRangeFrom,
          filters.dateRangeTo,
        ];
      } else {
        this.filterData.dateRange = null;
      }
      if (filters.scaleType !== undefined) {
        this.filterData.scaleType = filters.scaleType;
        this.onScaleTypeChange(filters.scaleType);
      }
      if (filters.scaleIds !== undefined) {
        this.filterData.scaleIds = filters.scaleIds;
      }
    }
    this.loadReportData();
  }

  onReset(): void {
    this.filterData = {
      dateRange: null,
      scaleType: null,
      scaleIds: [],
    };
    this.updateScaleOptions();
    this.loadReportData();
  }

  getHighlightClass(item: ScaleReportData): string {
    if (item.isImportant) {
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500';
    }
    return '';
  }
}
