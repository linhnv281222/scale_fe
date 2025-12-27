import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ShiftReport, Shift, Scale } from '../../models';
import { ShiftService } from '../../services/shift.service';
import { ScaleService } from '../../services/scale.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-shift-report',
  templateUrl: './shift-report.component.html',
  styleUrls: ['./shift-report.component.css']
})
export class ShiftReportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  shifts: Shift[] = [];
  scales: Scale[] = [];
  reportData: ShiftReport[] = [];
  loading = false;

  // Filter data
  filterData: any = {
    dateRange: null,
    shiftIds: [],
    scaleIds: [],
  };

  // Chart data
  chartData: any[] = [];
  chartOptions: any = {};

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
      key: 'shiftIds',
      label: 'shiftReport.selectShifts',
      type: 'multiselect',
      placeholder: 'shiftReport.selectShifts',
      options: [],
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
    private shiftService: ShiftService,
    private scaleService: ScaleService
  ) {}

  ngOnInit(): void {
    this.loadShifts();
    this.loadScales();
    this.loadReportData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadShifts(): Promise<void> {
    try {
      const data = await this.shiftService.getShifts({ page: 1, size: 1000 });
      this.shifts = data.data || [];
      this.updateShiftOptions();
    } catch (error) {
      this.shifts = [];
    }
  }

  async loadScales(): Promise<void> {
    try {
      const data = await this.scaleService.getScales({ page: 1, size: 1000 });
      this.scales = data.data || [];
      this.updateScaleOptions();
    } catch (error) {
      this.scales = [];
    }
  }

  updateShiftOptions(): void {
    const shiftField = this.filterFields.find((f) => f.key === 'shiftIds');
    if (shiftField) {
      shiftField.options = this.shifts.map((shift) => ({
        label: shift.name,
        value: shift.id!,
      }));
    }
  }

  updateScaleOptions(): void {
    const scaleField = this.filterFields.find((f) => f.key === 'scaleIds');
    if (scaleField) {
      scaleField.options = this.scales.map((scale) => ({
        label: scale.name,
        value: scale.id!,
      }));
    }
  }

  async loadReportData(): Promise<void> {
    this.loading = true;

    // Prepare params
    const params: any = {};
    if (this.filterData.dateRange && this.filterData.dateRange.length === 2) {
      params.startDate = this.filterData.dateRange[0].toISOString();
      params.endDate = this.filterData.dateRange[1].toISOString();
    }
    if (this.filterData.shiftIds && this.filterData.shiftIds.length > 0) {
      params.shiftIds = this.filterData.shiftIds;
    }
    if (this.filterData.scaleIds && this.filterData.scaleIds.length > 0) {
      params.scaleIds = this.filterData.scaleIds;
    }

    // TODO: API 'reports/shift' chưa có trong api-docs.json - tạm thời comment lại
    // Có thể sử dụng '/reports/generate' thay thế
    try {
      // const data = await this.reportService.generateReport(params);
      // this.reportData = data.data || [];
      this.reportData = [];
      this.processChartData();
    } catch (error) {
      this.reportData = [];
    } finally {
      this.loading = false;
    }
  }

  processChartData(): void {
    if (this.reportData.length === 0) {
      this.chartData = [];
      this.chartOptions = {};
      return;
    }

    // Group data by hour
    const hourlyData: { [key: string]: any } = {};

    this.reportData.forEach((item) => {
      const date = new Date(item.date);
      const hour = date.getHours();
      const key = `${date.toDateString()}_${hour}`;

      if (!hourlyData[key]) {
        hourlyData[key] = {
          hour: hour,
          date: date.toDateString(),
          flowRate: [],
          totalAccumulated: [],
          speed: [],
          weight: [],
          count: 0,
        };
      }

      if (item.flowRate !== undefined && item.flowRate !== null) {
        hourlyData[key].flowRate.push(item.flowRate);
      }
      if (item.totalAccumulated !== undefined && item.totalAccumulated !== null) {
        hourlyData[key].totalAccumulated.push(item.totalAccumulated);
      }
      if (item.speed !== undefined && item.speed !== null) {
        hourlyData[key].speed.push(item.speed);
      }
      if (item.weight !== undefined && item.weight !== null) {
        hourlyData[key].weight.push(item.weight);
      }
      hourlyData[key].count++;
    });

    // Convert to array and calculate averages
    this.chartData = Object.values(hourlyData)
      .map((data: any) => ({
        hour: data.hour,
        date: data.date,
        flowRate: data.flowRate.length > 0
          ? data.flowRate.reduce((a: number, b: number) => a + b, 0) / data.flowRate.length
          : 0,
        totalAccumulated: data.totalAccumulated.length > 0
          ? data.totalAccumulated.reduce((a: number, b: number) => a + b, 0) / data.totalAccumulated.length
          : 0,
        speed: data.speed.length > 0
          ? data.speed.reduce((a: number, b: number) => a + b, 0) / data.speed.length
          : 0,
        weight: data.weight.length > 0
          ? data.weight.reduce((a: number, b: number) => a + b, 0) / data.weight.length
          : 0,
        count: data.count,
      }))
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.hour - b.hour;
      });

    this.updateChartOptions();
  }

  updateChartOptions(): void {
    if (this.chartData.length === 0) {
      this.chartOptions = {};
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f9fafb' : '#1f2937';
    const lineColor = isDark ? '#374151' : '#e5e7eb';
    const splitLineColor = isDark ? '#374151' : '#e5e7eb';

    const hours = this.chartData.map((d) => `${d.hour}:00`);
    const flowRates = this.chartData.map((d) => d.flowRate);
    const totalAccumulated = this.chartData.map((d) => d.totalAccumulated);
    const speeds = this.chartData.map((d) => d.speed);
    const weights = this.chartData.map((d) => d.weight);

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
          if (!params || params.length === 0) return '';
          const data = this.chartData[params[0].dataIndex];
          let result = `<div><strong>${params[0].axisValue}</strong></div>`;
          params.forEach((param: any) => {
            // param.seriesName already includes unit
            result += `<div>${param.seriesName}: ${param.value.toFixed(1)}</div>`;
          });
          result += `<div>Số lượng: ${data.count}</div>`;
          return result;
        },
      },
      legend: {
        data: ['Lưu lượng (m³/h)', 'Tổng tích lũy (kg)', 'Tốc độ (m/s)', 'Khối lượng (kg)'],
        textStyle: {
          color: textColor,
        },
        top: '5%',
      },
      grid: {
        left: '5%',
        right: '2%',
        top: '20%',
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
        name: 'Giá trị',
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
          name: 'Lưu lượng (m³/h)',
          type: 'line',
          smooth: true,
          data: flowRates,
          itemStyle: {
            color: '#3b82f6',
          },
        },
        {
          name: 'Tổng tích lũy (kg)',
          type: 'line',
          smooth: true,
          data: totalAccumulated,
          itemStyle: {
            color: '#10b981',
          },
        },
        {
          name: 'Tốc độ (m/s)',
          type: 'line',
          smooth: true,
          data: speeds,
          itemStyle: {
            color: '#f59e0b',
          },
        },
        {
          name: 'Khối lượng (kg)',
          type: 'line',
          smooth: true,
          data: weights,
          itemStyle: {
            color: '#ef4444',
          },
        },
      ],
    };
  }

  onSearch(filters: any): void {
    this.filterData = { ...filters };
    this.loadReportData();
  }

  getConnectionStatusClass(status: string): string {
    if (status === 'CONNECTED') {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }

  formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return value.toFixed(1);
  }
}
