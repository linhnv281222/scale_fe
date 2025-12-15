import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Template, TemplateType } from '../../models';
import { HttpService } from '../../services/http.service';
import { ConfigService } from '../../services/config.service';
import { PageActionService } from '../../services/page-action.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css'],
})
export class TemplatesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  templates: Template[] = [];
  allTemplates: Template[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 10;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  saving = false;
  selectedTemplate: Template | null = null;

  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  templateForm!: FormGroup;
  templateTypes = TemplateType;

  // Filter data
  filterData: any = {
    type: null,
  };

  filterFields: FilterField[] = [
    {
      key: 'type',
      label: 'templates.type',
      type: 'select',
      placeholder: 'templates.selectType',
      options: [
        { label: 'templates.scaleReport', value: TemplateType.SCALE_REPORT },
        { label: 'templates.shiftReport', value: TemplateType.SHIFT_REPORT },
      ],
    },
  ];

  constructor(
    private http: HttpService,
    private configService: ConfigService,
    private fb: FormBuilder,
    private pageActionService: PageActionService
  ) {
    this.templateForm = this.fb.group({
      name: ['', Validators.required],
      type: [TemplateType.SCALE_REPORT, Validators.required],
      content: [''],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    this.loadConfigs();
    this.loadTemplates();
    this.pageActionService.addNew$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.openAddModal();
      });
  }

  loadConfigs(): void {
    this.loadingConfigs = true;
    this.configService.getModuleFields('templates').subscribe({
      next: (fields) => {
        this.formFields = fields;
        this.loadingConfigs = false;
      },
      error: () => {
        this.formFields = [];
        this.loadingConfigs = false;
      },
    });

    this.configService.getModuleColumns('templates').subscribe({
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

  loadTemplates(): void {
    this.loading = true;
    this.http
      .get<Template[]>('api/templates', {
        page: 1,
        size: 1000,
      })
      .subscribe({
        next: (data: any) => {
          this.allTemplates = Array.isArray(data) ? data : data?.data || [];
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  applyFilters(): void {
    let filtered = [...this.allTemplates];

    // Filter by type
    if (this.filterData.type) {
      filtered = filtered.filter((t) => t.type === this.filterData.type);
    }

    this.total = filtered.length;

    // Apply pagination
    const start = (this.pageIndex - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.templates = filtered.slice(start, end);
  }

  onSearch(filters: any): void {
    this.filterData = { ...filters };
    this.pageIndex = 1;
    this.applyFilters();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedTemplate = null;
    this.templateForm.reset({
      name: '',
      type: TemplateType.SCALE_REPORT,
      content: '',
      isActive: true,
    });
    this.isModalVisible = true;
  }

  openEditModal(template: Template): void {
    this.isEditMode = true;
    this.selectedTemplate = template;
    // Map template data to form fields or fallback to form
    if (this.formFields.length > 0) {
      const dataTemplate: any = {};
      this.formFields.forEach((field) => {
        dataTemplate[field.fieldKey] = (template as any)[field.fieldKey] || '';
      });
      this.templateForm.patchValue(dataTemplate);
    } else {
      this.templateForm.patchValue({
        name: template.name,
        type: template.type,
        content: template.content || '',
        isActive: template.isActive,
      });
    }
    this.isModalVisible = true;
  }

  saveTemplate(): void {
    if (this.templateForm.invalid) {
      return;
    }

    this.saving = true;
    const data = this.templateForm.value;

    const request = this.isEditMode
      ? this.http.put(`api/templates/${this.selectedTemplate?.id}`, data)
      : this.http.post('api/templates', data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.isModalVisible = false;
        this.loadTemplates();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  getTemplateTypeLabel(type: TemplateType): string {
    return type === TemplateType.SCALE_REPORT
      ? 'templates.scaleReport'
      : 'templates.shiftReport';
  }

  // Confirm dialog
  isConfirmVisible = false;
  templateToDelete: Template | null = null;

  confirmDelete(template: Template): void {
    this.templateToDelete = template;
    this.isConfirmVisible = true;
  }

  onDeleteConfirmed(): void {
    if (this.templateToDelete?.id) {
      this.http.delete(`api/templates/${this.templateToDelete.id}`).subscribe({
        next: () => {
          this.loadTemplates();
          this.templateToDelete = null;
        },
      });
    }
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.templateToDelete) return '';
    return `Bạn có chắc chắn muốn xóa biểu mẫu "${this.templateToDelete.name}"?`;
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.applyFilters();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.applyFilters();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.applyFilters();
  }
}
