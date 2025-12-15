import { Component, OnInit } from '@angular/core';
import { Shift } from '../../models';
import { HttpService } from '../../services/http.service';
import { ConfigService } from '../../services/config.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.css']
})
export class ShiftsComponent implements OnInit {
  shifts: Shift[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  saving = false;
  selectedShift: Shift | null = null;
  filterData: any = {};
  
  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  // Form data object
  dataShift: any = {};

  filterFields: FilterField[] = [
    {
      key: 'name',
      label: 'shifts.name',
      type: 'text',
      placeholder: 'shifts.name',
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
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.loadConfigs();
    this.loadShifts();
  }

  loadConfigs(): void {
    this.loadingConfigs = true;
    this.configService.getModuleFields('shifts').subscribe({
      next: (fields) => {
        this.formFields = fields;
        this.loadingConfigs = false;
      },
      error: () => {
        this.formFields = [];
        this.loadingConfigs = false;
      },
    });

    this.configService.getModuleColumns('shifts').subscribe({
      next: (columns) => {
        this.tableColumns = columns;
      },
      error: () => {
        this.tableColumns = [];
      },
    });
  }

  loadShifts(): void {
    this.loading = true;
    this.http
      .get<Shift[]>('api/shifts', {
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      })
      .subscribe({
        next: (data: any) => {
          this.shifts = Array.isArray(data) ? data : data?.data || [];
          this.total = data?.total || this.shifts.length;
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
    this.loadShifts();
  }

  onReset(): void {
    this.filterData = {};
    this.loadShifts();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedShift = null;
    this.dataShift = {};
    this.formFields.forEach((field) => {
      this.dataShift[field.fieldKey] = '';
    });
    this.isModalVisible = true;
  }

  viewShift(shift: Shift): void {
    // For now, view opens edit modal
    this.openEditModal(shift);
  }

  openEditModal(shift: Shift): void {
    this.isEditMode = true;
    this.selectedShift = shift;
    this.dataShift = {
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
    };
    this.isModalVisible = true;
  }

  saveShift(): void {
    // Validation
    if (!this.dataShift.name || !this.dataShift.startTime || !this.dataShift.endTime) {
      return;
    }

    this.saving = true;
    const data = { ...this.dataShift };

    const request = this.isEditMode
      ? this.http.put(`api/shifts/${this.selectedShift?.id}`, data)
      : this.http.post('api/shifts', data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.isModalVisible = false;
        this.loadShifts();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // Confirm dialog
  isConfirmVisible = false;
  shiftToDelete: Shift | null = null;

  confirmDelete(shift: Shift): void {
    this.shiftToDelete = shift;
    this.isConfirmVisible = true;
  }

  onDeleteConfirmed(): void {
    if (this.shiftToDelete?.id) {
      this.http.delete(`api/shifts/${this.shiftToDelete.id}`).subscribe({
        next: () => {
          this.loadShifts();
          this.shiftToDelete = null;
        },
      });
    }
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.shiftToDelete) return '';
    return `Bạn có chắc chắn muốn xóa ca "${this.shiftToDelete.name}"?`;
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadShifts();
  }
}
