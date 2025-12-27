import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConnectionStatus, Scale, ScaleData, ScaleType } from '../../models';
import { ConnectionStatusService } from '../../services/connection-status.service';
import { ScaleDataService } from '../../services/scale-data.service';
import { ScaleService } from '../../services/scale.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Scales data
  scales: Scale[] = [];
  scalesLoading = false;

  // Current scale data
  currentData: ScaleData[] = [];
  currentDataLoading = false;

  // Connection status data
  connectionStatuses: ConnectionStatus[] = [];
  connectionStatusLoading = false;

  // Dashboard metrics
  totalScales = 0;
  activeScales = 0;
  offlineScales = 0;
  pausedScales = 0;
  todayDataCount = 0;
  totalCurrentWeight = 0;
  averageWeight = 0;
  maxWeight = 0;
  minWeight = 0;
  scalesWithData = 0;
  inputScales = 0;
  outputScales = 0;
  onlinePercentage = 0;
  dataPercentage = 0;

  // Progress metrics
  activeScalesRate = 0;
  scalesWithDataRate = 0;
  onlineScalesRate = 0;
  onlineScalesCount = 0;
  offlineScalesCount = 0;
  todayDataCollectionRate = 0;
  systemHealthPercentage = 0;

  // Chart options
  statusChartOptions: any = {};
  typeChartOptions: any = {};
  weightTrendChartOptions: any = {};
  weightByScaleChartOptions: any = {};

  ScaleType = ScaleType;

  constructor(
    private scaleService: ScaleService,
    private scaleDataService: ScaleDataService,
    private connectionStatusService: ConnectionStatusService
  ) {}

  ngOnInit(): void {
    this.loadScales();
    this.loadCurrentData();
    this.loadConnectionStatuses();

    // Auto-refresh every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadScales();
        this.loadCurrentData();
        this.loadConnectionStatuses();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadScales(): Promise<void> {
    this.scalesLoading = true;
    try {
      const data = await this.scaleService.getScales({});
      const allScales = Array.isArray(data) ? data : data?.data || [];
      this.scales = allScales;
      this.updateMetrics();
      this.updateCharts();
    } catch (error) {
      console.error('Error loading scales:', error);
    } finally {
      this.scalesLoading = false;
    }
  }

  async loadCurrentData(): Promise<void> {
    this.currentDataLoading = true;
    try {
      const data = await this.scaleDataService.getCurrentScaleData({});
      this.currentData = Array.isArray(data) ? data : data?.data || [];
      this.updateMetrics();
      this.updateCharts();
    } catch (error) {
      console.error('Error loading current data:', error);
    } finally {
      this.currentDataLoading = false;
    }
  }

  async loadConnectionStatuses(): Promise<void> {
    this.connectionStatusLoading = true;
    try {
      const data = await this.connectionStatusService.getConnectionStatuses({
        page: 1,
        size: 1000,
      });
      this.connectionStatuses = Array.isArray(data) ? data : data?.data || [];
      this.updateMetrics();
    } catch (error) {
      console.error('Error loading connection statuses:', error);
    } finally {
      this.connectionStatusLoading = false;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'OFFLINE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'ERROR':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  updateMetrics(): void {
    // Calculate metrics
    this.totalScales = this.scales.length;
    this.activeScales = this.scales.filter(
      (s) => s.is_active === true
    ).length;
    this.pausedScales = this.scales.filter((s) => s.status === 'paused').length;
    this.offlineScales = this.scales.filter(
      (s) => s.is_active === false || (s.is_active === undefined && s.status !== 'paused')
    ).length;
    this.inputScales = this.scales.filter(
      (s) => s.scaleType === ScaleType.INPUT
    ).length;
    this.outputScales = this.scales.filter(
      (s) => s.scaleType === ScaleType.OUTPUT
    ).length;

    this.totalCurrentWeight = this.currentData.reduce(
      (sum, data) => sum + (data.weight || 0),
      0
    );
    this.scalesWithData = this.currentData.length;

    // Calculate weight statistics
    if (this.currentData.length > 0) {
      const weights = this.currentData
        .map((d) => d.weight || 0)
        .filter((w) => w > 0);
      if (weights.length > 0) {
        this.averageWeight =
          weights.reduce((a, b) => a + b, 0) / weights.length;
        this.maxWeight = Math.max(...weights);
        this.minWeight = Math.min(...weights);
      }
    }

    // Calculate today's data count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.todayDataCount = this.currentData.filter((data) => {
      const dataDate = new Date(data.timestamp);
      return dataDate >= today;
    }).length;

    // Calculate percentages
    this.onlinePercentage =
      this.totalScales > 0
        ? Math.round((this.activeScales / this.totalScales) * 100)
        : 0;
    this.dataPercentage =
      this.totalScales > 0
        ? Math.round((this.scalesWithData / this.totalScales) * 100)
        : 0;

    // Calculate Active Scales Rate
    this.activeScalesRate =
      this.totalScales > 0
        ? Math.round((this.activeScales / this.totalScales) * 100)
        : 0;

    // Calculate Scales with Data Rate
    this.scalesWithDataRate =
      this.totalScales > 0
        ? Math.round((this.scalesWithData / this.totalScales) * 100)
        : 0;

    // Calculate Online Scales Rate based on connection statuses
    this.onlineScalesCount = this.connectionStatuses.filter(
      (cs) => cs.status === 'ONLINE'
    ).length;
    this.offlineScalesCount = this.connectionStatuses.filter(
      (cs) => cs.status === 'OFFLINE' || cs.status === 'ERROR'
    ).length;
    this.onlineScalesRate =
      this.totalScales > 0
        ? Math.round((this.onlineScalesCount / this.totalScales) * 100)
        : 0;

    // Calculate Today Data Collection Rate
    // Assuming each scale should have at least 1 data point per day
    // Rate is based on how many scales have data today vs total scales
    const scalesWithTodayData = new Set(
      this.currentData
        .filter((data) => {
          const dataDate = new Date(data.timestamp);
          return dataDate >= today;
        })
        .map((data) => data.scaleId)
    ).size;
    this.todayDataCollectionRate =
      this.totalScales > 0
        ? Math.round((scalesWithTodayData / this.totalScales) * 100)
        : 0;

    // System Health: Combined metric
    const healthFactors = [
      this.activeScalesRate / 100,
      this.scalesWithDataRate / 100,
      this.onlineScalesRate / 100,
      this.todayDataCollectionRate / 100,
    ];
    this.systemHealthPercentage = Math.round(
      (healthFactors.reduce((a, b) => a + b, 0) / healthFactors.length) * 100
    );
  }

  updateCharts(): void {
    this.updateStatusChart();
    this.updateTypeChart();
    this.updateWeightTrendChart();
    this.updateWeightByScaleChart();
  }

  updateStatusChart(): void {
    const statusCounts = {
      active: this.scales.filter((s) => s.is_active === true)
        .length,
      paused: this.scales.filter((s) => s.status === 'paused').length,
      inactive: this.scales.filter(
        (s) => s.is_active === false || (s.is_active === undefined && s.status !== 'paused')
      ).length,
    };

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';

    this.statusChartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: { color: textColor },
      },
      legend: {
        orient: 'horizontal',
        bottom: '5%',
        left: 'center',
        textStyle: { color: textColor, fontSize: 10 },
      },
      series: [
        {
          name: 'Trạng thái',
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: isDark ? '#1F2937' : '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{d}%',
            color: textColor,
            fontSize: 11,
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 5,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 11,
              fontWeight: 'bold',
            },
          },
          data: [
            {
              value: statusCounts.active,
              name: 'Hoạt động',
              itemStyle: { color: '#10B981' },
            },
            {
              value: statusCounts.paused,
              name: 'Tạm dừng',
              itemStyle: { color: '#F59E0B' },
            },
            {
              value: statusCounts.inactive,
              name: 'Không hoạt động',
              itemStyle: { color: '#6B7280' },
            },
          ],
        },
      ],
    };
  }

  updateTypeChart(): void {
    const typeCounts = {
      input: this.scales.filter((s) => s.scaleType === ScaleType.INPUT).length,
      output: this.scales.filter((s) => s.scaleType === ScaleType.OUTPUT)
        .length,
    };

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';

    this.typeChartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: { color: textColor },
      },
      legend: {
        orient: 'horizontal',
        bottom: '5%',
        left: 'center',
        textStyle: { color: textColor, fontSize: 10 },
      },
      series: [
        {
          name: 'Loại cân',
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: isDark ? '#1F2937' : '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{d}%',
            color: textColor,
            fontSize: 11,
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 5,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 11,
              fontWeight: 'bold',
            },
          },
          data: [
            {
              value: typeCounts.input,
              name: 'Cân vào',
              itemStyle: { color: '#3B82F6' },
            },
            {
              value: typeCounts.output,
              name: 'Cân ra',
              itemStyle: { color: '#8B5CF6' },
            },
          ],
        },
      ],
    };
  }

  updateWeightTrendChart(): void {
    // Get last 10 data points for trend
    const recentData = [...this.currentData]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10)
      .reverse();

    const times = recentData.map((d) => {
      const date = new Date(d.timestamp);
      return `${date.getHours()}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
    });
    const weights = recentData.map((d) => d.weight || 0);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const lineColor = isDark ? '#4b5563' : '#e5e7eb';
    const splitLineColor = isDark ? '#374151' : '#f3f4f6';

    this.weightTrendChartOptions = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: { color: textColor },
      },
      grid: {
        left: '8%',
        right: '3%',
        top: '10%',
        bottom: '10%',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: times,
        axisLabel: { color: textColor, fontSize: 10 },
        axisLine: { lineStyle: { color: lineColor } },
      },
      yAxis: {
        type: 'value',
        name: 'Khối lượng (kg)',
        nameTextStyle: { color: textColor, fontSize: 10 },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          formatter: '{value} kg',
        },
        axisLine: { show: false },
        splitLine: {
          lineStyle: {
            color: splitLineColor,
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: 'Khối lượng',
          type: 'line',
          smooth: true,
          data: weights,
          itemStyle: { color: '#3B82F6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  }

  updateWeightByScaleChart(): void {
    // Group current data by scale
    const scaleWeights: { [key: string]: number } = {};
    this.currentData.forEach((data) => {
      const scaleName = data.scale?.name || `Cân ${data.scaleId}`;
      scaleWeights[scaleName] =
        (scaleWeights[scaleName] || 0) + (data.weight || 0);
    });

    const scaleNames = Object.keys(scaleWeights);
    const weights = Object.values(scaleWeights);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const lineColor = isDark ? '#4b5563' : '#e5e7eb';
    const splitLineColor = isDark ? '#374151' : '#f3f4f6';

    this.weightByScaleChartOptions = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: { color: textColor },
      },
      grid: {
        left: '8%',
        right: '3%',
        top: '10%',
        bottom: '10%',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: scaleNames,
        axisLabel: {
          color: textColor,
          rotate: 45,
        },
        axisLine: { lineStyle: { color: lineColor } },
      },
      yAxis: {
        type: 'value',
        name: 'Khối lượng (kg)',
        nameTextStyle: { color: textColor, fontSize: 10 },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          formatter: '{value} kg',
        },
        axisLine: { show: false },
        splitLine: {
          lineStyle: {
            color: splitLineColor,
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: 'Khối lượng',
          type: 'bar',
          data: weights,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#10B981' },
                { offset: 1, color: '#059669' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }
}
