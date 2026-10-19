import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NzFormatEmitEvent, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
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
  totalScales = 0;
  activeScales = 0;
  inactiveScales = 0;
  openTree = true;
  nodes: NzTreeNodeOptions[] = [];
  searchValue = '';
  expandKeys: string[] = [];
  isModalVisible = false;
  isEditMode = false;
  isViewMode = false;
  saving = false;
  selectedScale: Scale | null = null;
  filterData: any = {};
  sidebarVisible = true;
  sidebarSize = 260; // Pixel (scales có tree nên cần rộng hơn)

  isConfigModalVisible = false;
  savingConfig = false;
  scaleConfig: any = {
    protocol: 'MODBUS_TCP',
    poll_interval: 1000,
    conn_params: {
      ip: '192.168.1.10',
      port: 502,
      unit_id: 1,
      response_timeout_ms: 5000,
      com_port: 'COM3',
      baud_rate: 9600,
      data_bits: 8,
      stop_bits: 1,
      parity: 'NONE',
      rack: 0,
      slot: 1,
      controller_type: 'S7_1200',
      connect_timeout_ms: 5000,
      read_timeout_ms: 5000,
      device_id: '07',
      device_id_width: 2,
      reconnect_delay_ms: 5000,
      offline_threshold_ms: 60000,
      command_prefix: '!',
      command_terminator: '\\r',
    },
    data_1: {
      name: 'Weight',
      is_used: true,
      function_code: 3,
      start_registers: 0,
      num_registers: 2,
      data_type: 'FLOAT32',
      byte_order: 'BIG_ENDIAN',
      word_order: 'BIG_ENDIAN',
      decimal_places: 2,
      tag_address: '%DB1:0:REAL',
      command: 'FL',
      payload: '',
      mode: 'ASCII',
      response_type: 'FLOAT32',
    },
    data_2: {
      name: '',
      is_used: false,
      function_code: 3,
      start_registers: 0,
      num_registers: 2,
      data_type: 'FLOAT32',
      byte_order: 'BIG_ENDIAN',
      word_order: 'BIG_ENDIAN',
      decimal_places: 2,
      tag_address: '%DB1:0:REAL',
      command: 'NT',
      payload: '',
      mode: 'ASCII',
      response_type: 'FLOAT32',
    },
    data_3: {
      name: '',
      is_used: false,
      function_code: 3,
      start_registers: 0,
      num_registers: 2,
      data_type: 'FLOAT32',
      byte_order: 'BIG_ENDIAN',
      word_order: 'BIG_ENDIAN',
      decimal_places: 2,
      tag_address: '%DB1:0:REAL',
      command: 'FL',
      payload: '',
      mode: 'ASCII',
      response_type: 'FLOAT32',
    },
    data_4: {
      name: '',
      is_used: false,
      function_code: 3,
      start_registers: 0,
      num_registers: 2,
      data_type: 'FLOAT32',
      byte_order: 'BIG_ENDIAN',
      word_order: 'BIG_ENDIAN',
      decimal_places: 2,
      tag_address: '%DB1:0:REAL',
      command: 'FL',
      payload: '',
      mode: 'ASCII',
      response_type: 'FLOAT32',
    },
    data_5: {
      name: '',
      is_used: false,
      function_code: 3,
      start_registers: 0,
      num_registers: 2,
      data_type: 'FLOAT32',
      byte_order: 'BIG_ENDIAN',
      word_order: 'BIG_ENDIAN',
      decimal_places: 2,
      tag_address: '%DB1:0:REAL',
      command: 'FL',
      payload: '',
      mode: 'ASCII',
      response_type: 'FLOAT32',
    },
  };
  expandedChannels: { [key: number]: boolean } = {
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
  };

  protocols: Protocol[] = [];
  locations: Location[] = [];
  manufacturers: any[] = [];

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
      type: 'multiselect',
      placeholder: 'scales.selectManufacturer',
      options: [],
    },
    {
      key: 'protocolId',
      label: 'scales.protocol',
      type: 'multiselect',
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
    { key: 'code', title: 'table.code', width: '80px' },
    { key: 'name', title: 'table.title' },
    { key: 'type', title: 'scales.type', width: '120px' },
    { key: 'status', title: 'common.status', width: '120px' },
    { key: 'createdAt', title: 'table.dateCreated', width: '80px' },
  ];

  constructor(
    private scaleService: ScaleService,
    private locationService: LocationService,
    private protocolService: ProtocolService,
    private manufacturerService: ScaleManufacturerService,
    private pageActionService: PageActionService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadLocations();
    this.loadProtocols();
    this.loadManufacturers();
    this.loadScales();

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
      const locationField = this.filterFields.find(
        (f) => f.key === 'locationId'
      );
      if (locationField) {
        locationField.options = this.locations.map((location) => ({
          label: location.name || '',
          value: location.id,
        }));
      }

      this.nodes = this.buildLocationTreeNodes(this.locations);
      this.expandKeys = this.nodes.map((n) => String(n.key));
    } catch (error) {
      this.locations = [];
    }
  }

  private buildLocationTreeNodes(locations: Location[]): NzTreeNodeOptions[] {
    const mapLocationToNode = (location: Location): NzTreeNodeOptions => ({
      key: String(location.id),
      title: location.name,
      children: (location.children || []).map((child) =>
        mapLocationToNode(child)
      ),
      isLeaf: !location.children || location.children.length === 0,
      expanded: true,
    });

    return locations.map((location) => mapLocationToNode(location));
  }

  private findAllParentIds(
    locationId: number,
    locations: Location[]
  ): number[] {
    const parentIds: number[] = [];

    const findLocationAndParent = (
      targetId: number,
      locationList: Location[],
      currentParentId: number | null = null
    ): boolean => {
      for (const location of locationList) {
        if (location.id === targetId) {
          if (currentParentId !== null) {
            parentIds.push(currentParentId);
            findLocationAndParent(currentParentId, this.locations, null);
          }
          return true;
        }
        if (location.children && location.children.length > 0) {
          if (findLocationAndParent(targetId, location.children, location.id)) {
            if (currentParentId !== null) {
              parentIds.push(currentParentId);
              findLocationAndParent(currentParentId, this.locations, null);
            }
            return true;
          }
        }
      }
      return false;
    };

    findLocationAndParent(locationId, locations);
    return parentIds;
  }

  private findAllChildIds(locationId: number, locations: Location[]): number[] {
    const childIds: number[] = [];

    const findLocationAndChildren = (
      targetId: number,
      locationList: Location[]
    ): boolean => {
      for (const location of locationList) {
        if (location.id === targetId) {
          if (location.children && location.children.length > 0) {
            location.children.forEach((child) => {
              if (child.id !== undefined) {
                childIds.push(child.id);
                findLocationAndChildren(child.id, this.locations);
              }
            });
          }
          return true;
        }
        if (location.children && location.children.length > 0) {
          if (findLocationAndChildren(targetId, location.children)) {
            return true;
          }
        }
      }
      return false;
    };

    findLocationAndChildren(locationId, locations);
    return childIds;
  }

  async loadProtocols(): Promise<void> {
    try {
      const data = await this.protocolService.getProtocols({
        status: 'active',
      });
      this.protocols = Array.isArray(data) ? data : data.data;

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
      this.manufacturers = response.data || [];

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
      const params: any = {
        page: this.pageIndex - 1,
        size: this.pageSize,
      };

      if (this.filterData.search) {
        params.search = this.filterData.search;
      }
      if (this.filterData.locationId) {
        const locationId = this.filterData.locationId;
        params.locationId = Array.isArray(locationId)
          ? locationId
          : [locationId];
      }
      if (this.filterData.manufacturerId) {
        const manufacturerId = this.filterData.manufacturerId;
        params.manufacturerId = Array.isArray(manufacturerId)
          ? manufacturerId
          : [manufacturerId];
      }
      if (this.filterData.protocolId) {
        const protocolId = this.filterData.protocolId;
        params.protocolId = Array.isArray(protocolId)
          ? protocolId
          : [protocolId];
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

      const result = await this.scaleService.getScales(params);
      this.scales = result.data || [];
      this.total = result.total || 0;
      this.totalScales = result.total_scales ?? this.total;
      this.activeScales =
        result.active_scales ??
        this.scales.filter((scale) => scale.is_active === true).length;
      this.inactiveScales =
        result.inactive_scales ??
        this.scales.filter((scale) => scale.is_active === false).length;
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

  filterByStatus(isActive: boolean | null): void {
    if (isActive === null) {
      this.filterData.isActive = undefined;
    } else {
      this.filterData.isActive = isActive;
    }
    this.pageIndex = 1;
    this.loadScales();
  }

  nzEvent(event: NzFormatEmitEvent): void {
    if (event.eventName !== 'check') {
      return;
    }

    const checkedKeys = event.checkedKeys || [];
    let locationIds: number[] = [];

    if (Array.isArray(checkedKeys)) {
      const checkedIds = checkedKeys
        .map((key: any) => {
          if (typeof key === 'string') {
            const id = Number(key);
            return !isNaN(id) ? id : null;
          }
          if (key && typeof key === 'object' && key.key) {
            const id = Number(key.key);
            return !isNaN(id) ? id : null;
          }
          if (typeof key === 'number') {
            return key;
          }
          return null;
        })
        .filter((id: number | null) => id !== null && !isNaN(id)) as number[];

      const allIds = new Set<number>();

      checkedIds.forEach((checkedId) => {
        allIds.add(checkedId);
        const parentIds = this.findAllParentIds(checkedId, this.locations);
        parentIds.forEach((parentId) => allIds.add(parentId));
        const childIds = this.findAllChildIds(checkedId, this.locations);
        childIds.forEach((childId) => allIds.add(childId));
      });

      locationIds = Array.from(allIds);
    }

    this.filterData.locationId = locationIds.length > 0 ? locationIds : null;
    this.pageIndex = 1;
    this.loadScales();
  }

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
      protocol_id: scale.protocol_id ?? scale.protocolId ?? (
        typeof scale.protocol === 'string'
          ? (this.protocols.find((p) => p.code === scale.protocol)?.id ?? null)
          : null
      ),
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

    if (scale.id) {
      const fullScale = await this.scaleService.getScaleById(scale.id);
      if (fullScale) {
        this.selectedScale = fullScale;
        this.dataScale = this.normalizeScaleToDataScale(fullScale);

        const configData = fullScale.scale_config || (fullScale.protocol ? fullScale : null);
        if (configData) {
          this.loadConfigFromScaleConfig(configData);
        } else {
          this.resetConfig();
        }
      } else {
        this.dataScale = this.normalizeScaleToDataScale(scale);
        const configData = scale.scale_config || (scale.protocol ? scale : null);
        if (configData) {
          this.loadConfigFromScaleConfig(configData);
        } else {
          this.resetConfig();
        }
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

    if (scale.id) {
      const fullScale = await this.scaleService.getScaleById(scale.id);
      if (fullScale) {
        this.selectedScale = fullScale;
        this.dataScale = this.normalizeScaleToDataScale(fullScale);

        const configData = fullScale.scale_config || (fullScale.protocol ? fullScale : null);
        if (configData) {
          this.loadConfigFromScaleConfig(configData);
        } else {
          this.resetConfig();
        }
      } else {
        this.dataScale = this.normalizeScaleToDataScale(scale);
        const configData = scale.scale_config || (scale.protocol ? scale : null);
        if (configData) {
          this.loadConfigFromScaleConfig(configData);
        } else {
          this.resetConfig();
        }
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
      const code = protocol.code || protocol.type || 'MODBUS_TCP';
      this.applyProtocolDefaults(code);
    } else {
      this.dataScale.protocol_id = null;
    }
  }

  onProtocolConfigChange(protocolCode: string): void {
    if (!protocolCode) return;
    this.scaleConfig.protocol = protocolCode;

    const protocol = this.protocols.find((p) => p.code === protocolCode);
    if (protocol) {
      this.dataScale.protocol_id = protocol.id;
    }
    this.applyProtocolDefaults(protocolCode);
  }

  applyProtocolDefaults(protocolCode: string): void {
    this.scaleConfig.protocol = protocolCode;
    const cp = this.scaleConfig.conn_params || {};

    if (protocolCode === 'MODBUS_TCP') {
      this.scaleConfig.conn_params = {
        ...cp,
        ip: cp.ip || '192.168.1.10',
        port: cp.port || 502,
        unit_id: cp.unit_id ?? 1,
        response_timeout_ms: cp.response_timeout_ms ?? 5000,
      };
    } else if (protocolCode === 'MODBUS_RTU') {
      this.scaleConfig.conn_params = {
        ...cp,
        com_port: cp.com_port || 'COM3',
        baud_rate: cp.baud_rate || 9600,
        data_bits: cp.data_bits ?? 8,
        stop_bits: cp.stop_bits ?? 1,
        parity: cp.parity || 'NONE',
        unit_id: cp.unit_id ?? 1,
        response_timeout_ms: cp.response_timeout_ms ?? 3000,
      };
    } else if (protocolCode === 'SIEMENS_S7') {
      this.scaleConfig.conn_params = {
        ...cp,
        ip: cp.ip || '192.168.1.20',
        port: cp.port || 102,
        rack: cp.rack ?? 0,
        slot: cp.slot ?? 1,
        controller_type: cp.controller_type || 'S7_1200',
        connect_timeout_ms: cp.connect_timeout_ms ?? 5000,
        read_timeout_ms: cp.read_timeout_ms ?? 5000,
      };
    } else if (protocolCode === 'SABUS') {
      this.scaleConfig.conn_params = {
        ...cp,
        com_port: cp.com_port || 'COM5',
        baud_rate: cp.baud_rate || 9600,
        data_bits: cp.data_bits ?? 8,
        stop_bits: cp.stop_bits ?? 1,
        parity: cp.parity || 'NONE',
        device_id: cp.device_id || '07',
        device_id_width: cp.device_id_width ?? 2,
        response_timeout_ms: cp.response_timeout_ms ?? 3000,
        reconnect_delay_ms: cp.reconnect_delay_ms ?? 5000,
        offline_threshold_ms: cp.offline_threshold_ms ?? 60000,
        command_prefix: cp.command_prefix || '!',
        command_terminator: cp.command_terminator || '\\r',
      };
    } else if (protocolCode === 'SBUS') {
      this.scaleConfig.conn_params = {
        ...cp,
        com_port: cp.com_port || 'COM4',
        baud_rate: cp.baud_rate || 9600,
        device_id: cp.device_id ?? 1,
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

    if (this.isModbusTcp()) {
      if (
        !this.scaleConfig.conn_params?.ip ||
        !this.scaleConfig.conn_params?.port
      ) {
        this.toastr.warning('Vui lòng nhập đầy đủ IP và Port cho Modbus TCP');
        return;
      }
    } else if (this.isModbusRtu()) {
      if (
        !this.scaleConfig.conn_params?.com_port ||
        !this.scaleConfig.conn_params?.baud_rate
      ) {
        this.toastr.warning('Vui lòng nhập đầy đủ COM Port và Baud Rate cho Modbus RTU');
        return;
      }
    } else if (this.isSiemensS7()) {
      if (
        !this.scaleConfig.conn_params?.ip ||
        !this.scaleConfig.conn_params?.port
      ) {
        this.toastr.warning('Vui lòng nhập đầy đủ IP và Port cho Siemens S7');
        return;
      }
    } else if (this.isSabus()) {
      if (
        !this.scaleConfig.conn_params?.com_port ||
        !this.scaleConfig.conn_params?.baud_rate
      ) {
        this.toastr.warning('Vui lòng nhập đầy đủ COM Port và Baud Rate cho SABUS');
        return;
      }
    } else if (this.isSbus()) {
      if (
        !this.scaleConfig.conn_params?.com_port ||
        !this.scaleConfig.conn_params?.baud_rate
      ) {
        this.toastr.warning('Vui lòng nhập đầy đủ COM Port và Baud Rate cho S-Bus');
        return;
      }
    }

    this.saving = true;
    try {
      const data: any = this.buildScalePayload();

      if (this.isEditMode) {
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

    const protocol = scaleConfig.protocol || 'MODBUS_TCP';
    const conn = scaleConfig.conn_params || {};

    this.scaleConfig = {
      protocol: protocol,
      poll_interval: scaleConfig.poll_interval || 1000,
      conn_params: {
        ip: conn.ip !== undefined ? conn.ip : (protocol === 'SIEMENS_S7' ? '192.168.1.20' : '192.168.1.10'),
        port: conn.port !== undefined ? conn.port : (protocol === 'SIEMENS_S7' ? 102 : 502),
        unit_id: conn.unit_id !== undefined ? conn.unit_id : 1,
        response_timeout_ms: conn.response_timeout_ms !== undefined ? conn.response_timeout_ms : (protocol === 'MODBUS_TCP' ? 5000 : 3000),

        com_port: conn.com_port !== undefined ? conn.com_port : (protocol === 'SABUS' ? 'COM5' : (protocol === 'SBUS' ? 'COM4' : 'COM3')),
        baud_rate: conn.baud_rate !== undefined ? conn.baud_rate : 9600,
        data_bits: conn.data_bits !== undefined ? conn.data_bits : 8,
        stop_bits: conn.stop_bits !== undefined ? conn.stop_bits : 1,
        parity: conn.parity !== undefined ? conn.parity : 'NONE',

        rack: conn.rack !== undefined ? conn.rack : 0,
        slot: conn.slot !== undefined ? conn.slot : 1,
        controller_type: conn.controller_type || 'S7_1200',
        connect_timeout_ms: conn.connect_timeout_ms !== undefined ? conn.connect_timeout_ms : 5000,
        read_timeout_ms: conn.read_timeout_ms !== undefined ? conn.read_timeout_ms : 5000,

        device_id: conn.device_id !== undefined ? conn.device_id : (protocol === 'SBUS' ? 1 : '07'),
        device_id_width: conn.device_id_width !== undefined ? conn.device_id_width : 2,
        reconnect_delay_ms: conn.reconnect_delay_ms !== undefined ? conn.reconnect_delay_ms : 5000,
        offline_threshold_ms: conn.offline_threshold_ms !== undefined ? conn.offline_threshold_ms : 60000,
        command_prefix: conn.command_prefix !== undefined ? conn.command_prefix : '!',
        command_terminator: conn.command_terminator !== undefined ? conn.command_terminator : '\\r',
        ...conn,
      },
      data_1: this.parseChannelConfig(scaleConfig.data_1, 'Weight', true),
      data_2: this.parseChannelConfig(scaleConfig.data_2, protocol === 'SABUS' ? 'Accumulated Total' : 'Channel 2', false),
      data_3: this.parseChannelConfig(scaleConfig.data_3, 'Channel 3', false),
      data_4: this.parseChannelConfig(scaleConfig.data_4, 'Channel 4', false),
      data_5: this.parseChannelConfig(scaleConfig.data_5, 'Channel 5', false),
    };

    for (let i = 1; i <= 5; i++) {
      const channel = this.scaleConfig[`data_${i}`];
      this.expandedChannels[i] = !!(channel && channel.is_used);
    }
  }

  parseChannelConfig(ch: any, defaultName: string = '', defaultUsed: boolean = false): any {
    if (!ch) {
      return this.createDefaultChannel(defaultUsed, defaultName);
    }
    return {
      name: ch.name || (ch.is_used ? defaultName : ''),
      is_used: !!ch.is_used,
      decimal_places: ch.decimal_places !== undefined ? ch.decimal_places : 2,
      function_code: ch.function_code !== undefined ? ch.function_code : 3,
      start_registers: ch.start_registers !== undefined ? ch.start_registers : (ch.start_register !== undefined ? ch.start_register : 0),
      num_registers: ch.num_registers !== undefined ? ch.num_registers : 2,
      data_type: ch.data_type || 'FLOAT32',
      byte_order: ch.byte_order || 'BIG_ENDIAN',
      word_order: ch.word_order || 'BIG_ENDIAN',
      tag_address: ch.tag_address || '%DB1:0:REAL',
      command: ch.command || (defaultName === 'Accumulated Total' ? 'NT' : 'FL'),
      payload: ch.payload || '',
      mode: ch.mode || 'ASCII',
      response_type: ch.response_type || 'FLOAT32',
    };
  }

  createDefaultChannel(isUsed: boolean = false, name: string = ''): any {
    return {
      name: name,
      is_used: isUsed,
      decimal_places: 2,
      function_code: 3,
      start_registers: 0,
      num_registers: 2,
      data_type: 'FLOAT32',
      byte_order: 'BIG_ENDIAN',
      word_order: 'BIG_ENDIAN',
      tag_address: '%DB1:0:REAL',
      command: 'FL',
      payload: '',
      mode: 'ASCII',
      response_type: 'FLOAT32',
    };
  }

  async openConfigModal(scale: Scale): Promise<void> {
    if (!scale.id) return;

    this.selectedScale = await this.scaleService.getScaleById(scale.id);
    this.isConfigModalVisible = true;

    const configData = this.selectedScale?.scale_config || (this.selectedScale?.protocol ? this.selectedScale : null);

    if (configData) {
      this.loadConfigFromScaleConfig(configData);
    } else {
      this.resetConfig();
    }
  }

  resetConfig(): void {
    this.scaleConfig = {
      protocol: 'MODBUS_TCP',
      poll_interval: 1000,
      conn_params: {
        ip: '192.168.1.10',
        port: 502,
        unit_id: 1,
        response_timeout_ms: 5000,
        com_port: 'COM3',
        baud_rate: 9600,
        data_bits: 8,
        stop_bits: 1,
        parity: 'NONE',
        rack: 0,
        slot: 1,
        controller_type: 'S7_1200',
        connect_timeout_ms: 5000,
        read_timeout_ms: 5000,
        device_id: '07',
        device_id_width: 2,
        reconnect_delay_ms: 5000,
        offline_threshold_ms: 60000,
        command_prefix: '!',
        command_terminator: '\\r',
      },
      data_1: this.createDefaultChannel(true, 'Weight'),
      data_2: this.createDefaultChannel(false, ''),
      data_3: this.createDefaultChannel(false, ''),
      data_4: this.createDefaultChannel(false, ''),
      data_5: this.createDefaultChannel(false, ''),
    };
    this.expandedChannels = {
      1: true,
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

  buildScalePayload(): any {
    const protocolCode = this.scaleConfig.protocol || 'MODBUS_TCP';

    const data: any = {
      name: this.dataScale.name,
      location_id: this.dataScale.location_id,
      manufacturer_id: this.dataScale.manufacturer_id || null,
      protocol_id: this.dataScale.protocol_id || null,
      model: this.dataScale.model || null,
      direction: this.dataScale.direction || 'IMPORT',
      is_active:
        this.dataScale.is_active !== undefined
          ? this.dataScale.is_active
          : true,
      protocol: protocolCode,
      poll_interval: Number(this.scaleConfig.poll_interval) || 1000,
    };

    const cp = this.scaleConfig.conn_params || {};

    if (this.isModbusTcp()) {
      data.conn_params = {
        ip: cp.ip || '',
        port: Number(cp.port) || 502,
        unit_id: Number(cp.unit_id) || 1,
        response_timeout_ms: Number(cp.response_timeout_ms) || 5000,
      };
    } else if (this.isModbusRtu()) {
      data.conn_params = {
        com_port: cp.com_port || '',
        baud_rate: Number(cp.baud_rate) || 9600,
        data_bits: Number(cp.data_bits) || 8,
        stop_bits: Number(cp.stop_bits) || 1,
        parity: cp.parity || 'NONE',
        unit_id: Number(cp.unit_id) || 1,
        response_timeout_ms: Number(cp.response_timeout_ms) || 3000,
      };
    } else if (this.isSiemensS7()) {
      data.conn_params = {
        ip: cp.ip || '',
        port: Number(cp.port) || 102,
        rack: cp.rack !== undefined && cp.rack !== null ? Number(cp.rack) : 0,
        slot: cp.slot !== undefined && cp.slot !== null ? Number(cp.slot) : 1,
        controller_type: cp.controller_type || 'S7_1200',
        connect_timeout_ms: Number(cp.connect_timeout_ms) || 5000,
        read_timeout_ms: Number(cp.read_timeout_ms) || 5000,
      };
    } else if (this.isSabus()) {
      data.conn_params = {
        com_port: cp.com_port || '',
        baud_rate: Number(cp.baud_rate) || 9600,
        data_bits: Number(cp.data_bits) || 8,
        stop_bits: Number(cp.stop_bits) || 1,
        parity: cp.parity || 'NONE',
        device_id: String(cp.device_id || '07'),
        device_id_width: Number(cp.device_id_width) || 2,
        response_timeout_ms: Number(cp.response_timeout_ms) || 3000,
        reconnect_delay_ms: Number(cp.reconnect_delay_ms) || 5000,
        offline_threshold_ms: Number(cp.offline_threshold_ms) || 60000,
        command_prefix: cp.command_prefix || '!',
        command_terminator: cp.command_terminator || '\\r',
      };
    } else if (this.isSbus()) {
      data.conn_params = {
        com_port: cp.com_port || '',
        baud_rate: Number(cp.baud_rate) || 9600,
        device_id: Number(cp.device_id) || 1,
      };
    } else {
      data.conn_params = { ...cp };
    }

    for (let i = 1; i <= 5; i++) {
      const channel = this.scaleConfig[`data_${i}`];
      if (channel && channel.is_used) {
        if (this.isModbusTcp() || this.isModbusRtu()) {
          data[`data_${i}`] = {
            name: channel.name || `Weight`,
            is_used: true,
            function_code: Number(channel.function_code) || 3,
            start_registers: Number(channel.start_registers !== undefined ? channel.start_registers : (channel.start_register || 0)),
            num_registers: Number(channel.num_registers) || 2,
            data_type: channel.data_type || 'FLOAT32',
            byte_order: channel.byte_order || 'BIG_ENDIAN',
            word_order: channel.word_order || 'BIG_ENDIAN',
            decimal_places: channel.decimal_places !== undefined ? Number(channel.decimal_places) : 2,
          };
        } else if (this.isSiemensS7()) {
          data[`data_${i}`] = {
            name: channel.name || `Weight`,
            tag_address: channel.tag_address || '%DB1:0:REAL',
            is_used: true,
            decimal_places: channel.decimal_places !== undefined ? Number(channel.decimal_places) : 2,
          };
        } else if (this.isSabus()) {
          data[`data_${i}`] = {
            name: channel.name || (i === 1 ? 'Instantaneous Flow' : 'Accumulated Total'),
            command: channel.command || (i === 1 ? 'FL' : 'NT'),
            is_used: true,
            decimal_places: channel.decimal_places !== undefined ? Number(channel.decimal_places) : 2,
          };
        } else if (this.isSbus()) {
          data[`data_${i}`] = {
            name: channel.name || `Weight`,
            is_used: true,
            command: channel.command || 'READ_WEIGHT',
            payload: channel.payload || '',
            mode: channel.mode || 'ASCII',
            response_type: channel.response_type || 'FLOAT32',
          };
        } else {
          data[`data_${i}`] = {
            ...channel,
            is_used: true,
          };
        }
      } else {
        data[`data_${i}`] = { is_used: false };
      }
    }

    return data;
  }

  async saveConfig(scaleId: number): Promise<void> {
    if (!scaleId || !this.selectedScale) return;
    if (!this.scaleConfig.protocol || !this.scaleConfig.conn_params) return;
    if (this.scaleConfig.poll_interval < 100) return;

    try {
      const data = this.buildScalePayload();
      await this.scaleService.updateScale(scaleId, data);
      this.toastr.success('Cập nhật cấu hình cân thành công');
      this.isConfigModalVisible = false;
      await this.loadScales();
    } catch (error) {
      console.error('Error saving config:', error);
      this.toastr.error('Cập nhật cấu hình cân thất bại');
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
    const proto = this.scaleConfig.protocol;
    if (proto === 'MODBUS_TCP' || proto === ProtocolType.MODBUS_TCP) {
      return true;
    }
    const protocol = this.protocols.find(
      (p) => p.code === proto || p.id === this.dataScale?.protocol_id
    );
    return (
      protocol?.code === 'MODBUS_TCP' ||
      protocol?.type === 'MODBUS_TCP' ||
      protocol?.type === ProtocolType.MODBUS_TCP
    );
  }

  isModbusRtu(): boolean {
    const proto = this.scaleConfig.protocol;
    if (proto === 'MODBUS_RTU' || proto === ProtocolType.MODBUS_RTU) {
      return true;
    }
    const protocol = this.protocols.find(
      (p) => p.code === proto || p.id === this.dataScale?.protocol_id
    );
    return (
      protocol?.code === 'MODBUS_RTU' ||
      protocol?.type === 'MODBUS_RTU' ||
      protocol?.type === ProtocolType.MODBUS_RTU
    );
  }

  isSiemensS7(): boolean {
    const proto = this.scaleConfig.protocol;
    if (proto === 'SIEMENS_S7' || proto === ProtocolType.SIEMENS_S7) {
      return true;
    }
    const protocol = this.protocols.find(
      (p) => p.code === proto || p.id === this.dataScale?.protocol_id
    );
    return (
      protocol?.code === 'SIEMENS_S7' ||
      protocol?.type === 'SIEMENS_S7' ||
      protocol?.type === ProtocolType.SIEMENS_S7
    );
  }

  isSabus(): boolean {
    const proto = this.scaleConfig.protocol;
    if (proto === 'SABUS' || proto === ProtocolType.SABUS) {
      return true;
    }
    const protocol = this.protocols.find(
      (p) => p.code === proto || p.id === this.dataScale?.protocol_id
    );
    return (
      protocol?.code === 'SABUS' ||
      protocol?.type === 'SABUS' ||
      protocol?.type === ProtocolType.SABUS
    );
  }

  isSbus(): boolean {
    const proto = this.scaleConfig.protocol;
    if (proto === 'SBUS' || proto === ProtocolType.SBUS) {
      return true;
    }
    const protocol = this.protocols.find(
      (p) => p.code === proto || p.id === this.dataScale?.protocol_id
    );
    return (
      protocol?.code === 'SBUS' ||
      protocol?.type === 'SBUS' ||
      protocol?.type === ProtocolType.SBUS
    );
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
