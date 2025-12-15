import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Config,
  License,
  Protocol,
  ProtocolType,
  Scale,
  ScaleConnectionConfig,
  ScaleType,
} from '../../models';
import { ConfigService } from '../../services/config.service';
import { HttpService } from '../../services/http.service';
import { PageActionService } from '../../services/page-action.service';
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

  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  // Data for dropdowns
  protocols: Protocol[] = [];
  licenses: License[] = [];
  defaultReadCycle: number = 60; // Default 60 seconds

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
    private http: HttpService,
    private configService: ConfigService,
    private pageActionService: PageActionService
  ) {}

  ngOnInit(): void {
    this.loadConfigs();
    this.loadProtocols();
    this.loadDefaultReadCycle();
    this.loadLicenses();
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

  loadProtocols(): void {
    this.http.get<Protocol[]>('api/protocols', { status: 'active' }).subscribe({
      next: (data: any) => {
        this.protocols = Array.isArray(data) ? data : data?.data || [];
      },
    });
  }

  loadDefaultReadCycle(): void {
    this.http.get<Config>('api/configs/defaultReadCycle').subscribe({
      next: (data: any) => {
        if (data?.value) {
          this.defaultReadCycle = parseInt(data.value, 10) || 60;
          // Update readCycle if not in edit mode
          if (!this.isEditMode) {
            this.dataScale.readCycle = this.defaultReadCycle;
          }
        }
      },
      error: () => {
        // Use default if API fails
        this.defaultReadCycle = 60;
        if (!this.isEditMode) {
          this.dataScale.readCycle = 60;
        }
      },
    });
  }

  loadLicenses(): void {
    this.http.get<License[]>('api/licenses', { isActive: true }).subscribe({
      next: (data: any) => {
        this.licenses = Array.isArray(data) ? data : data?.data || [];
      },
    });
  }

  loadScales(): void {
    this.loading = true;
    this.http
      .get<Scale[]>('api/scales', {
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      })
      .subscribe({
        next: (data: any) => {
          this.scales = Array.isArray(data) ? data : data?.data || [];
          this.total = data?.total || this.scales.length;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
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
    // Check license before opening modal
    this.checkLicenseBeforeAdd().then((canAdd) => {
      if (!canAdd) {
        return;
      }

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
    });
  }

  checkLicenseBeforeAdd(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.licenses.length === 0) {
        // No license found, allow but warn
        resolve(true);
        return;
      }

      // Get active license
      const activeLicense = this.licenses.find((l) => l.isActive);
      if (!activeLicense) {
        resolve(true);
        return;
      }

      // Check current scales count
      this.http.get<{ total: number }>('api/scales/count').subscribe({
        next: (data: any) => {
          const currentCount = data?.total || this.scales.length;
          if (currentCount >= activeLicense.maxScales) {
            alert(
              `Đã đạt giới hạn số lượng cân cho phép (${activeLicense.maxScales}). Vui lòng nâng cấp license.`
            );
            resolve(false);
          } else {
            resolve(true);
          }
        },
        error: () => {
          // If check fails, allow but warn
          resolve(true);
        },
      });
    });
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

    // Check license for new scales
    if (!this.isEditMode) {
      this.checkLicenseBeforeAdd().then((canAdd) => {
        if (!canAdd) {
          return;
        }
        this.performSave();
      });
    } else {
      this.performSave();
    }
  }

  performSave(): void {
    this.saving = true;
    const protocolType = this.selectedProtocolType as ProtocolType;

    // Build connection config
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

    const request = this.isEditMode
      ? this.http.put(`api/scales/${this.selectedScale?.id}`, data)
      : this.http.post('api/scales', data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.isModalVisible = false;
        this.loadScales();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // Confirm dialog
  isConfirmVisible = false;
  scaleToDelete: Scale | null = null;

  confirmDelete(scale: Scale): void {
    this.scaleToDelete = scale;
    this.isConfirmVisible = true;
  }

  onDeleteConfirmed(): void {
    if (this.scaleToDelete?.id) {
      this.http.delete(`api/scales/${this.scaleToDelete.id}`).subscribe({
        next: () => {
          this.loadScales();
          this.scaleToDelete = null;
        },
      });
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
}
