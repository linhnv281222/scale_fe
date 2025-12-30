import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Shift } from '../../models';
import { ConfigService } from '../../services/config.service';
import { ShiftService } from '../../services/shift.service';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.css'],
})
export class ShiftsComponent implements OnInit {
  shifts: Shift[] = [];
  filteredShifts: Shift[] = [];
  loading = false;
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
      key: 'is_active',
      label: 'common.status',
      type: 'select',
      placeholder: 'common.selectStatus',
      options: [
        { label: 'common.active', value: true },
        { label: 'common.inactive', value: false },
      ],
    },
  ];

  constructor(
    private shiftService: ShiftService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    // this.loadConfigs();
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

  async loadShifts(): Promise<void> {
    this.loading = true;
    try {
      // API doesn't support pagination or query params, load all shifts
      this.shifts = await this.shiftService.getShifts();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading shifts:', error);
      this.shifts = [];
      this.filteredShifts = [];
    } finally {
      this.loading = false;
    }
  }

  private applyFilters(): void {
    let filtered = [...this.shifts];

    // Filter by name
    if (this.filterData.name) {
      const nameFilter = this.filterData.name.toLowerCase().trim();
      filtered = filtered.filter(shift =>
        shift.name?.toLowerCase().includes(nameFilter)
      );
    }

    // Filter by is_active
    if (this.filterData.is_active !== undefined && this.filterData.is_active !== null && this.filterData.is_active !== '') {
      filtered = filtered.filter(shift =>
        shift.is_active === this.filterData.is_active
      );
    }

    this.filteredShifts = filtered;
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.applyFilters();
  }

  onReset(): void {
    this.filterData = {};
    this.applyFilters();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedShift = null;
    this.dataShift = {
      name: '',
      code: '',
      startTime: null,
      endTime: null,
      is_active: true,
    };
    this.isModalVisible = true;
  }

  viewShift(shift: Shift): void {
    // For now, view opens edit modal
    this.openEditModal(shift);
  }

  async openEditModal(shift: Shift): Promise<void> {
    this.isEditMode = true;
    this.selectedShift = shift;

    // Load full shift details if needed
    if (shift.id) {
      const fullShift = await this.shiftService.getShiftById(shift.id);
      if (fullShift) {
        this.selectedShift = fullShift;
        this.dataShift = {
          name: fullShift.name,
          startTime: fullShift.startTime
            ? moment(fullShift.startTime, 'HH:mm').toDate()
            : (fullShift.start_time ? moment(fullShift.start_time, 'HH:mm:ss').toDate() : null),
          endTime: fullShift.endTime
            ? moment(fullShift.endTime, 'HH:mm').toDate()
            : (fullShift.end_time ? moment(fullShift.end_time, 'HH:mm:ss').toDate() : null),
          is_active: fullShift.is_active !== undefined ? fullShift.is_active : (fullShift.isActive !== undefined ? fullShift.isActive : true),
        };
      } else {
        this.dataShift = {
          name: shift.name,
          startTime: shift.startTime
            ? moment(shift.startTime, 'HH:mm').toDate()
            : (shift.start_time ? moment(shift.start_time, 'HH:mm:ss').toDate() : null),
          endTime: shift.endTime
            ? moment(shift.endTime, 'HH:mm').toDate()
            : (shift.end_time ? moment(shift.end_time, 'HH:mm:ss').toDate() : null),
          is_active: shift.is_active !== undefined ? shift.is_active : (shift.isActive !== undefined ? shift.isActive : true),
        };
      }
    } else {
      this.dataShift = {
        name: shift.name,
        startTime: shift.startTime
          ? moment(shift.startTime, 'HH:mm').toDate()
          : (shift.start_time ? moment(shift.start_time, 'HH:mm:ss').toDate() : null),
        endTime: shift.endTime
          ? moment(shift.endTime, 'HH:mm').toDate()
          : (shift.end_time ? moment(shift.end_time, 'HH:mm:ss').toDate() : null),
        is_active: shift.is_active !== undefined ? shift.is_active : (shift.isActive !== undefined ? shift.isActive : true),
      };
    }
    this.isModalVisible = true;
  }

  async saveShift(): Promise<void> {
    if (
      !this.dataShift.name ||
      !this.dataShift.startTime ||
      !this.dataShift.endTime
    ) {
      return;
    }

    this.saving = true;
    try {
      // Convert Date object from time picker to HH:mm:ss format using moment
      const startTime = this.dataShift.startTime
        ? moment(this.dataShift.startTime).format('HH:mm:ss')
        : '';
      const endTime = this.dataShift.endTime
        ? moment(this.dataShift.endTime).format('HH:mm:ss')
        : '';

      const data = {
        ...this.dataShift,
        start_time: startTime,
        end_time: endTime,
        code: this.dataShift.code || this.dataShift.name?.toUpperCase().replace(/\s+/g, ''),
      };

      if (this.isEditMode && this.selectedShift?.id) {
        await this.shiftService.updateShift(this.selectedShift.id, data);
      } else {
        await this.shiftService.createShift(data);
      }
      this.isModalVisible = false;
      await this.loadShifts();
    } catch (error) {
      console.error('Error saving shift:', error);
    } finally {
      this.saving = false;
    }
  }

  // Confirm dialog
  isConfirmVisible = false;
  shiftToDelete: Shift | null = null;

  confirmDelete(shift: Shift): void {
    this.shiftToDelete = shift;
    this.isConfirmVisible = true;
  }

  async onDeleteConfirmed(): Promise<void> {
    if (this.shiftToDelete?.id) {
      try {
        await this.shiftService.deleteShift(this.shiftToDelete.id);
        await this.loadShifts();
        this.shiftToDelete = null;
      } catch (error) {
        console.error('Error deleting shift:', error);
      }
    }
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.shiftToDelete) return '';
    return `Bạn có chắc chắn muốn xóa ca "${this.shiftToDelete.name}"?`;
  }


  // Format time from HH:mm:ss to HH:mm using moment
  formatTime(time: string | undefined): string {
    if (!time) return '-';
    if (time.length === 5) return time; // Already HH:mm format
    return moment(time, 'HH:mm:ss').format('HH:mm');
  }
}
