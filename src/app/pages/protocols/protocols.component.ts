import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Protocol, ProtocolType } from '../../models';
import { ConfigService } from '../../services/config.service';
import { ProtocolService } from '../../services/protocol.service';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-protocols',
  templateUrl: './protocols.component.html',
  styleUrls: ['./protocols.component.css']
})
export class ProtocolsComponent implements OnInit {
  protocols: Protocol[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  isViewMode = false;
  saving = false;
  selectedProtocol: Protocol | null = null;
  filterData: any = {};
  sidebarVisible = true;
  sidebarSize = 15; // Percentage

  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  // Form data object
  dataProtocol: any = {};

  ProtocolType = ProtocolType;

  // Map for protocol type labels
  protocolTypeLabels: { [key: string]: string } = {
    [ProtocolType.MODBUS_TCP]: 'scales.modbusTcp',
    [ProtocolType.MODBUS_RTU]: 'scales.modbusRtu',
    [ProtocolType.SABUS]: 'scales.sabus',
  };

  filterFields: FilterField[] = [
    {
      key: 'code',
      label: 'scales.protocolCode',
      type: 'text',
      placeholder: 'scales.enterProtocolCode',
    },
    {
      key: 'connectionType',
      label: 'scales.connectionType',
      type: 'select',
      placeholder: 'scales.selectConnectionType',
      options: [
        { label: 'scales.tcp', value: 'TCP' },
        { label: 'scales.rtu', value: 'RTU' },
      ],
    },
  ];

  constructor(
    private protocolService: ProtocolService,
    private configService: ConfigService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // this.loadConfigs();
    this.loadProtocols();
  }

  loadConfigs(): void {
    this.loadingConfigs = true;
    this.configService.getModuleFields('protocols').subscribe({
      next: (fields) => {
        this.formFields = fields;
        this.loadingConfigs = false;
      },
      error: () => {
        this.formFields = [];
        this.loadingConfigs = false;
      },
    });

    this.configService.getModuleColumns('protocols').subscribe({
      next: (columns) => {
        this.tableColumns = columns;
      },
      error: () => {
        this.tableColumns = [];
      },
    });
  }

  async loadProtocols(): Promise<void> {
    this.loading = true;
    try {
      // Build query params according to API
      const params: any = {
        page: this.pageIndex - 1, // API uses 0-indexed
        size: this.pageSize,
      };

      if (this.filterData.code) {
        params.code = this.filterData.code;
      }
      if (this.filterData.connectionType) {
        params.connectionType = this.filterData.connectionType;
      }
      if (this.filterData.sort) {
        params.sort = this.filterData.sort;
      }

      const result = await this.protocolService.getProtocols(params);
      this.protocols = result.data || [];
      this.total = result.total || 0;
    } catch (error) {
      this.protocols = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadProtocols();
  }

  onReset(): void {
    this.filterData = {};
    this.loadProtocols();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedProtocol = null;
    this.dataProtocol = {
      code: '',
      name: '',
      description: '',
      connection_type: '',
      default_port: 502,
      default_baud_rate: 9600,
      is_active: true,
      config_template: '',
    };
    this.isModalVisible = true;
  }

  async viewProtocol(protocol: Protocol): Promise<void> {
    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedProtocol = protocol;
    
    // Load full protocol details
    if (protocol.id) {
      const fullProtocol = await this.protocolService.getProtocolById(protocol.id);
      if (fullProtocol) {
        this.selectedProtocol = fullProtocol;
        this.dataProtocol = {
          code: fullProtocol.code || '',
          name: fullProtocol.name || '',
          description: fullProtocol.description || '',
          connection_type: fullProtocol.connection_type || '',
          default_port: fullProtocol.default_port || 502,
          default_baud_rate: fullProtocol.default_baud_rate || 9600,
          is_active: fullProtocol.is_active !== undefined ? fullProtocol.is_active : true,
          config_template: fullProtocol.config_template || '',
        };
      } else {
        this.dataProtocol = {
          code: protocol.code || '',
          name: protocol.name || '',
          description: protocol.description || '',
          connection_type: protocol.connection_type || '',
          default_port: protocol.default_port || 502,
          default_baud_rate: protocol.default_baud_rate || 9600,
          is_active: protocol.is_active !== undefined ? protocol.is_active : true,
          config_template: protocol.config_template || '',
        };
      }
    } else {
      this.dataProtocol = {
        code: protocol.code || '',
        name: protocol.name || '',
        description: protocol.description || '',
        connection_type: protocol.connection_type || '',
        default_port: protocol.default_port || 502,
        default_baud_rate: protocol.default_baud_rate || 9600,
        is_active: protocol.is_active !== undefined ? protocol.is_active : true,
        config_template: protocol.config_template || '',
      };
    }
    this.isModalVisible = true;
  }

  async openEditModal(protocol: Protocol): Promise<void> {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedProtocol = protocol;
    
    // Load full protocol details
    if (protocol.id) {
      const fullProtocol = await this.protocolService.getProtocolById(protocol.id);
      if (fullProtocol) {
        this.selectedProtocol = fullProtocol;
        this.dataProtocol = {
          code: fullProtocol.code || '',
          name: fullProtocol.name || '',
          description: fullProtocol.description || '',
          connection_type: fullProtocol.connection_type || '',
          default_port: fullProtocol.default_port || 502,
          default_baud_rate: fullProtocol.default_baud_rate || 9600,
          is_active: fullProtocol.is_active !== undefined ? fullProtocol.is_active : true,
          config_template: fullProtocol.config_template || '',
        };
      } else {
        this.dataProtocol = {
          code: protocol.code || '',
          name: protocol.name || '',
          description: protocol.description || '',
          connection_type: protocol.connection_type || '',
          default_port: protocol.default_port || 502,
          default_baud_rate: protocol.default_baud_rate || 9600,
          is_active: protocol.is_active !== undefined ? protocol.is_active : true,
          config_template: protocol.config_template || '',
        };
      }
    } else {
      this.dataProtocol = {
        code: protocol.code || '',
        name: protocol.name || '',
        description: protocol.description || '',
        connection_type: protocol.connection_type || '',
        default_port: protocol.default_port || 502,
        default_baud_rate: protocol.default_baud_rate || 9600,
        is_active: protocol.is_active !== undefined ? protocol.is_active : true,
        config_template: protocol.config_template || '',
      };
    }
    this.isModalVisible = true;
  }


  async saveProtocol(): Promise<void> {
    // Validation
    if (!this.dataProtocol.name || !this.dataProtocol.code || !this.dataProtocol.connection_type || !this.dataProtocol.default_port) {
      return;
    }

    this.saving = true;
    // Build payload according to API
    const data: any = {
      code: this.dataProtocol.code,
      name: this.dataProtocol.name,
      description: this.dataProtocol.description || '',
      connection_type: this.dataProtocol.connection_type,
      default_port: this.dataProtocol.default_port || 502,
      default_baud_rate: this.dataProtocol.default_baud_rate || 9600,
      is_active: this.dataProtocol.is_active !== undefined ? this.dataProtocol.is_active : true,
      config_template: this.dataProtocol.config_template || '',
    };

    try {
      if (this.isEditMode) {
        const updated = await this.protocolService.updateProtocol(this.selectedProtocol?.id!, data);
        if (updated) {
          this.isModalVisible = false;
          this.isViewMode = false;
          await this.loadProtocols();
        }
      } else {
        const created = await this.protocolService.createProtocol(data);
        if (created) {
      this.isModalVisible = false;
      this.isViewMode = false;
      await this.loadProtocols();
        }
      }
    } catch (error) {
      console.error('Error saving protocol:', error);
    } finally {
      this.saving = false;
    }
  }

  // Confirm dialog
  isConfirmVisible = false;
  protocolToDelete: Protocol | null = null;

  confirmDelete(protocol: Protocol): void {
    this.protocolToDelete = protocol;
    this.isConfirmVisible = true;
  }

  async onDeleteConfirmed(): Promise<void> {
    if (this.protocolToDelete?.id) {
      try {
        await this.protocolService.deleteProtocol(this.protocolToDelete.id);
        await this.loadProtocols();
        this.protocolToDelete = null;
      } catch (error) {
        console.error('Error deleting protocol:', error);
      }
    }
  }

  closeViewModal(): void {
    this.isModalVisible = false;
    this.isViewMode = false;
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.protocolToDelete) return '';
    return `Bạn có chắc chắn muốn xóa giao thức "${this.protocolToDelete.name}"?`;
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadProtocols();
  }

  // Helper method to check if required field is empty
  isRequiredFieldEmpty(value: any): boolean {
    if (typeof value === 'number') {
      return value === null || value === undefined;
    }
    return value === null || value === undefined || value === '';
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
