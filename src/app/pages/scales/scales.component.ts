import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Location,
  Protocol,
  ProtocolType,
  Scale,
  ScaleConnectionConfig,
  ScaleType,
} from '../../models';
import { LocationService } from '../../services/location.service';
import { PageActionService } from '../../services/page-action.service';
import { ProtocolService } from '../../services/protocol.service';
import { ScaleManufacturerService } from '../../services/scale-manufacturer.service';
import { ScaleService } from '../../services/scale.service';
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
  isViewMode = false;
  saving = false;
  selectedScale: Scale | null = null;
  filterData: any = {};

  isConfigModalVisible = false;
  savingConfig = false;
  scaleConfig: any = {
    protocol: 'MODBUS_TCP',
    poll_interval: 1000,
    conn_params: {
      ip: '',
      port: 502,
      // MODBUS_RTU params
      com_port: '',
      baud_rate: 9600,
      data_bits: 8,
      stop_bits: 1,
      parity: 'even',
      unit_id: 1,
    },
    data_1: {
      name: '',
      start_register: 0,
      num_registers: 1,
      is_used: false,
      data_type: 'int32',
      function_code: 3,
      byte_order: 'big_endian',
    },
    data_2: {
      name: '',
      start_register: 0,
      num_registers: 1,
      is_used: false,
      data_type: 'int32',
      function_code: 3,
      byte_order: 'big_endian',
    },
    data_3: {
      name: '',
      start_register: 0,
      num_registers: 1,
      is_used: false,
      data_type: 'int32',
      function_code: 3,
      byte_order: 'big_endian',
    },
    data_4: {
      name: '',
      start_register: 0,
      num_registers: 1,
      is_used: false,
      data_type: 'int32',
      function_code: 3,
      byte_order: 'big_endian',
    },
    data_5: {
      name: '',
      start_register: 0,
      num_registers: 1,
      is_used: false,
      data_type: 'int32',
      function_code: 3,
      byte_order: 'big_endian',
    },
  };
  expandedChannels: { [key: number]: boolean } = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  };

  // Data for dropdowns
  protocols: Protocol[] = [];
  locations: Location[] = [];
  manufacturers: any[] = [];

  // Form data object
  dataScale: any = {
    name: '',
    model: '',
    direction: 'IMPORT',
    location_id: null,
    manufacturer_id: null,
    protocol_id: null,
    is_active: true,
  };

  ProtocolType = ProtocolType;
  ScaleType = ScaleType;

  filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'scales.name',
      type: 'text',
      placeholder: 'scales.name',
    },
    {
      key: 'locationId',
      label: 'scales.location',
      type: 'select',
      placeholder: 'scales.selectLocation',
      options: [],
    },
    {
      key: 'manufacturerId',
      label: 'scales.manufacturer',
      type: 'select',
      placeholder: 'scales.selectManufacturer',
      options: [],
    },
    {
      key: 'protocolId',
      label: 'scales.protocol',
      type: 'select',
      placeholder: 'scales.selectProtocol',
      options: [],
    },
    {
      key: 'model',
      label: 'scales.model',
      type: 'text',
      placeholder: 'scales.enterModel',
    },
    {
      key: 'direction',
      label: 'scales.direction',
      type: 'select',
      placeholder: 'scales.selectDirection',
      options: [
        { label: 'scales.import', value: 'IMPORT' },
        { label: 'scales.export', value: 'EXPORT' },
      ],
    },
    {
      key: 'isActive',
      label: 'common.status',
      type: 'select',
      placeholder: 'common.status',
      options: [
        { label: 'common.active', value: true },
        { label: 'common.inactive', value: false },
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
    private locationService: LocationService,
    private protocolService: ProtocolService,
    private manufacturerService: ScaleManufacturerService,
    private pageActionService: PageActionService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadLocations();
    this.loadProtocols();
    this.loadManufacturers();
    this.loadScales();

    // Subscribe to add new action
    this.pageActionService.addNew$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.openAddModal();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadLocations(): Promise<void> {
    try {
      const response = await this.locationService.getLocations();
      this.locations = response.data || [];
      // Update filter options
      const locationField = this.filterFields.find(
        (f) => f.key === 'locationId'
      );
      if (locationField) {
        locationField.options = this.locations.map((loc) => ({
          label: loc.name || '',
          value: loc.id,
        }));
      }
    } catch (error) {
      this.locations = [];
    }
  }

  async loadProtocols(): Promise<void> {
    try {
      const data = await this.protocolService.getProtocols({
        status: 'active',
      });
      this.protocols = Array.isArray(data) ? data : data.data;

      // Update filter options
      const protocolField = this.filterFields.find(
        (f) => f.key === 'protocolId'
      );
      if (protocolField) {
        protocolField.options = this.protocols.map((p) => ({
          label: p.name || '',
          value: p.id,
        }));
      }
    } catch (error) {
      this.protocols = [];
    }
  }

  async loadManufacturers(): Promise<void> {
    try {
      const response = await this.manufacturerService.getScaleManufacturers({
        is_active: true,
      });
      this.manufacturers = response.data;

      // Update filter options
      const manufacturerField = this.filterFields.find(
        (f) => f.key === 'manufacturerId'
      );
      if (manufacturerField) {
        manufacturerField.options = this.manufacturers.map((m) => ({
          label: m.name || '',
          value: m.id,
        }));
      }
    } catch (error) {
      this.manufacturers = [];
    }
  }

  async loadScales(): Promise<void> {
    this.loading = true;
    try {
      // Build query params according to API
      const params: any = {
        page: this.pageIndex - 1, // API uses 0-indexed
        size: this.pageSize,
      };

      if (this.filterData.search) {
        params.search = this.filterData.search;
      }
      if (this.filterData.locationId) {
        params.locationId = this.filterData.locationId;
      }
      if (this.filterData.manufacturerId) {
        params.manufacturerId = this.filterData.manufacturerId;
      }
      if (this.filterData.protocolId) {
        params.protocolId = this.filterData.protocolId;
      }
      if (this.filterData.model) {
        params.model = this.filterData.model;
      }
      if (this.filterData.direction) {
        params.direction = this.filterData.direction;
      }
      if (
        this.filterData.isActive !== undefined &&
        this.filterData.isActive !== null
      ) {
        params.isActive = this.filterData.isActive;
      }
      if (this.filterData.sort) {
        params.sort = this.filterData.sort;
      }

      const data = await this.scaleService.getScales(params);
      this.scales = data.data;
      this.total = data.total;
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

  /**
   * Normalize scale data to dataScale format using spread operator
   * This makes it easier to maintain when Scale model changes
   */
  private normalizeScaleToDataScale(scale: Scale | null): any {
    if (!scale) {
      return {
        name: '',
        model: '',
        direction: 'IMPORT',
        location_id: null,
        manufacturer_id: null,
        protocol_id: null,
        is_active: true,
      };
    }

    return {
      name: scale.name || '',
      model: scale.model || '',
      direction: scale.direction || 'IMPORT',
      location_id: scale.location_id ?? scale.locationId ?? null,
      manufacturer_id: scale.manufacturer_id ?? scale.manufacturerId ?? null,
      protocol_id: scale.protocol_id ?? scale.protocolId ?? null,
      is_active: scale.is_active !== undefined ? scale.is_active : true,
    };
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedScale = null;
    this.dataScale = this.normalizeScaleToDataScale(null);
    this.resetConfig();
    this.isModalVisible = true;
  }

  async viewScale(scale: Scale): Promise<void> {
    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedScale = scale;

    // Load full scale details with config
    if (scale.id) {
      const fullScale = await this.scaleService.getScaleById(scale.id);
      if (fullScale) {
        this.selectedScale = fullScale;
        this.dataScale = this.normalizeScaleToDataScale(fullScale);

        // Load config from scale_config in response
        if (fullScale.scale_config) {
          this.loadConfigFromScaleConfig(fullScale.scale_config);
        } else {
          await this.loadScaleConfig(scale.id);
        }
      } else {
        this.dataScale = this.normalizeScaleToDataScale(scale);
        await this.loadScaleConfig(scale.id);
      }
    } else {
      this.dataScale = this.normalizeScaleToDataScale(scale);
      this.resetConfig();
    }
    this.isModalVisible = true;
  }

  async openEditModal(scale: Scale): Promise<void> {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedScale = scale;

    // Load full scale details with config
    if (scale.id) {
      const fullScale = await this.scaleService.getScaleById(scale.id);
      if (fullScale) {
        this.selectedScale = fullScale;
        this.dataScale = this.normalizeScaleToDataScale(fullScale);

        // Load config from scale_config in response
        if (fullScale.scale_config) {
          this.loadConfigFromScaleConfig(fullScale.scale_config);
        } else {
          await this.loadScaleConfig(scale.id);
        }
      } else {
        this.dataScale = this.normalizeScaleToDataScale(scale);
        await this.loadScaleConfig(scale.id);
      }
    } else {
      this.dataScale = this.normalizeScaleToDataScale(scale);
      this.resetConfig();
    }

    this.isModalVisible = true;
  }

  onProtocolChange(protocolId: number | null): void {
    if (!protocolId) {
      this.dataScale.protocol_id = null;
      return;
    }

    const protocol = this.protocols.find((p) => p.id === protocolId);
    if (protocol) {
      this.dataScale.protocol_id = protocolId;
      // Update scaleConfig protocol to match
      this.scaleConfig.protocol = protocol.code || protocol.type;

      // Set defaults for the selected protocol type
      if (
        protocol.type === ProtocolType.MODBUS_TCP ||
        protocol.code === 'MODBUS_TCP'
      ) {
        this.scaleConfig.conn_params = {
          ...this.scaleConfig.conn_params,
          ip: '',
          port: 502,
        };
      } else if (
        protocol.type === ProtocolType.MODBUS_RTU ||
        protocol.code === 'MODBUS_RTU'
      ) {
        this.scaleConfig.conn_params = {
          ...this.scaleConfig.conn_params,
          com_port: '',
          baud_rate: 9600,
          data_bits: 8,
          stop_bits: 1,
          parity: 'even',
          unit_id: 1,
        };
      }
    } else {
      this.dataScale.protocol_id = null;
    }
  }

  onProtocolConfigChange(protocolCode: string): void {
    this.scaleConfig.protocol = protocolCode;

    // Update protocol_id if protocol code matches
    const protocol = this.protocols.find((p) => p.code === protocolCode);
    if (protocol) {
      this.dataScale.protocol_id = protocol.id;
    }

    // Set defaults for the selected protocol type
    if (protocolCode === 'MODBUS_TCP') {
      this.scaleConfig.conn_params = {
        ...this.scaleConfig.conn_params,
        ip: '',
        port: 502,
      };
    } else if (protocolCode === 'MODBUS_RTU') {
      this.scaleConfig.conn_params = {
        ...this.scaleConfig.conn_params,
        com_port: '',
        baud_rate: 9600,
        data_bits: 8,
        stop_bits: 1,
        parity: 'even',
        unit_id: 1,
      };
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

  async saveScale(): Promise<void> {
    // Validation
    if (!this.dataScale.name) {
      this.toastr.warning('Vui lòng nhập tên cân');
      return;
    }

    if (!this.dataScale.location_id) {
      this.toastr.warning('Vui lòng chọn vị trí');
      return;
    }

    if (!this.scaleConfig.protocol) {
      this.toastr.warning('Vui lòng chọn giao thức');
      return;
    }

    if (
      !this.scaleConfig.poll_interval ||
      this.scaleConfig.poll_interval < 100
    ) {
      this.toastr.warning('Chu kỳ Poll phải tối thiểu 100ms');
      return;
    }

    // Validate connection params based on protocol
    const protocol = this.protocols.find(
      (p) => p.code === this.scaleConfig.protocol
    );
    if (protocol) {
      const connectionType = protocol.connection_type || protocol.type;
      if (
        connectionType === 'TCP' ||
        this.scaleConfig.protocol === 'MODBUS_TCP'
      ) {
        if (
          !this.scaleConfig.conn_params?.ip ||
          !this.scaleConfig.conn_params?.port
        ) {
          this.toastr.warning(
            'Vui lòng nhập đầy đủ thông tin kết nối (IP và Port)'
          );
          return;
        }
      } else if (
        connectionType === 'RTU' ||
        this.scaleConfig.protocol === 'MODBUS_RTU'
      ) {
        if (
          !this.scaleConfig.conn_params?.com_port ||
          !this.scaleConfig.conn_params?.baud_rate
        ) {
          this.toastr.warning(
            'Vui lòng nhập đầy đủ thông tin kết nối (COM Port và Baud Rate)'
          );
          return;
        }
      }
    }

    this.saving = true;
    try {
      // Build scale data with config in one request
      const data: any = {
        name: this.dataScale.name,
        model: this.dataScale.model || undefined,
        direction: this.dataScale.direction || 'IMPORT',
        location_id: this.dataScale.location_id,
        manufacturer_id: this.dataScale.manufacturer_id,
        protocol_id: this.dataScale.protocol_id,
        protocol: this.scaleConfig.protocol,
        is_active:
          this.dataScale.is_active !== undefined
            ? this.dataScale.is_active
            : true,
        poll_interval: this.scaleConfig.poll_interval,
      };

      // Build conn_params based on protocol type
      const protocol = this.protocols.find(
        (p) => p.code === this.scaleConfig.protocol
      );
      const connectionType = protocol?.connection_type || protocol?.type;

      if (
        connectionType === 'TCP' ||
        this.scaleConfig.protocol === 'MODBUS_TCP'
      ) {
        data.conn_params = {
          ip: this.scaleConfig.conn_params.ip,
          port: this.scaleConfig.conn_params.port,
        };
      } else if (
        connectionType === 'RTU' ||
        this.scaleConfig.protocol === 'MODBUS_RTU'
      ) {
        data.conn_params = {
          com_port: this.scaleConfig.conn_params.com_port,
          baud_rate: this.scaleConfig.conn_params.baud_rate,
          data_bits: this.scaleConfig.conn_params.data_bits,
          stop_bits: this.scaleConfig.conn_params.stop_bits,
          parity: this.scaleConfig.conn_params.parity,
          unit_id: this.scaleConfig.conn_params.unit_id,
        };
      } else {
        data.conn_params = this.scaleConfig.conn_params || {};
      }

      // Add data channels
      for (let i = 1; i <= 5; i++) {
        const channel = this.scaleConfig[`data_${i}`];
        if (channel && channel.is_used) {
          data[`data_${i}`] = {
            name: channel.name || '',
            start_register:
              channel.start_register || channel.start_registers || 0,
            num_registers: channel.num_registers || 1,
            data_type: channel.data_type || 'int32',
            function_code: channel.function_code || 3,
            byte_order: channel.byte_order || 'big_endian',
            is_used: true,
          };
        } else {
          data[`data_${i}`] = null;
        }
      }

      if (this.isEditMode) {
        // Update scale with config
        const updated = await this.scaleService.updateScale(
          this.selectedScale?.id!,
          data
        );
        if (updated) {
          this.toastr.success('Cập nhật cân thành công');
          this.isModalVisible = false;
          this.isViewMode = false;
          await this.loadScales();
        } else {
          this.toastr.error('Cập nhật cân thất bại');
        }
      } else {
        // Create scale with config
        const created = await this.scaleService.createScale(data);
        if (created && created.id) {
          this.toastr.success('Tạo cân thành công');
          this.isModalVisible = false;
          this.isViewMode = false;
          await this.loadScales();
        } else {
          this.toastr.error('Tạo cân thất bại');
        }
      }
    } catch (error) {
      this.toastr.error('Có lỗi xảy ra');
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

  closeViewModal(): void {
    this.isModalVisible = false;
    this.isViewMode = false;
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

  loadConfigFromScaleConfig(scaleConfig: any): void {
    if (!scaleConfig) {
      this.resetConfig();
      return;
    }

    // Build conn_params with defaults for both TCP and RTU
    const defaultConnParams = {
      ip: '',
      port: 502,
      com_port: '',
      baud_rate: 9600,
      data_bits: 8,
      stop_bits: 1,
      parity: 'even',
      unit_id: 1,
      ...scaleConfig.conn_params,
    };

    this.scaleConfig = {
      protocol: scaleConfig.protocol || 'MODBUS_TCP',
      poll_interval: scaleConfig.poll_interval || 1000,
      conn_params: defaultConnParams,
      data_1: scaleConfig.data_1 || {
        name: '',
        start_register:
          scaleConfig.data_1?.start_register ||
          scaleConfig.data_1?.start_registers ||
          0,
        num_registers: scaleConfig.data_1?.num_registers || 1,
        is_used: scaleConfig.data_1?.is_used || false,
        data_type: scaleConfig.data_1?.data_type || 'int32',
        function_code: scaleConfig.data_1?.function_code || 3,
        byte_order: scaleConfig.data_1?.byte_order || 'big_endian',
      },
      data_2: scaleConfig.data_2 || {
        name: '',
        start_register:
          scaleConfig.data_2?.start_register ||
          scaleConfig.data_2?.start_registers ||
          0,
        num_registers: scaleConfig.data_2?.num_registers || 1,
        is_used: scaleConfig.data_2?.is_used || false,
        data_type: scaleConfig.data_2?.data_type || 'int32',
        function_code: scaleConfig.data_2?.function_code || 3,
        byte_order: scaleConfig.data_2?.byte_order || 'big_endian',
      },
      data_3: scaleConfig.data_3 || {
        name: '',
        start_register:
          scaleConfig.data_3?.start_register ||
          scaleConfig.data_3?.start_registers ||
          0,
        num_registers: scaleConfig.data_3?.num_registers || 1,
        is_used: scaleConfig.data_3?.is_used || false,
        data_type: scaleConfig.data_3?.data_type || 'int32',
        function_code: scaleConfig.data_3?.function_code || 3,
        byte_order: scaleConfig.data_3?.byte_order || 'big_endian',
      },
      data_4: scaleConfig.data_4 || {
        name: '',
        start_register:
          scaleConfig.data_4?.start_register ||
          scaleConfig.data_4?.start_registers ||
          0,
        num_registers: scaleConfig.data_4?.num_registers || 1,
        is_used: scaleConfig.data_4?.is_used || false,
        data_type: scaleConfig.data_4?.data_type || 'int32',
        function_code: scaleConfig.data_4?.function_code || 3,
        byte_order: scaleConfig.data_4?.byte_order || 'big_endian',
      },
      data_5: scaleConfig.data_5 || {
        name: '',
        start_register:
          scaleConfig.data_5?.start_register ||
          scaleConfig.data_5?.start_registers ||
          0,
        num_registers: scaleConfig.data_5?.num_registers || 1,
        is_used: scaleConfig.data_5?.is_used || false,
        data_type: scaleConfig.data_5?.data_type || 'int32',
        function_code: scaleConfig.data_5?.function_code || 3,
        byte_order: scaleConfig.data_5?.byte_order || 'big_endian',
      },
    };

    // Expand channels that are in use
    for (let i = 1; i <= 5; i++) {
      const channel = this.scaleConfig[`data_${i}`];
      if (channel && channel.is_used) {
        this.expandedChannels[i] = true;
      } else {
        this.expandedChannels[i] = false;
      }
    }
  }

  async loadScaleConfig(scaleId: number): Promise<void> {
    try {
      const config = await this.scaleService.getScaleConfig(scaleId);
      let configData: any = null;

      if (config && config.success === true && config.data) {
        configData = config.data;
      } else if (config) {
        configData = config;
      }

      if (configData) {
        // Build conn_params with defaults for both TCP and RTU
        const defaultConnParams = {
          ip: '',
          port: 502,
          com_port: '',
          baud_rate: 9600,
          data_bits: 8,
          stop_bits: 1,
          parity: 'even',
          unit_id: 1,
          ...configData.conn_params,
        };

        this.scaleConfig = {
          protocol: configData.protocol || 'MODBUS_TCP',
          poll_interval: configData.poll_interval || 1000,
          conn_params: defaultConnParams,
          data_1: configData.data_1 || {
            name: '',
            start_register:
              configData.data_1?.start_register ||
              configData.data_1?.start_registers ||
              0,
            num_registers: configData.data_1?.num_registers || 1,
            is_used: configData.data_1?.is_used || false,
            data_type: configData.data_1?.data_type || 'int32',
            function_code: configData.data_1?.function_code || 3,
            byte_order: configData.data_1?.byte_order || 'big_endian',
          },
          data_2: configData.data_2 || {
            name: '',
            start_register:
              configData.data_2?.start_register ||
              configData.data_2?.start_registers ||
              0,
            num_registers: configData.data_2?.num_registers || 1,
            is_used: configData.data_2?.is_used || false,
            data_type: configData.data_2?.data_type || 'int32',
            function_code: configData.data_2?.function_code || 3,
            byte_order: configData.data_2?.byte_order || 'big_endian',
          },
          data_3: configData.data_3 || {
            name: '',
            start_register:
              configData.data_3?.start_register ||
              configData.data_3?.start_registers ||
              0,
            num_registers: configData.data_3?.num_registers || 1,
            is_used: configData.data_3?.is_used || false,
            data_type: configData.data_3?.data_type || 'int32',
            function_code: configData.data_3?.function_code || 3,
            byte_order: configData.data_3?.byte_order || 'big_endian',
          },
          data_4: configData.data_4 || {
            name: '',
            start_register:
              configData.data_4?.start_register ||
              configData.data_4?.start_registers ||
              0,
            num_registers: configData.data_4?.num_registers || 1,
            is_used: configData.data_4?.is_used || false,
            data_type: configData.data_4?.data_type || 'int32',
            function_code: configData.data_4?.function_code || 3,
            byte_order: configData.data_4?.byte_order || 'big_endian',
          },
          data_5: configData.data_5 || {
            name: '',
            start_register:
              configData.data_5?.start_register ||
              configData.data_5?.start_registers ||
              0,
            num_registers: configData.data_5?.num_registers || 1,
            is_used: configData.data_5?.is_used || false,
            data_type: configData.data_5?.data_type || 'int32',
            function_code: configData.data_5?.function_code || 3,
            byte_order: configData.data_5?.byte_order || 'big_endian',
          },
        };

        // Expand channels that are in use
        for (let i = 1; i <= 5; i++) {
          const channel = this.scaleConfig[`data_${i}`];
          if (channel && channel.is_used) {
            this.expandedChannels[i] = true;
          } else {
            this.expandedChannels[i] = false;
          }
        }
      } else {
        this.resetConfig();
      }
    } catch (error) {
      console.error('Error loading scale config:', error);
      this.resetConfig();
    }
  }

  async openConfigModal(scale: Scale): Promise<void> {
    if (!scale.id) return;

    this.selectedScale = scale;
    this.isConfigModalVisible = true;

    try {
      const config = await this.scaleService.getScaleConfig(scale.id);
      if (config && config.success === true && config.data) {
        const configData = config.data;
        // Build conn_params with defaults for both TCP and RTU
        const defaultConnParams = {
          ip: '',
          port: 502,
          com_port: '',
          baud_rate: 9600,
          data_bits: 8,
          stop_bits: 1,
          parity: 'even',
          unit_id: 1,
          ...configData.conn_params,
        };

        this.scaleConfig = {
          protocol: configData.protocol || 'MODBUS_TCP',
          poll_interval: configData.poll_interval || 1000,
          conn_params: defaultConnParams,
          data_1: configData.data_1 || {
            name: '',
            start_register: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'int32',
            function_code: 3,
            byte_order: 'big_endian',
          },
          data_2: configData.data_2 || {
            name: '',
            start_register: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'int32',
            function_code: 3,
            byte_order: 'big_endian',
          },
          data_3: configData.data_3 || {
            name: '',
            start_register: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'int32',
            function_code: 3,
            byte_order: 'big_endian',
          },
          data_4: configData.data_4 || {
            name: '',
            start_register: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'int32',
            function_code: 3,
            byte_order: 'big_endian',
          },
          data_5: configData.data_5 || {
            name: '',
            start_register: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'int32',
            function_code: 3,
            byte_order: 'big_endian',
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
        // Build conn_params with defaults for both TCP and RTU
        const defaultConnParams = {
          ip: '',
          port: 502,
          com_port: '',
          baud_rate: 9600,
          data_bits: 8,
          stop_bits: 1,
          parity: 'even',
          unit_id: 1,
          ...configData.conn_params,
        };

        this.scaleConfig = {
          protocol: configData.protocol || 'MODBUS_TCP',
          poll_interval: configData.poll_interval || 1000,
          conn_params: defaultConnParams,
          data_1: configData.data_1 || {
            name: '',
            start_register: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'int32',
            function_code: 3,
            byte_order: 'big_endian',
          },
          data_2: configData.data_2 || {
            name: '',
            start_register: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'int32',
            function_code: 3,
            byte_order: 'big_endian',
          },
          data_3: configData.data_3 || {
            name: '',
            start_register: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'int32',
            function_code: 3,
            byte_order: 'big_endian',
          },
          data_4: configData.data_4 || {
            name: '',
            start_register: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'int32',
            function_code: 3,
            byte_order: 'big_endian',
          },
          data_5: configData.data_5 || {
            name: '',
            start_register: 0,
            num_registers: 1,
            is_used: false,
            data_type: 'int32',
            function_code: 3,
            byte_order: 'big_endian',
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

  async saveConfig(scaleId: number): Promise<void> {
    if (!scaleId) return;

    if (!this.scaleConfig.protocol || !this.scaleConfig.conn_params) {
      return;
    }

    if (this.scaleConfig.poll_interval < 100) {
      return;
    }

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
            name: channel.name || '',
            start_register:
              channel.start_register || channel.start_registers || 0,
            num_registers: channel.num_registers || 1,
            data_type: channel.data_type || 'int32',
            function_code: channel.function_code || 3,
            byte_order: channel.byte_order || 'big_endian',
            is_used: true,
          };
        } else {
          configData[`data_${i}`] = { is_used: false };
        }
      }

      await this.scaleService.updateScaleConfig(scaleId, configData);
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  getChannelLabel(channelNum: number): string {
    const channel = this.scaleConfig[`data_${channelNum}`];
    const channelLabel =
      this.translate.instant('scales.channel') + ' ' + channelNum;
    if (channel?.is_used && channel?.name) {
      return `${channelLabel}: ${channel.name}`;
    }
    return `${channelLabel}: ${this.translate.instant('scales.notConfigured')}`;
  }

  isModbusTcp(): boolean {
    if (this.scaleConfig.protocol === 'MODBUS_TCP') {
      return true;
    }
    const protocol = this.protocols.find(
      (p) => p.code === this.scaleConfig.protocol
    );
    return (
      protocol?.type === 'MODBUS_TCP' ||
      protocol?.type === ProtocolType.MODBUS_TCP
    );
  }

  isModbusRtu(): boolean {
    if (this.scaleConfig.protocol === 'MODBUS_RTU') {
      return true;
    }
    const protocol = this.protocols.find(
      (p) => p.code === this.scaleConfig.protocol
    );
    return (
      protocol?.type === 'MODBUS_RTU' ||
      protocol?.type === ProtocolType.MODBUS_RTU
    );
  }
}
