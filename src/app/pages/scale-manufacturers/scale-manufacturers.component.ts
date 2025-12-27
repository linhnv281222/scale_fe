import { Component, OnInit } from '@angular/core';
import { ScaleManufacturer } from '../../models';
import { ConfigService } from '../../services/config.service';
import { ScaleManufacturerService } from '../../services/scale-manufacturer.service';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-scale-manufacturers',
  templateUrl: './scale-manufacturers.component.html',
  styleUrls: ['./scale-manufacturers.component.css'],
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
    },
  ];

  constructor(
    private scaleManufacturerService: ScaleManufacturerService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    // this.loadConfigs();
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

  async loadManufacturers(): Promise<void> {
    this.loading = true;
    try {
      const data = await this.scaleManufacturerService.getScaleManufacturers({
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      });
      this.manufacturers = data.data || [];
      this.total = data.total || this.manufacturers.length;
    } catch (error) {
      this.manufacturers = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
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

  async saveManufacturer(): Promise<void> {
    // Validation
    if (!this.dataManufacturer.name || !this.dataManufacturer.code) {
      return;
    }

    this.saving = true;
    const data = { ...this.dataManufacturer };

    try {
      if (this.isEditMode && this.selectedManufacturer?.id) {
        await this.scaleManufacturerService.updateScaleManufacturer(
          this.selectedManufacturer.id,
          data
        );
      } else {
        await this.scaleManufacturerService.createScaleManufacturer(data);
      }
      this.isModalVisible = false;
      await this.loadManufacturers();
    } catch (error) {
      console.error('Error saving manufacturer:', error);
    } finally {
      this.saving = false;
    }
  }

  // Confirm dialog
  isConfirmVisible = false;
  manufacturerToDelete: ScaleManufacturer | null = null;

  confirmDelete(manufacturer: ScaleManufacturer): void {
    this.manufacturerToDelete = manufacturer;
    this.isConfirmVisible = true;
  }

  async onDeleteConfirmed(): Promise<void> {
    if (this.manufacturerToDelete?.id) {
      try {
        await this.scaleManufacturerService.deleteScaleManufacturer(
          this.manufacturerToDelete.id
        );
        await this.loadManufacturers();
        this.manufacturerToDelete = null;
      } catch (error) {
        console.error('Error deleting manufacturer:', error);
      }
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
