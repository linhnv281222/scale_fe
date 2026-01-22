import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { saveAs } from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportTemplateImport, TemplateType } from '../../models';
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
  templates: ReportTemplateImport[] = [];
  allTemplates: ReportTemplateImport[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 10;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  isViewMode = false;
  saving = false;
  selectedTemplate: ReportTemplateImport | null = null;
  templateDetail: any = null;
  downloadingTemplateId: number | null = null;

  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  templateForm!: FormGroup;
  templateTypes = TemplateType;

  // Filter data
  filterData: any = {
    templateType: null,
  };
  sidebarVisible = true;
  sidebarSize = 260; // Pixel

  filterFields: FilterField[] = [
    {
      key: 'templateType',
      label: 'templates.type',
      type: 'select',
      placeholder: 'templates.selectType',
      options: [
        { label: 'templates.scaleReport', value: 'Báo cáo cân' },
        { label: 'templates.shiftReport', value: 'Báo cáo ca' },
      ],
    },
  ];

  constructor(
    private templateService: TemplateService,
    private configService: ConfigService,
    private fb: FormBuilder,
    private pageActionService: PageActionService,
    private toastr: ToastrService
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
      // Load templates with optional filter by templateType
      const templateType = this.filterData.templateType || undefined;
      const templates = await this.templateService.getTemplateImports(
        templateType
      );
      // Pre-calculate display values to avoid calling functions in template
      this.allTemplates = templates.map((template) => ({
        ...template,
        templateTypeLabel: this.getTemplateTypeLabel(template.templateType),
        fileSizeFormatted: this.formatFileSize(template.fileSizeBytes),
      }));
      this.applyFilters();
    } catch (error) {
      this.allTemplates = [];
    } finally {
      this.loading = false;
    }
  }

  applyFilters(): void {
    let filtered = [...this.allTemplates];

    // Filter by templateType
    if (this.filterData.templateType) {
      filtered = filtered.filter(
        (t) => t.templateType === this.filterData.templateType
      );
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

  // Import template modal
  isImportModalVisible = false;
  importForm!: FormGroup;
  selectedFiles: File[] = [];

  openAddModal(): void {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedTemplate = null;
    this.selectedFiles = [];
    this.importForm = this.fb.group({
      templateCode: ['', Validators.required],
      templateName: ['', Validators.required],
      description: [''],
      titleTemplate: [''],
      importNotes: [''],
      isActive: [true],
      templateType: ['Báo cáo cân', Validators.required],
    });
    this.isImportModalVisible = true;
  }

  async viewTemplate(template: ReportTemplateImport): Promise<void> {
    this.isViewMode = true;
    this.isEditMode = false;
    // Pre-calculate display values to avoid calling functions in template
    this.selectedTemplate = {
      ...template,
      templateTypeLabel: this.getTemplateTypeLabel(template.templateType),
      fileSizeFormatted: this.formatFileSize(template.fileSizeBytes),
    };
    this.templateDetail = null;

    if (template.id) {
      try {
        const detail = await this.templateService.getTemplateImportById(
          template.id
        );
        if (detail) {
          this.templateDetail = detail;
        }
      } catch (error) {
        console.error('Error loading template detail:', error);
      }
    }

    this.isModalVisible = true;
  }

  openEditModal(template: ReportTemplateImport): void {
    // Edit is not supported for imported templates, use view instead
    this.viewTemplate(template);
  }

  async saveTemplate(): Promise<void> {
    if (this.importForm && this.importForm.invalid) {
      Object.keys(this.importForm.controls).forEach((key) => {
        const control = this.importForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
          control.markAsDirty();
        }
      });
      this.toastr.warning(
        'Vui lòng điền đầy đủ các trường bắt buộc',
        'Cảnh báo'
      );
      return;
    }
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      this.toastr.warning('Vui lòng chọn file để upload', 'Cảnh báo');
      return;
    }

    this.saving = true;
    try {
      const formData = new FormData();
      formData.append('file', this.selectedFiles[0]); // Only take first file
      formData.append('templateCode', this.importForm.value.templateCode);
      formData.append('templateName', this.importForm.value.templateName);
      if (this.importForm.value.description) {
        formData.append('description', this.importForm.value.description);
      }
      if (this.importForm.value.titleTemplate) {
        formData.append('titleTemplate', this.importForm.value.titleTemplate);
      }
      if (this.importForm.value.importNotes) {
        formData.append('importNotes', this.importForm.value.importNotes);
      }
      formData.append('isActive', this.importForm.value.isActive);
      formData.append('templateType', this.importForm.value.templateType);

      const result = await this.templateService.importTemplate(formData);
      if (result) {
        this.toastr.success('Nhập biểu mẫu thành công', 'Thành công');
        this.isImportModalVisible = false;
        this.selectedFiles = [];
        await this.loadTemplates();
      }
    } catch (error: any) {
      const errorMessage =
        error?.error?.message ||
        error?.message ||
        'Đã có lỗi xảy ra, vui lòng thử lại';
      this.toastr.error(errorMessage, 'Lỗi');
    } finally {
      this.saving = false;
    }
  }

  onFilesChanged(files: File[]): void {
    this.selectedFiles = files;
  }

  isRequiredFieldEmpty(fieldName: string): boolean {
    if (!this.importForm) {
      return false;
    }
    const control = this.importForm.get(fieldName);
    if (!control) {
      return false;
    }
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return true;
    }
    return false;
  }

  isFileRequiredEmpty(): boolean {
    return !this.selectedFiles || this.selectedFiles.length === 0;
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getTemplateTypeLabel(templateType: string | null | undefined): string {
    if (templateType === 'Báo cáo cân') {
      return 'templates.scaleReport';
    } else if (templateType === 'Báo cáo ca') {
      return 'templates.shiftReport';
    }
    return '';
  }

  // Download template
  async downloadTemplate(template: ReportTemplateImport): Promise<void> {
    if (!template.id) {
      return;
    }

    this.downloadingTemplateId = template.id;
    try {
      const blob = await this.templateService.downloadTemplate(template.id);
      const fileName =
        template.originalFilename ||
        `${template.templateCode || 'template'}.docx`;
      saveAs(blob, fileName);
      this.toastr.success('Tải file thành công', 'Thành công');
    } catch (error: any) {
      const errorMessage =
        error?.error?.message || error?.message || 'Không thể tải file';
      this.toastr.error(errorMessage, 'Lỗi');
    } finally {
      this.downloadingTemplateId = null;
    }
  }

  // Archive template
  isConfirmArchiveVisible = false;
  templateToArchive: ReportTemplateImport | null = null;

  confirmArchive(template: ReportTemplateImport): void {
    this.templateToArchive = template;
    this.isConfirmArchiveVisible = true;
  }

  async onArchiveConfirmed(): Promise<void> {
    if (this.templateToArchive?.id) {
      try {
        await this.templateService.archiveTemplate(this.templateToArchive.id);
        this.toastr.success('Lưu trữ biểu mẫu thành công', 'Thành công');
        await this.loadTemplates();
        this.templateToArchive = null;
        this.isConfirmArchiveVisible = false;
      } catch (error: any) {
        const errorMessage =
          error?.error?.message ||
          error?.message ||
          'Đã có lỗi xảy ra, vui lòng thử lại';
        this.toastr.error(errorMessage, 'Lỗi');
      }
    }
  }

  // Confirm dialog (for delete - not used for imported templates)
  isConfirmVisible = false;
  templateToDelete: ReportTemplateImport | null = null;

  confirmDelete(template: ReportTemplateImport): void {
    // Use archive instead of delete
    this.confirmArchive(template);
  }

  async onDeleteConfirmed(): Promise<void> {
    // Use archive instead
    await this.onArchiveConfirmed();
  }

  closeViewModal(): void {
    this.isModalVisible = false;
    this.isViewMode = false;
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.templateToDelete) return '';
    return `Bạn có chắc chắn muốn xóa biểu mẫu "${this.templateToDelete.originalFilename ||
      this.templateToDelete.templateCode
      }"?`;
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

  // Getter for archive message
  get archiveMessage(): string {
    if (!this.templateToArchive) return '';
    return `Bạn có chắc chắn muốn lưu trữ biểu mẫu "${this.templateToArchive.originalFilename ||
      this.templateToArchive.templateCode
      }"?`;
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
