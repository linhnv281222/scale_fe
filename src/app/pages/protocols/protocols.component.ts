import { Component, OnInit } from '@angular/core';
import { Protocol, ProtocolType } from '../../models';
import { HttpService } from '../../services/http.service';
import { ConfigService } from '../../services/config.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';
import { TranslateService } from '@ngx-translate/core';

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
    private http: HttpService,
    private configService: ConfigService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadConfigs();
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

  loadProtocols(): void {
    this.loading = true;
    this.http
      .get<Protocol[]>('api/protocols', {
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      })
      .subscribe({
        next: (data: any) => {
          this.protocols = Array.isArray(data) ? data : data?.data || [];
          this.total = data?.total || this.protocols.length;
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


  saveProtocol(): void {
    // Validation
    if (!this.dataProtocol.name || !this.dataProtocol.code || !this.dataProtocol.type) {
      return;
    }

    this.saving = true;
    const data = { ...this.dataProtocol };

    const request = this.isEditMode
      ? this.http.put(`api/protocols/${this.selectedProtocol?.id}`, data)
      : this.http.post('api/protocols', data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.isModalVisible = false;
        this.loadProtocols();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // Confirm dialog
  isConfirmVisible = false;
  protocolToDelete: Protocol | null = null;

  confirmDelete(protocol: Protocol): void {
    this.protocolToDelete = protocol;
    this.isConfirmVisible = true;
  }

  onDeleteConfirmed(): void {
    if (this.protocolToDelete?.id) {
      this.http.delete(`api/protocols/${this.protocolToDelete.id}`).subscribe({
        next: () => {
          this.loadProtocols();
          this.protocolToDelete = null;
        },
      });
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
