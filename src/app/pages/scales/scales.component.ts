import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
    Protocol,
    ProtocolType,
    Scale,
    ScaleConnectionConfig,
    ScaleType,
} from '../../models';
import { ConfigApiService } from '../../services/config-api.service';
import { ConfigService } from '../../services/config.service';
import { PageActionService } from '../../services/page-action.service';
import { ProtocolService } from '../../services/protocol.service';
import { ScaleService } from '../../services/scale.service';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-scales',
  templateUrl: './scales.component.html',
  styleUrls: ['./scales.component.css'],
})
export class ScalesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  scales: Scale[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  saving = false;
  selectedScale: Scale | null = null;
  filterData: any = {};

  isConfigModalVisible = false;
  savingConfig = false;
  scaleConfig: any = {
    protocol: 'MODBUS_TCP',
    poll_interval: 1000,
    conn_params: { ip: '', port: 502 },
    data_1: {
      name: '',
      start_registers: 0,
      num_registers: 1,
      is_used: false,
      data_type: 'Integer',
    },
    data_2: {
      name: '',
      start_registers: 0,
      num_registers: 1,
      is_used: false,
      data_type: 'Integer',
    },
    data_3: {
      name: '',
      start_registers: 0,
      num_registers: 1,
      is_used: false,
      data_type: 'Integer',
    },
    data_4: {
      name: '',
      start_registers: 0,
      num_registers: 1,
      is_used: false,
      data_type: 'Integer',
    },
    data_5: {
      name: '',
      start_registers: 0,
      num_registers: 1,
      is_used: false,
      data_type: 'Integer',
    },
  };
  expandedChannels: { [key: number]: boolean } = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  };

  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  // Data for dropdowns
  protocols: Protocol[] = [];
  defaultReadCycle: number = 60;

  // Form data object
  dataScale: any = {};

  ProtocolType = ProtocolType;
  ScaleType = ScaleType;

  filterFields: FilterField[] = [
    {
      key: 'name',
      label: 'scales.name',
      type: 'text',
      placeholder: 'scales.name',
    },
    {
      key: 'code',
      label: 'scales.code',
      type: 'text',
      placeholder: 'scales.code',
    },
    {
      key: 'type',
      label: 'scales.type',
      type: 'select',
      placeholder: 'scales.type',
      options: [
        { label: 'scales.input', value: ScaleType.INPUT },
        { label: 'scales.output', value: ScaleType.OUTPUT },
      ],
    },
    {
      key: 'status',
      label: 'common.status',
      type: 'select',
      placeholder: 'common.status',
      options: [
        { label: 'common.active', value: 'active' },
        { label: 'common.inactive', value: 'inactive' },
      ],
    },
  ];

  columns: any[] = [
    { key: 'id', title: 'table.sl', width: '80px' },
    { key: 'code', title: 'table.code', width: '150px' },
    { key: 'name', title: 'table.title' },
    { key: 'type', title: 'scales.type', width: '120px' },
    { key: 'status', title: 'common.status', width: '120px' },
    { key: 'createdAt', title: 'table.dateCreated', width: '150px' },
  ];

  constructor(
    private scaleService: ScaleService,
    private protocolService: ProtocolService,
    private configApiService: ConfigApiService,
    private configService: ConfigService,
    private pageActionService: PageActionService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // this.loadConfigs();
    this.loadProtocols();
    this.loadDefaultReadCycle();
    this.loadScales();

    // Subscribe to add new action
    this.pageActionService.addNew$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.openAddModal();
      });
  }

  loadConfigs(): void {
    this.loadingConfigs = true;
    this.configService.getModuleFields('scales').subscribe({
      next: (fields: DynamicFormField[]) => {
        this.formFields = fields;
        this.loadingConfigs = false;
      },
      error: () => {
        this.formFields = [];
        this.loadingConfigs = false;
      },
    });

    this.configService.getModuleColumns('scales').subscribe({
      next: (columns: DynamicTableColumn[]) => {
        this.tableColumns = columns;
      },
      error: () => {
        this.tableColumns = [];
      },
    });
  }

  // Getter for basic form fields (exclude connection config fields)
  get basicFormFields(): DynamicFormField[] {
    return this.formFields.filter(
      (f) =>
        !f.fieldKey.includes('modbus') &&
        !f.fieldKey.includes('sabus') &&
        f.fieldKey !== 'connectionConfig'
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadProtocols(): Promise<void> {
    try {
      const data = await this.protocolService.getProtocols({
        status: 'active',
      });
      this.protocols = Array.isArray(data) ? data : data?.data || [];
    } catch (error) {
      this.protocols = [];
    }
  }

  async loadDefaultReadCycle(): Promise<void> {
    try {
      const data = await this.configApiService.getDefaultReadCycle();
      if (data?.value) {
        this.defaultReadCycle = parseInt(data.value, 10) || 60;
        if (!this.isEditMode) {
          this.dataScale.readCycle = this.defaultReadCycle;
        }
      }
    } catch (error) {
      this.defaultReadCycle = 60;
      if (!this.isEditMode) {
        this.dataScale.readCycle = 60;
      }
    }
  }

  async loadScales(): Promise<void> {
    this.loading = true;
    try {
      const data = await this.scaleService.getScales({
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      });
      this.scales = Array.isArray(data) ? data : data?.data || [];
      this.total = data?.total || this.scales.length;
    } catch (error) {
      this.scales = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadScales();
  }

  onReset(): void {
    this.filterData = {};
    this.loadScales();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedScale = null;
    // Initialize dataScale with default values from form fields
    this.dataScale = {};
    if (this.formFields.length > 0) {
      this.formFields.forEach((field: DynamicFormField) => {
        this.dataScale[field.fieldKey] = '';
      });
    } else {
      // Fallback defaults
      this.dataScale = {
        name: '',
        code: '',
        scaleType: ScaleType.INPUT,
        protocolId: null,
        readCycle: this.defaultReadCycle,
        modbusTcpIp: '',
        modbusTcpPort: null,
        modbusRtuPort: '',
        modbusRtuBaudRate: null,
        modbusRtuDataBits: 8,
        modbusRtuStopBits: 1,
        modbusRtuParity: 'NONE',
        sabusConfig: '',
      };
    }
    // Set defaults for scales
    this.dataScale.scaleType = ScaleType.INPUT;
    this.dataScale.readCycle = this.defaultReadCycle;
    this.isModalVisible = true;
  }

  openEditModal(scale: Scale): void {
    this.isEditMode = true;
    this.selectedScale = scale;
    // Map scale data to form fields
    this.dataScale = {};
    if (this.formFields.length > 0) {
      this.formFields.forEach((field: DynamicFormField) => {
        this.dataScale[field.fieldKey] = (scale as any)[field.fieldKey] || '';
      });
    } else {
      // Fallback to manual mapping
      this.dataScale = {
        name: scale.name,
        code: scale.code,
        scaleType: scale.scaleType,
        protocolId: scale.protocolId || null,
        readCycle: scale.readCycle || this.defaultReadCycle,
        modbusTcpIp: '',
        modbusTcpPort: null,
        modbusRtuPort: '',
        modbusRtuBaudRate: null,
        modbusRtuDataBits: 8,
        modbusRtuStopBits: 1,
        modbusRtuParity: 'NONE',
        sabusConfig: '',
      };
    }
    // Ensure defaults
    this.dataScale.readCycle = scale.readCycle || this.defaultReadCycle;

    // Load connection config based on protocol
    if (scale.protocolId && scale.connectionConfig) {
      const protocol = this.protocols.find((p) => p.id === scale.protocolId);
      if (protocol) {
        this.loadConnectionConfig(protocol.type, scale.connectionConfig);
      }
    }

    this.isModalVisible = true;
  }

  onProtocolChange(protocolId: number | null): void {
    if (!protocolId) {
      this.clearConnectionConfig();
      return;
    }

    const protocol = this.protocols.find((p) => p.id === protocolId);
    if (protocol) {
      this.clearConnectionConfig();
      // Set defaults for the selected protocol type
      if (protocol.type === ProtocolType.MODBUS_TCP) {
        this.dataScale.modbusTcpPort = 502;
      } else if (protocol.type === ProtocolType.MODBUS_RTU) {
        this.dataScale.modbusRtuBaudRate = 9600;
        this.dataScale.modbusRtuDataBits = 8;
        this.dataScale.modbusRtuStopBits = 1;
        this.dataScale.modbusRtuParity = 'NONE';
      }
    } else {
      this.clearConnectionConfig();
    }
  }

  loadConnectionConfig(
    protocolType: string,
    existingConfig: ScaleConnectionConfig
  ): void {
    const protocolTypeEnum = protocolType as ProtocolType;

    switch (protocolTypeEnum) {
      case ProtocolType.MODBUS_TCP:
        this.dataScale.modbusTcpIp = existingConfig.modbusTcp?.ip || '';
        this.dataScale.modbusTcpPort = existingConfig.modbusTcp?.port || 502;
        break;

      case ProtocolType.MODBUS_RTU:
        this.dataScale.modbusRtuPort = existingConfig.modbusRtu?.port || '';
        this.dataScale.modbusRtuBaudRate =
          existingConfig.modbusRtu?.baudRate || 9600;
        this.dataScale.modbusRtuDataBits =
          existingConfig.modbusRtu?.dataBits || 8;
        this.dataScale.modbusRtuStopBits =
          existingConfig.modbusRtu?.stopBits || 1;
        this.dataScale.modbusRtuParity =
          existingConfig.modbusRtu?.parity || 'NONE';
        break;

      case ProtocolType.SABUS:
        this.dataScale.sabusConfig = existingConfig.sabus?.['config'] || '';
        break;
    }
  }

  clearConnectionConfig(): void {
    this.dataScale.modbusTcpIp = '';
    this.dataScale.modbusTcpPort = null;
    this.dataScale.modbusRtuPort = '';
    this.dataScale.modbusRtuBaudRate = null;
    this.dataScale.modbusRtuDataBits = 8;
    this.dataScale.modbusRtuStopBits = 1;
    this.dataScale.modbusRtuParity = 'NONE';
    this.dataScale.sabusConfig = '';
  }

  // Getter for selected protocol type
  get selectedProtocolType(): string | null {
    if (!this.dataScale.protocolId) return null;
    const protocol = this.protocols.find(
      (p) => p.id === this.dataScale.protocolId
    );
    return protocol?.type || null;
  }

  isValidIp(ip: string): boolean {
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  saveScale(): void {
    // Validation
    if (
      !this.dataScale.name ||
      !this.dataScale.code ||
      !this.dataScale.protocolId
    ) {
      return;
    }

    const protocolType = this.selectedProtocolType;
    if (!protocolType) {
      return;
    }

    // Validate connection config based on protocol type
    if (protocolType === ProtocolType.MODBUS_TCP) {
      if (!this.dataScale.modbusTcpIp || !this.dataScale.modbusTcpPort) {
        return;
      }
      if (!this.isValidIp(this.dataScale.modbusTcpIp)) {
        return;
      }
    } else if (protocolType === ProtocolType.MODBUS_RTU) {
      if (!this.dataScale.modbusRtuPort || !this.dataScale.modbusRtuBaudRate) {
        return;
      }
    }

    this.performSave();
  }

  async performSave(): Promise<void> {
    this.saving = true;
    const protocolType = this.selectedProtocolType as ProtocolType;

    const connectionConfig: ScaleConnectionConfig = {
      protocolType: protocolType,
    };

    if (protocolType === ProtocolType.MODBUS_TCP) {
      connectionConfig.modbusTcp = {
        ip: this.dataScale.modbusTcpIp,
        port: this.dataScale.modbusTcpPort!,
      };
    } else if (protocolType === ProtocolType.MODBUS_RTU) {
      connectionConfig.modbusRtu = {
        port: this.dataScale.modbusRtuPort,
        baudRate: this.dataScale.modbusRtuBaudRate!,
        dataBits: this.dataScale.modbusRtuDataBits,
        stopBits: this.dataScale.modbusRtuStopBits,
        parity: this.dataScale.modbusRtuParity as 'NONE' | 'EVEN' | 'ODD',
      };
    } else if (protocolType === ProtocolType.SABUS) {
      connectionConfig.sabus = {
        config: this.dataScale.sabusConfig,
      };
    }

    const data = {
      name: this.dataScale.name,
      code: this.dataScale.code,
      scaleType: this.dataScale.scaleType,
      protocolId: this.dataScale.protocolId,
      readCycle: this.dataScale.readCycle || this.defaultReadCycle,
      connectionConfig: connectionConfig,
    };

    try {
      if (this.isEditMode) {
        await this.scaleService.updateScale(this.selectedScale?.id!, data);
      } else {
        await this.scaleService.createScale(data);
      }
      this.isModalVisible = false;
      await this.loadScales();
    } catch (error) {
      console.error('Error saving scale:', error);
    } finally {
      this.saving = false;
    }
  }

  // Confirm dialog
  isConfirmVisible = false;
  scaleToDelete: Scale | null = null;

  confirmDelete(scale: Scale): void {
    this.scaleToDelete = scale;
    this.isConfirmVisible = true;
  }

  async onDeleteConfirmed(): Promise<void> {
    if (this.scaleToDelete?.id) {
      try {
        await this.scaleService.deleteScale(this.scaleToDelete.id);
        await this.loadScales();
        this.scaleToDelete = null;
      } catch (error) {
        console.error('Error deleting scale:', error);
      }
    }
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.scaleToDelete) return '';
    return `Bạn có chắc chắn muốn xóa cân "${this.scaleToDelete.name}"?`;
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadScales();
  }

  async openConfigModal(scale: Scale): Promise<void> {
    if (!scale.id) return;

    this.selectedScale = scale;
    this.isConfigModalVisible = true;

    try {
      const config = await this.scaleService.getScaleConfig(scale.id);
      if (config && config.success === true && config.data) {
        const configData = config.data;
        this.scaleConfig = {
          protocol: configData.protocol || 'MODBUS_TCP',
          poll_interval: configData.poll_interval || 1000,
          conn_params: configData.conn_params || { ip: '', port: 502 },
          data_1: configData.data_1 || {
            name: '',
            start_registers: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'Integer',
          },
          data_2: configData.data_2 || {
            name: '',
            start_registers: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'Integer',
          },
          data_3: configData.data_3 || {
            name: '',
            start_registers: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'Integer',
          },
          data_4: configData.data_4 || {
            name: '',
            start_registers: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'Integer',
          },
          data_5: configData.data_5 || {
            name: '',
            start_registers: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'Integer',
          },
        };

        for (let i = 1; i <= 5; i++) {
          const channel = this.scaleConfig[`data_${i}`];
          if (channel && channel.is_used) {
            this.expandedChannels[i] = true;
          }
        }
      } else if (config) {
        const configData = config;
        this.scaleConfig = {
          protocol: configData.protocol || 'MODBUS_TCP',
          poll_interval: configData.poll_interval || 1000,
          conn_params: configData.conn_params || { ip: '', port: 502 },
          data_1: configData.data_1 || {
            name: '',
            start_registers: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'Integer',
          },
          data_2: configData.data_2 || {
            name: '',
            start_registers: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'Integer',
          },
          data_3: configData.data_3 || {
            name: '',
            start_registers: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'Integer',
          },
          data_4: configData.data_4 || {
            name: '',
            start_registers: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'Integer',
          },
          data_5: configData.data_5 || {
            name: '',
            start_registers: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'Integer',
          },
        };

        for (let i = 1; i <= 5; i++) {
          const channel = this.scaleConfig[`data_${i}`];
          if (channel && channel.is_used) {
            this.expandedChannels[i] = true;
          }
        }
      } else {
        this.resetConfig();
      }
    } catch (error) {
      this.resetConfig();
    }
  }

  resetConfig(): void {
    this.scaleConfig = {
      protocol: 'MODBUS_TCP',
      poll_interval: 1000,
      conn_params: { ip: '', port: 502 },
      data_1: {
        name: '',
        start_registers: 0,
        num_registers: 1,
        is_used: false,
        data_type: 'Integer',
      },
      data_2: {
        name: '',
        start_registers: 0,
        num_registers: 1,
        is_used: false,
        data_type: 'Integer',
      },
      data_3: {
        name: '',
        start_registers: 0,
        num_registers: 1,
        is_used: false,
        data_type: 'Integer',
      },
      data_4: {
        name: '',
        start_registers: 0,
        num_registers: 1,
        is_used: false,
        data_type: 'Integer',
      },
      data_5: {
        name: '',
        start_registers: 0,
        num_registers: 1,
        is_used: false,
        data_type: 'Integer',
      },
    };
    this.expandedChannels = {
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
    };
  }

  toggleChannel(channelNum: number): void {
    this.expandedChannels[channelNum] = !this.expandedChannels[channelNum];
  }

  onChannelToggle(channelNum: number, checked: boolean): void {
    if (checked) {
      this.expandedChannels[channelNum] = true;
    }
  }

  async saveConfig(): Promise<void> {
    if (!this.selectedScale?.id) return;

    if (!this.scaleConfig.protocol || !this.scaleConfig.conn_params) {
      return;
    }

    if (this.scaleConfig.poll_interval < 100) {
      return;
    }

    this.savingConfig = true;
    try {
      const configData: any = {
        protocol: this.scaleConfig.protocol,
        poll_interval: this.scaleConfig.poll_interval,
        conn_params: this.scaleConfig.conn_params,
      };

      for (let i = 1; i <= 5; i++) {
        const channel = this.scaleConfig[`data_${i}`];
        if (channel && channel.is_used) {
          configData[`data_${i}`] = {
            name: channel.name,
            start_registers: channel.start_registers,
            num_registers: channel.num_registers,
            is_used: true,
          };
        } else {
          configData[`data_${i}`] = { is_used: false };
        }
      }

      await this.scaleService.updateScaleConfig(
        this.selectedScale.id,
        configData
      );
      this.isConfigModalVisible = false;
      this.loadScales();
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      this.savingConfig = false;
    }
  }

  getChannelLabel(channelNum: number): string {
    const channel = this.scaleConfig[`data_${channelNum}`];
    const channelLabel =
      this.translate.instant('scales.channel') + ' ' + channelNum;
    if (channel?.is_used && channel?.name) {
      return `${channelLabel}: ${channel.name}`;
    }
    return `${channelLabel}: (Not configured)`;
  }
}
