import { Component, OnInit } from '@angular/core';
import { ScaleManufacturer } from '../../models';
import { HttpService } from '../../services/http.service';
import { ConfigService } from '../../services/config.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-scale-manufacturers',
  templateUrl: './scale-manufacturers.component.html',
  styleUrls: ['./scale-manufacturers.component.css']
})
export class ScaleManufacturersComponent implements OnInit {
  manufacturers: ScaleManufacturer[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  saving = false;
  selectedManufacturer: ScaleManufacturer | null = null;
  filterData: any = {};
  
  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  // Form data object
  dataManufacturer: any = {};

  filterFields: FilterField[] = [
    {
      key: 'name',
      label: 'scales.manufacturerName',
      type: 'text',
      placeholder: 'scales.enterManufacturerName',
    },
    {
      key: 'code',
      label: 'scales.manufacturerCode',
      type: 'text',
      placeholder: 'scales.enterManufacturerCode',
    }
  ];

  constructor(
    private http: HttpService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.loadConfigs();
    this.loadManufacturers();
  }

  loadConfigs(): void {
    this.loadingConfigs = true;
    this.configService.getModuleFields('scale-manufacturers').subscribe({
      next: (fields) => {
        this.formFields = fields;
        this.loadingConfigs = false;
      },
      error: () => {
        this.formFields = [];
        this.loadingConfigs = false;
      },
    });

    this.configService.getModuleColumns('scale-manufacturers').subscribe({
      next: (columns) => {
        this.tableColumns = columns;
      },
      error: () => {
        this.tableColumns = [];
      },
    });
  }

  loadManufacturers(): void {
    this.loading = true;
    this.http
      .get<ScaleManufacturer[]>('api/scale-manufacturers', {
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      })
      .subscribe({
        next: (data: any) => {
          this.manufacturers = Array.isArray(data) ? data : data?.data || [];
          this.total = data?.total || this.manufacturers.length;
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
    this.loadManufacturers();
  }

  onReset(): void {
    this.filterData = {};
    this.loadManufacturers();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedManufacturer = null;
    this.dataManufacturer = {};
    this.formFields.forEach((field) => {
      this.dataManufacturer[field.fieldKey] = '';
    });
    this.isModalVisible = true;
  }

  viewManufacturer(manufacturer: ScaleManufacturer): void {
    // For now, view opens edit modal
    this.openEditModal(manufacturer);
  }

  openEditModal(manufacturer: ScaleManufacturer): void {
    this.isEditMode = true;
    this.selectedManufacturer = manufacturer;
    this.dataManufacturer = {
      name: manufacturer.name,
      code: manufacturer.code,
    };
    this.isModalVisible = true;
  }

  saveManufacturer(): void {
    // Validation
    if (!this.dataManufacturer.name || !this.dataManufacturer.code) {
      return;
    }

    this.saving = true;
    const data = { ...this.dataManufacturer };

    const request = this.isEditMode
      ? this.http.put(`api/scale-manufacturers/${this.selectedManufacturer?.id}`, data)
      : this.http.post('api/scale-manufacturers', data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.isModalVisible = false;
        this.loadManufacturers();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // Confirm dialog
  isConfirmVisible = false;
  manufacturerToDelete: ScaleManufacturer | null = null;

  confirmDelete(manufacturer: ScaleManufacturer): void {
    this.manufacturerToDelete = manufacturer;
    this.isConfirmVisible = true;
  }

  onDeleteConfirmed(): void {
    if (this.manufacturerToDelete?.id) {
      this.http.delete(`api/scale-manufacturers/${this.manufacturerToDelete.id}`).subscribe({
        next: () => {
          this.loadManufacturers();
          this.manufacturerToDelete = null;
        },
      });
    }
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.manufacturerToDelete) return '';
    return `Bạn có chắc chắn muốn xóa hãng cân "${this.manufacturerToDelete.name}"?`;
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadManufacturers();
  }
}
