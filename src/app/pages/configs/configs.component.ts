import { Component, OnInit } from '@angular/core';
import { Config, ConfigDataType, ConfigCategory } from '../../models';
import { HttpService } from '../../services/http.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';
import { TableColumn } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-configs',
  templateUrl: './configs.component.html',
  styleUrls: ['./configs.component.css'],
})
export class ConfigsComponent implements OnInit {
  // List of modules/functions in the system
  modules: any[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  filterData: any = {};

  // Modal for managing fields of a module
  isFieldsModalVisible = false;
  selectedModule: any = null;
  moduleFields: Config[] = [];
  fieldsLoading = false;
  
  saving = false;

  // Inline editing
  isEditMode = false;
  editingFields: Map<number | string, Config> = new Map(); // Use string for new fields (tempId)
  newFieldCounter = 0; // Counter for generating temp IDs for new fields

  ConfigDataType = ConfigDataType;
  ConfigCategory = ConfigCategory;

  filterFields: FilterField[] = [
    {
      key: 'moduleName',
      label: 'configs.module',
      type: 'text',
      placeholder: 'configs.module',
    },
  ];

  constructor(private http: HttpService) {}

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules(): void {
    this.loading = true;
    // Load all configs to group by module
    this.http.get<Config[]>('api/configs', {}).subscribe({
      next: (data: any) => {
        const allConfigs = Array.isArray(data) ? data : (data?.data || []);
        
        // Group configs by module and create module list
        const moduleMap = new Map<string, any>();
        
        // Add system configs
        moduleMap.set('system', {
          id: 'system',
          name: 'Hệ thống',
          code: 'system',
          fieldCount: allConfigs.filter((c: Config) => c.module === 'system' && c.category === ConfigCategory.SYSTEM_CONFIG).length,
        });

        // Group field metadata by module
        allConfigs
          .filter((c: Config) => c.category === ConfigCategory.FIELD_METADATA && c.module)
          .forEach((config: Config) => {
            if (!moduleMap.has(config.module!)) {
              const moduleName = this.getModuleDisplayName(config.module!);
              moduleMap.set(config.module!, {
                id: config.module,
                name: moduleName,
                code: config.module,
                fieldCount: 0,
              });
            }
            const module = moduleMap.get(config.module!);
            module.fieldCount++;
          });

        this.modules = Array.from(moduleMap.values());
        this.total = this.modules.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getModuleDisplayName(moduleCode: string): string {
    const moduleNames: { [key: string]: string } = {
      'users': 'Quản lý Tài khoản',
      'scales': 'Quản lý Cân',
      'locations': 'Quản lý Vị trí',
      'shifts': 'Quản lý Ca',
      'system': 'Hệ thống',
    };
    return moduleNames[moduleCode] || moduleCode;
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadModules();
  }

  onReset(): void {
    this.filterData = {};
    this.loadModules();
  }

  // Open modal to manage fields of a module
  openFieldsModal(module: any): void {
    this.selectedModule = module;
    this.isFieldsModalVisible = true;
    this.isEditMode = true; // Auto enter edit mode
    this.editingFields.clear();
    this.newFieldCounter = 0;
    this.loadModuleFields();
  }

  loadModuleFields(): void {
    this.fieldsLoading = true;
    this.http.get<Config[]>('api/configs', { module: this.selectedModule.code }).subscribe({
      next: (data: any) => {
        const allConfigs = Array.isArray(data) ? data : (data?.data || []);
        // Filter only field metadata for this module, or system configs if module is system
        if (this.selectedModule.code === 'system') {
          this.moduleFields = allConfigs.filter((c: Config) => 
            c.module === 'system' && c.category === ConfigCategory.SYSTEM_CONFIG
          );
        } else {
          this.moduleFields = allConfigs.filter((c: Config) => 
            c.module === this.selectedModule.code && c.category === ConfigCategory.FIELD_METADATA
          );
        }
        // Initialize editing fields with current values
        if (this.isEditMode) {
          this.editingFields.clear();
          this.moduleFields.forEach((field) => {
            if (field.id) {
              this.editingFields.set(field.id, { ...field });
            }
          });
        }
        this.fieldsLoading = false;
      },
      error: () => {
        this.fieldsLoading = false;
      },
    });
  }

  // Add new field row
  addNewField(): void {
    const newField: Config = {
      id: undefined,
      key: '',
      value: '',
      fieldKey: '',
      displayName: '',
      dataType: ConfigDataType.STRING,
      description: '',
      required: false,
      width: '150px',
      category: this.selectedModule.code === 'system' ? ConfigCategory.SYSTEM_CONFIG : ConfigCategory.FIELD_METADATA,
      module: this.selectedModule.code,
    };
    this.moduleFields.push(newField);
    // The tempId will be created when getFieldId is called
  }

  cancelEditMode(): void {
    this.isEditMode = false;
    this.editingFields.clear();
  }

  saveAllFields(): void {
    if (this.editingFields.size === 0) {
      return;
    }

    this.saving = true;
    const updatePromises: any[] = [];
    const createPromises: any[] = [];

    this.editingFields.forEach((field, id) => {
      const fieldKey = field.fieldKey || '';
      if (!fieldKey) {
        return; // Skip empty fields
      }

      const data: any = {
        key: `${this.selectedModule.code}.${fieldKey}`,
        value: fieldKey,
        dataType: field.dataType,
        description: field.description || '',
        required: field.required || false,
        width: field.width || '150px',
        category: this.selectedModule.code === 'system' ? ConfigCategory.SYSTEM_CONFIG : ConfigCategory.FIELD_METADATA,
        module: this.selectedModule.code,
        fieldKey: fieldKey,
        displayName: field.displayName || '',
      };

      // Check if it's a new field (tempId starts with 'new-') or existing field
      if (typeof id === 'string' && id.startsWith('new-')) {
        // New field - create
        createPromises.push(this.http.post('api/configs', data).toPromise());
      } else {
        // Existing field - update
        updatePromises.push(this.http.put(`api/configs/${id}`, data).toPromise());
      }
    });

    Promise.all([...updatePromises, ...createPromises]).then(() => {
      this.saving = false;
      this.isEditMode = false;
      this.editingFields.clear();
      this.newFieldCounter = 0;
      this.loadModuleFields();
      this.loadModules(); // Refresh module list to update field count
    }).catch(() => {
      this.saving = false;
    });
  }

  getFieldId(field: Config, index: number): number | string {
    if (field.id) {
      return field.id;
    }
    // For new fields, use index-based tempId
    // Check if we already have a tempId for this index
    const tempId = `new-${index}`;
    if (!this.editingFields.has(tempId)) {
      // Initialize with current field values
      this.editingFields.set(tempId, { ...field });
    }
    return tempId;
  }

  getEditingField(field: Config, index: number): Config | null {
    const fieldId = this.getFieldId(field, index);
    return this.editingFields.get(fieldId) || null;
  }

  updateEditingField(field: Config, property: string, value: any, index: number): void {
    const fieldId = this.getFieldId(field, index);
    let editingField = this.editingFields.get(fieldId);
    
    if (!editingField) {
      // Create new editing field if not exists
      editingField = { ...field };
    }
    
    (editingField as any)[property] = value;
    this.editingFields.set(fieldId, editingField);
    
    // Also update the field in moduleFields for immediate UI update
    (field as any)[property] = value;
  }

  deleteField(field: Config, index: number): void {
    // If it's a new field (not saved yet), just remove from arrays
    if (!field.id) {
      const tempId = `new-${index}`;
      this.editingFields.delete(tempId);
      this.moduleFields = this.moduleFields.filter((f, i) => i !== index);
      return;
    }
    
    // For existing fields, show confirm dialog
    this.confirmDeleteField(field);
  }

  // Confirm dialog for field deletion
  isConfirmVisible = false;
  fieldToDelete: Config | null = null;

  confirmDeleteField(field: Config): void {
    this.fieldToDelete = field;
    this.isConfirmVisible = true;
  }

  onDeleteFieldConfirmed(): void {
    if (this.fieldToDelete?.id) {
      this.http.delete(`api/configs/${this.fieldToDelete.id}`).subscribe({
        next: () => {
          // Remove from editingFields if exists
          this.editingFields.delete(this.fieldToDelete!.id!);
          this.loadModuleFields();
          this.loadModules(); // Refresh module list
          this.fieldToDelete = null;
        },
      });
    }
  }

  // Getter for delete field message
  get deleteFieldMessage(): string {
    if (!this.fieldToDelete) return '';
    return `Bạn có chắc chắn muốn xóa trường "${this.fieldToDelete.displayName || this.fieldToDelete.fieldKey}"?`;
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadModules();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadModules();
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadModules();
  }

  // Getter for filtered modules
  get filteredModules(): any[] {
    let filtered = this.modules;
    if (this.filterData?.moduleName) {
      filtered = filtered.filter((m: any) =>
        m.name.toLowerCase().includes(this.filterData.moduleName.toLowerCase())
      );
    }
    return filtered;
  }
}
