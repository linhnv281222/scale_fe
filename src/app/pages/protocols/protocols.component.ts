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
  saving = false;
  selectedProtocol: Protocol | null = null;
  filterData: any = {};

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
      key: 'name',
      label: 'scales.protocol',
      type: 'text',
      placeholder: 'scales.protocol',
    },
    {
      key: 'code',
      label: 'scales.code',
      type: 'text',
      placeholder: 'scales.code',
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
      const data = await this.protocolService.getProtocols({
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      });
      this.protocols = Array.isArray(data) ? data : data?.data || [];
      this.total = data?.total || this.protocols.length;
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
    this.selectedProtocol = null;
    this.dataProtocol = {};
    this.formFields.forEach((field) => {
      this.dataProtocol[field.fieldKey] = '';
    });
    this.isModalVisible = true;
  }

  viewProtocol(protocol: Protocol): void {
    // For now, view opens edit modal
    this.openEditModal(protocol);
  }

  openEditModal(protocol: Protocol): void {
    this.isEditMode = true;
    this.selectedProtocol = protocol;
    this.dataProtocol = {};
    this.formFields.forEach((field) => {
      this.dataProtocol[field.fieldKey] = (protocol as any)[field.fieldKey] || '';
    });
    this.isModalVisible = true;
  }


  async saveProtocol(): Promise<void> {
    if (!this.dataProtocol.name || !this.dataProtocol.code || !this.dataProtocol.type) {
      return;
    }

    this.saving = true;
    const data = { ...this.dataProtocol };

    try {
      if (this.isEditMode) {
        await this.protocolService.updateProtocol(this.selectedProtocol?.id!, data);
      } else {
        await this.protocolService.createProtocol(data);
      }
      this.isModalVisible = false;
      await this.loadProtocols();
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
}
