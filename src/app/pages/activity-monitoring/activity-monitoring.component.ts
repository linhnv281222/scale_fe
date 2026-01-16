import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { Subject } from 'rxjs';
// @ts-ignore
import * as SockJS from 'sockjs-client';
import { environment } from 'src/environment/environment';
import { Scale } from '../../models';
import {
  ActivityMonitoringItem,
  ActivityMonitoringService,
} from '../../services/activity-monitoring.service';
import { ScaleService } from '../../services/scale.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-activity-monitoring',
  templateUrl: './activity-monitoring.component.html',
  styleUrls: ['./activity-monitoring.component.css'],
})
export class ActivityMonitoringComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Combined data
  activityData: ActivityMonitoringItem[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  filterData: any = {};
  sidebarVisible = true;
  sidebarSize = 15; // Percentage

  // Dynamic column headers from first item's dataValues
  dataColumn1Name: string = '';
  dataColumn2Name: string = '';

  // Scales list for filter
  scales: Scale[] = [];


  // Thresholds
  WARNING_THRESHOLD_MINUTES = 5;
  ERROR_THRESHOLD_MINUTES = 15;

  // WebSocket
  private stompClient!: Client;
  private stompSubscription!: StompSubscription;
  private isReconnecting: boolean = false;
  private reconnectTimeout: any = null;
  private readonly RECONNECT_DELAY: number = 5000;
  isConnectWebsocket = false;

  filterFields: FilterField[] = [
    {
      key: 'scale_ids',
      label: 'scales.name',
      type: 'multiselect',
      placeholder: 'scales.selectScale',
      options: [],
    },
    {
      key: 'status',
      label: 'connectionStatus.status',
      type: 'multiselect',
      placeholder: 'connectionStatus.status',
      options: [
        { label: 'connectionStatus.online', value: 'ONLINE' },
        { label: 'connectionStatus.offline', value: 'OFFLINE' },
      ],
    },
  ];

  constructor(
    private activityMonitoringService: ActivityMonitoringService,
    private scaleService: ScaleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadScales();
    this.loadActivityData();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadScales(): Promise<void> {
    try {
      const result = await this.scaleService.getScales();
      this.scales = result.data || [];
      // Update filter options
      const scaleField = this.filterFields.find(f => f.key === 'scale_ids');
      if (scaleField) {
        scaleField.options = this.scales.map(scale => ({
          label: scale.name,
          value: scale.id,
        }));
      }
    } catch (error) {
      console.error('Error loading scales:', error);
    }
  }

  async loadActivityData(): Promise<void> {
    this.loading = true;
    try {
      // Build query params
      const params: any = {};
      if (this.filterData.scale_ids && Array.isArray(this.filterData.scale_ids) && this.filterData.scale_ids.length > 0) {
        params.scale_ids = this.filterData.scale_ids;
      }
      if (this.filterData.status && Array.isArray(this.filterData.status) && this.filterData.status.length > 0) {
        params.status = this.filterData.status;
      }

      const result = await this.activityMonitoringService.getCurrentStates(params);
      this.activityData = result.data || [];
      this.total = result.total || this.activityData.length;

      // Extract column names from first item's dataValues
      if (this.activityData.length > 0) {
        const firstItem = this.activityData[0];
        if (firstItem.dataValues) {
          this.dataColumn1Name = firstItem.dataValues.data_1?.name || '';
          this.dataColumn2Name = firstItem.dataValues.data_2?.name || '';
        }
      }

      // Map data for backward compatibility
      this.activityData = this.activityData.map((item: ActivityMonitoringItem) => ({
        ...item,
        lastDataTime: item.lastTime ? new Date(item.lastTime) : undefined,
        minutesWithoutData: this.getMinutesWithoutData(
          item.lastTime ? new Date(item.lastTime) : undefined
        ),
      }));
    } catch (error) {
      console.error('Error loading activity data:', error);
      this.activityData = [];
      this.total = 0;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }


  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadActivityData();
  }

  onReset(): void {
    this.filterData = {};
    this.pageIndex = 1;
    this.loadActivityData();
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadActivityData();
  }


  getStatusClass(status: string): string {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'OFFLINE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getMinutesWithoutData(lastDataTime?: Date): number | null {
    if (!lastDataTime) return null;
    const now = new Date();
    const diff = now.getTime() - new Date(lastDataTime).getTime();
    return Math.floor(diff / (1000 * 60));
  }

  getTimeWithoutDataText(item: ActivityMonitoringItem): string {
    if (!item.lastDataTime) return 'Không có dữ liệu';
    const minutes = item.minutesWithoutData;
    if (minutes === null || minutes === undefined) return 'Không có dữ liệu';

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;

    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  getRowClass(item: ActivityMonitoringItem): string {
    const minutes = item.minutesWithoutData;

    if (!item.lastDataTime || minutes === null || minutes === undefined) {
      return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20';
    }

    if (minutes >= this.ERROR_THRESHOLD_MINUTES) {
      return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20';
    }

    if (minutes >= this.WARNING_THRESHOLD_MINUTES) {
      return 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/20';
    }

    return 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800';
  }

  getLastDataTimeClass(item: ActivityMonitoringItem): string {
    const minutes = item.minutesWithoutData;

    if (!item.lastDataTime || minutes === null || minutes === undefined) {
      return 'text-red-600 dark:text-red-400 font-semibold';
    }

    if (minutes >= this.ERROR_THRESHOLD_MINUTES) {
      return 'text-red-600 dark:text-red-400 font-semibold';
    }

    if (minutes >= this.WARNING_THRESHOLD_MINUTES) {
      return 'text-orange-600 dark:text-orange-400 font-medium';
    }

    return 'text-gray-900 dark:text-white';
  }


  // WebSocket methods
  private async connectWebSocket(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const socketUrl = `${environment.api_end_point}/api/v1/ws-scalehub`;

      console.log('[WebSocket] Đang kết nối đến:', socketUrl);

      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          clientType: 'public',
        },
        reconnectDelay: 0,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: (frame) => {
          console.log('[WebSocket] ✅ Kết nối thành công:', frame);
          this.isConnectWebsocket = true;
          this.isReconnecting = false;
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }
          this.subscribeToTopic();
          this.cdr.markForCheck();
        },
        onStompError: (error) => {
          console.error('[WebSocket] ❌ STOMP error:', error);
          this.cdr.markForCheck();
        },
        onWebSocketClose: (event) => {
          console.warn('[WebSocket] ⚠️ WebSocket đã đóng:', event.code, event.reason);
          this.isConnectWebsocket = false;
          if (event.code !== 1000) {
            if (this.isReconnecting) {
              this.isReconnecting = false;
            }
            this.handleReconnect();
          }
          this.cdr.markForCheck();
        },
        onWebSocketError: (error) => {
          console.error('[WebSocket] ❌ WebSocket error:', error);
          this.isConnectWebsocket = false;
          if (this.isReconnecting) {
            this.isReconnecting = false;
          }
          this.handleReconnect();
          this.cdr.markForCheck();
        },
        onDisconnect: (frame) => {
          console.warn('[WebSocket] ⚠️ Disconnected:', frame);
          this.isConnectWebsocket = false;
          this.cdr.markForCheck();
        },
      });
      this.stompClient.activate();
    } catch (error) {
      console.error('[WebSocket] ❌ Lỗi khi khởi tạo kết nối:', error);
      this.cdr.markForCheck();
    }
  }

  private subscribeToTopic(): void {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    try {
      this.stompSubscription = this.stompClient.subscribe('/topic/all-scales-data', (message) => {
        try {
          console.log('[WebSocket] 📨 Nhận được message:', message.body);
          this.loadActivityData();
        } catch (error) {
          console.error('[WebSocket] ❌ Lỗi khi xử lý message:', error);
        }
      });
      console.log('[WebSocket] ✅ Đã subscribe vào /topic/all-scales-data');
    } catch (error) {
      console.error('[WebSocket] ❌ Lỗi khi subscribe:', error);
    }
  }

  private handleReconnect(): void {
    if (this.isReconnecting) {
      return;
    }
    this.isReconnecting = true;
    console.log('[WebSocket] 🔄 Bắt đầu reconnect sau', this.RECONNECT_DELAY, 'ms...');
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(async () => {
      try {
        console.log('[WebSocket] 🔄 Đang thử reconnect...');
        if (this.stompClient) {
          try {
            if (this.stompSubscription && this.stompClient.connected) {
              try {
                this.stompSubscription.unsubscribe();
              } catch (unsubError) {
                console.warn('[WebSocket] ⚠️ Lỗi khi unsubscribe:', unsubError);
              }
            }
            this.stompSubscription = null as any;
            if (this.stompClient.active) {
              try {
                await this.stompClient.deactivate();
                await new Promise((resolve) => setTimeout(resolve, 100));
              } catch (deactivateError) {
                console.warn('[WebSocket] ⚠️ Lỗi khi deactivate:', deactivateError);
              }
            }
          } catch (cleanupError) {
            console.warn('[WebSocket] ⚠️ Lỗi khi cleanup client cũ:', cleanupError);
          }
          this.stompClient = null as any;
        }
        await this.connectWebSocket();
      } catch (error) {
        console.error('[WebSocket] ❌ Lỗi khi reconnect:', error);
        this.isReconnecting = false;
        this.handleReconnect();
      }
    }, this.RECONNECT_DELAY);
  }

  private disconnectWebSocket(): void {
    if (this.stompClient) {
      try {
        if (this.stompSubscription && this.stompClient.connected) {
          this.stompSubscription.unsubscribe();
        }
        if (this.stompClient.active) {
          this.stompClient.deactivate();
        }
      } catch (error) {
        console.warn('[WebSocket] ⚠️ Lỗi khi disconnect:', error);
      }
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  onSplitDragEnd(event: any): void {
    if (event.sizes && event.sizes.length > 0) {
      const firstSize = event.sizes[0];
      this.sidebarSize = typeof firstSize === 'number' ? firstSize : parseFloat(firstSize);
    }
  }
}
