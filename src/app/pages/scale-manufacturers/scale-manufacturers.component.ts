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
  isViewMode = false;
  saving = false;
  selectedManufacturer: ScaleManufacturer | null = null;
  filterData: any = {};
  sidebarVisible = true;
  sidebarSize = 260; // Pixel

  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  // Form data object
  dataManufacturer: any = {};

  filterFields: FilterField[] = [
    {
      key: 'code',
      label: 'scales.manufacturerCode',
      type: 'text',
      placeholder: 'scales.enterManufacturerCode',
    },
    {
      key: 'country',
      label: 'scales.country',
      type: 'text',
      placeholder: 'scales.enterCountry',
    },
  ];

  constructor(
    private scaleManufacturerService: ScaleManufacturerService,
    private configService: ConfigService
  ) { }

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
      // Build query params according to API
      const params: any = {
        page: this.pageIndex - 1, // API uses 0-indexed
        size: this.pageSize,
      };

      if (this.filterData.code) {
        params.code = this.filterData.code;
      }
      if (this.filterData.country) {
        params.country = this.filterData.country;
      }
      if (this.filterData.sort) {
        params.sort = this.filterData.sort;
      }

      const result = await this.scaleManufacturerService.getScaleManufacturers(
        params
      );
      this.manufacturers = result.data || [];
      this.total = result.total || 0;
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
    this.isViewMode = false;
    this.selectedManufacturer = null;
    this.dataManufacturer = {
      code: '',
      name: '',
      country: '',
      website: '',
      phone: '',
      email: '',
      address: '',
      description: '',
      is_active: true,
    };
    this.isModalVisible = true;
  }

  async viewManufacturer(manufacturer: ScaleManufacturer): Promise<void> {
    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedManufacturer = manufacturer;

    // Load full manufacturer details
    if (manufacturer.id) {
      const fullManufacturer =
        await this.scaleManufacturerService.getScaleManufacturerById(
          manufacturer.id
        );
      if (fullManufacturer) {
        this.selectedManufacturer = fullManufacturer;
        this.dataManufacturer = {
          code: fullManufacturer.code || '',
          name: fullManufacturer.name || '',
          country: fullManufacturer.country || '',
          website: fullManufacturer.website || '',
          phone: fullManufacturer.phone || '',
          email: fullManufacturer.email || '',
          address: fullManufacturer.address || '',
          description: fullManufacturer.description || '',
          is_active:
            fullManufacturer.is_active !== undefined
              ? fullManufacturer.is_active
              : true,
        };
      } else {
        this.dataManufacturer = {
          code: manufacturer.code || '',
          name: manufacturer.name || '',
          country: manufacturer.country || '',
          website: manufacturer.website || '',
          phone: manufacturer.phone || '',
          email: manufacturer.email || '',
          address: manufacturer.address || '',
          description: manufacturer.description || '',
          is_active:
            manufacturer.is_active !== undefined
              ? manufacturer.is_active
              : true,
        };
      }
    } else {
      this.dataManufacturer = {
        code: manufacturer.code || '',
        name: manufacturer.name || '',
        country: manufacturer.country || '',
        website: manufacturer.website || '',
        phone: manufacturer.phone || '',
        email: manufacturer.email || '',
        address: manufacturer.address || '',
        description: manufacturer.description || '',
        is_active:
          manufacturer.is_active !== undefined ? manufacturer.is_active : true,
      };
    }
    this.isModalVisible = true;
  }

  async openEditModal(manufacturer: ScaleManufacturer): Promise<void> {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedManufacturer = manufacturer;

    // Load full manufacturer details
    if (manufacturer.id) {
      const fullManufacturer =
        await this.scaleManufacturerService.getScaleManufacturerById(
          manufacturer.id
        );
      if (fullManufacturer) {
        this.selectedManufacturer = fullManufacturer;
        this.dataManufacturer = {
          code: fullManufacturer.code || '',
          name: fullManufacturer.name || '',
          country: fullManufacturer.country || '',
          website: fullManufacturer.website || '',
          phone: fullManufacturer.phone || '',
          email: fullManufacturer.email || '',
          address: fullManufacturer.address || '',
          description: fullManufacturer.description || '',
          is_active:
            fullManufacturer.is_active !== undefined
              ? fullManufacturer.is_active
              : true,
        };
      } else {
        this.dataManufacturer = {
          code: manufacturer.code || '',
          name: manufacturer.name || '',
          country: manufacturer.country || '',
          website: manufacturer.website || '',
          phone: manufacturer.phone || '',
          email: manufacturer.email || '',
          address: manufacturer.address || '',
          description: manufacturer.description || '',
          is_active:
            manufacturer.is_active !== undefined
              ? manufacturer.is_active
              : true,
        };
      }
    } else {
      this.dataManufacturer = {
        code: manufacturer.code || '',
        name: manufacturer.name || '',
        country: manufacturer.country || '',
        website: manufacturer.website || '',
        phone: manufacturer.phone || '',
        email: manufacturer.email || '',
        address: manufacturer.address || '',
        description: manufacturer.description || '',
        is_active:
          manufacturer.is_active !== undefined ? manufacturer.is_active : true,
      };
    }
    this.isModalVisible = true;
  }

  async saveManufacturer(): Promise<void> {
    // Validation
    if (!this.dataManufacturer.name || !this.dataManufacturer.code) {
      return;
    }

    this.saving = true;
    // Build payload according to API
    const data: any = {
      code: this.dataManufacturer.code,
      name: this.dataManufacturer.name,
      country: this.dataManufacturer.country || '',
      website: this.dataManufacturer.website || '',
      phone: this.dataManufacturer.phone || '',
      email: this.dataManufacturer.email || '',
      address: this.dataManufacturer.address || '',
      description: this.dataManufacturer.description || '',
      is_active:
        this.dataManufacturer.is_active !== undefined
          ? this.dataManufacturer.is_active
          : true,
    };

    try {
      if (this.isEditMode && this.selectedManufacturer?.id) {
        const updated =
          await this.scaleManufacturerService.updateScaleManufacturer(
            this.selectedManufacturer.id,
            data
          );
        if (updated) {
          this.isModalVisible = false;
          this.isViewMode = false;
          await this.loadManufacturers();
        }
      } else {
        const created =
          await this.scaleManufacturerService.createScaleManufacturer(data);
        if (created) {
          this.isModalVisible = false;
          this.isViewMode = false;
          await this.loadManufacturers();
        }
      }
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

  closeViewModal(): void {
    this.isModalVisible = false;
    this.isViewMode = false;
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
