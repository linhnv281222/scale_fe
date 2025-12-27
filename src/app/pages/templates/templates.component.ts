import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Template, TemplateType } from '../../models';
import { ConfigService } from '../../services/config.service';
import { PageActionService } from '../../services/page-action.service';
import { TemplateService } from '../../services/template.service';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

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
    private templateService: TemplateService,
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
    // this.loadConfigs();
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

  async loadTemplates(): Promise<void> {
    this.loading = true;
    try {
      const data = await this.templateService.getTemplates({
        page: 1,
        size: 1000,
      });
      this.allTemplates = data.data || [];
      this.applyFilters();
    } catch (error) {
      this.allTemplates = [];
    } finally {
      this.loading = false;
    }
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

  async saveTemplate(): Promise<void> {
    if (this.templateForm.invalid) {
      return;
    }

    this.saving = true;
    const data = this.templateForm.value;

    try {
      if (this.isEditMode && this.selectedTemplate?.id) {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
          formData.append(key, data[key]);
        });
        await this.templateService.updateTemplate(this.selectedTemplate.id, formData);
      } else {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
          formData.append(key, data[key]);
        });
        await this.templateService.createTemplate(formData);
      }
      this.isModalVisible = false;
      await this.loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      this.saving = false;
    }
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

  async onDeleteConfirmed(): Promise<void> {
    if (this.templateToDelete?.id) {
      try {
        await this.templateService.deleteTemplate(this.templateToDelete.id);
        await this.loadTemplates();
        this.templateToDelete = null;
      } catch (error) {
        console.error('Error deleting template:', error);
      }
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
