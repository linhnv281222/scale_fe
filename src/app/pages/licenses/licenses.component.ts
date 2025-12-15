import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { License } from '../../models';
import { ConfigService } from '../../services/config.service';
import { HttpService } from '../../services/http.service';
import { PageActionService } from '../../services/page-action.service';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-licenses',
  templateUrl: './licenses.component.html',
  styleUrls: ['./licenses.component.css'],
})
export class LicensesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  licenses: License[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 10;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  saving = false;
  selectedLicense: License | null = null;
  filterData: any = {};

  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  licenseForm!: FormGroup;

  filterFields: FilterField[] = [
    {
      key: 'licenseKey',
      label: 'licenses.licenseKey',
      type: 'text',
      placeholder: 'licenses.licenseKey',
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

  constructor(
    private http: HttpService,
    private configService: ConfigService,
    private fb: FormBuilder,
    private pageActionService: PageActionService
  ) {
    this.licenseForm = this.fb.group({
      licenseKey: ['', Validators.required],
      maxScales: [1, [Validators.required, Validators.min(1)]],
      expiresAt: [null],
    });
  }

  ngOnInit(): void {
    this.loadConfigs();
    this.loadLicenses();
    this.pageActionService.addNew$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.openAddModal();
      });
  }

  loadConfigs(): void {
    this.loadingConfigs = true;
    this.configService.getModuleFields('licenses').subscribe({
      next: (fields) => {
        this.formFields = fields;
        this.loadingConfigs = false;
      },
      error: () => {
        this.formFields = [];
        this.loadingConfigs = false;
      },
    });

    this.configService.getModuleColumns('licenses').subscribe({
      next: (columns) => {
        this.tableColumns = columns;
      },
      error: () => {
        this.tableColumns = [];
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLicenses(): void {
    this.loading = true;
    this.http
      .get<License[]>('api/licenses', {
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      })
      .subscribe({
        next: (data: any) => {
          this.licenses = Array.isArray(data) ? data : data?.data || [];
          this.total = data?.total || this.licenses.length;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedLicense = null;
    this.licenseForm.reset({
      licenseKey: '',
      maxScales: 1,
      expiresAt: null,
    });
    this.isModalVisible = true;
  }

  openEditModal(license: License): void {
    this.isEditMode = true;
    this.selectedLicense = license;
    this.licenseForm.patchValue({
      licenseKey: license.licenseKey,
      maxScales: license.maxScales,
      expiresAt: license.expiresAt,
    });
    this.isModalVisible = true;
  }

  saveLicense(): void {
    if (this.licenseForm.invalid) {
      return;
    }

    this.saving = true;
    const data = this.licenseForm.value;

    const request = this.isEditMode
      ? this.http.put(`api/licenses/${this.selectedLicense?.id}`, data)
      : this.http.post('api/licenses', data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.isModalVisible = false;
        this.loadLicenses();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // Confirm dialog
  isConfirmVisible = false;
  licenseToDelete: License | null = null;

  confirmDelete(license: License): void {
    this.licenseToDelete = license;
    this.isConfirmVisible = true;
  }

  onDeleteConfirmed(): void {
    if (this.licenseToDelete?.id) {
      this.http.delete(`api/licenses/${this.licenseToDelete.id}`).subscribe({
        next: () => {
          this.loadLicenses();
          this.licenseToDelete = null;
        },
      });
    }
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.licenseToDelete) return '';
    return `Bạn có chắc chắn muốn xóa license "${this.licenseToDelete.licenseKey}"?`;
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadLicenses();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadLicenses();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadLicenses();
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadLicenses();
  }

  onReset(): void {
    this.filterData = {};
    this.loadLicenses();
  }
}
