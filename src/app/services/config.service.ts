import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Config, ConfigCategory, ConfigDataType } from '../models';
import { DynamicFormField } from '../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../shared/components/dynamic-table/dynamic-table.component';
import { FilterField } from '../shared/components/filter-sidebar/filter-sidebar.component';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private configsCache: Config[] = [];

  constructor(private baseApi: BaseApiService) {}

  /**
   * Load all configs for a specific module
   */
  loadModuleConfigs(module: string): Observable<Config[]> {
    return this.baseApi
      .get<{ data: Config[] }>('configs', {
        module,
        category: ConfigCategory.FIELD_METADATA,
      })
      .pipe(
        map((data: any) => {
          const configs = Array.isArray(data) ? data : data?.data || [];
          this.configsCache = configs;
          return configs;
        })
      );
  }

  /**
   * Convert Config[] to DynamicFormField[]
   */
  convertToFormFields(configs: Config[]): DynamicFormField[] {
    return configs
      .filter((config) => config.category === ConfigCategory.FIELD_METADATA)
      .map((config) => {
        const field: DynamicFormField = {
          fieldKey: config.fieldKey || config.key.split('.').pop() || '',
          displayName: config.displayName || config.fieldKey || config.key,
          dataType: config.dataType,
          required: config.required || false,
          placeholder: `Nhập ${(
            config.displayName ||
            config.fieldKey ||
            config.key
          ).toLowerCase()}`,
          description: config.description,
        };

        // Parse options if value contains JSON array
        if (
          config.value &&
          (config.dataType === ConfigDataType.SELECT ||
            config.dataType === ConfigDataType.MULTISELECT)
        ) {
          try {
            const parsed = JSON.parse(config.value);
            if (Array.isArray(parsed)) {
              field.options = parsed;
            }
          } catch (e) {
            // If not JSON, treat as comma-separated values
            field.options = config.value.split(',').map((v: string) => ({
              label: v.trim(),
              value: v.trim(),
            }));
          }
        }

        return field;
      });
  }

  /**
   * Convert Config[] to DynamicTableColumn[]
   */
  convertToTableColumns(configs: Config[]): DynamicTableColumn[] {
    return configs
      .filter((config) => config.category === ConfigCategory.FIELD_METADATA)
      .map((config) => {
        const column: DynamicTableColumn = {
          fieldKey: config.fieldKey || config.key.split('.').pop() || '',
          displayName: config.displayName || config.fieldKey || config.key,
          dataType: config.dataType,
          required: config.required || false,
          width: config.width || '150px',
        };

        // Add formatter based on data type
        switch (config.dataType) {
          case ConfigDataType.DATETIME:
            column.formatter = (value: any) => {
              if (!value) return '-';
              const date = new Date(value);
              return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
            };
            break;
          case ConfigDataType.DATE:
            column.formatter = (value: any) => {
              if (!value) return '-';
              const date = new Date(value);
              return date.toLocaleDateString('vi-VN');
            };
            break;
          case ConfigDataType.TIME:
            column.formatter = (value: any) => {
              if (!value) return '-';
              if (value instanceof Date) {
                return value.toLocaleTimeString('vi-VN');
              }
              // If value is string like "HH:mm:ss" or "HH:mm"
              if (typeof value === 'string') {
                return value;
              }
              return String(value);
            };
            break;
          case ConfigDataType.BOOLEAN:
            column.formatter = (value: any) => (value ? 'Có' : 'Không');
            break;
          case ConfigDataType.NUMBER:
          case ConfigDataType.INTEGER:
          case ConfigDataType.DECIMAL:
            column.formatter = (value: any) =>
              value !== null && value !== undefined ? value.toString() : '-';
            break;
          case ConfigDataType.SELECT:
            column.formatter = (value: any) => {
              if (value === null || value === undefined) return '-';
              return String(value);
            };
            break;
          case ConfigDataType.MULTISELECT:
            column.formatter = (value: any) => {
              if (!value) return '-';
              if (Array.isArray(value)) {
                return value.join(', ');
              }
              return String(value);
            };
            break;
          case ConfigDataType.TEXTAREA:
            column.formatter = (value: any) => {
              if (!value) return '-';
              const str = String(value);
              // Truncate long textarea content
              return str.length > 100 ? str.substring(0, 100) + '...' : str;
            };
            break;
          case ConfigDataType.STRING:
          default:
            column.formatter = (value: any) => {
              if (value === null || value === undefined) return '-';
              return String(value);
            };
            break;
        }

        return column;
      });
  }

  /**
   * Get field metadata for a module
   */
  getModuleFields(module: string): Observable<DynamicFormField[]> {
    return this.loadModuleConfigs(module).pipe(
      map((configs) => this.convertToFormFields(configs))
    );
  }

  /**
   * Get table columns for a module
   */
  getModuleColumns(module: string): Observable<DynamicTableColumn[]> {
    return this.loadModuleConfigs(module).pipe(
      map((configs) => this.convertToTableColumns(configs))
    );
  }

  /**
   * Get display name for a field key
   */
  getDisplayName(module: string, fieldKey: string): string {
    const config = this.configsCache.find(
      (c) =>
        c.module === module &&
        (c.fieldKey === fieldKey || c.key.endsWith(`.${fieldKey}`))
    );
    return config?.displayName || fieldKey;
  }

  convertToFilterFields(configs: Config[]): FilterField[] {
    // Filter only queryable fields
    const queryableConfigs = configs.filter(
      (config) =>
        config.queryable === true &&
        config.category === ConfigCategory.FIELD_METADATA
    );

    // Sort: DATE and DATETIME first, then others
    const sortedConfigs = queryableConfigs.sort((a, b) => {
      const aIsDate =
        a.dataType === ConfigDataType.DATE ||
        a.dataType === ConfigDataType.DATETIME;
      const bIsDate =
        b.dataType === ConfigDataType.DATE ||
        b.dataType === ConfigDataType.DATETIME;

      if (aIsDate && !bIsDate) return -1;
      if (!aIsDate && bIsDate) return 1;
      return 0;
    });

    return sortedConfigs.map((config) => {
      const fieldKey = config.fieldKey || config.key.split('.').pop() || '';
      const filterField: FilterField = {
        key: fieldKey,
        label: config.displayName || fieldKey,
        type: this.mapDataTypeToFilterType(config.dataType),
        placeholder: config.displayName || fieldKey,
      };

      // Handle date range for DATETIME
      if (config.dataType === ConfigDataType.DATETIME) {
        filterField.type = 'dateRange';
        filterField.format = 'dd/MM/yyyy HH:mm';
        filterField.showTime = true;
      } else if (config.dataType === ConfigDataType.DATE) {
        filterField.type = 'dateRange';
        filterField.format = 'dd/MM/yyyy';
        filterField.showTime = false;
      }

      // Handle TIME - use text input (filter-sidebar doesn't have time picker)
      // User can enter time in format HH:mm:ss or HH:mm
      if (config.dataType === ConfigDataType.TIME) {
        filterField.type = 'text';
        filterField.placeholder =
          (filterField.placeholder || '') + ' (HH:mm:ss)';
      }

      // Handle NUMBER, INTEGER, DECIMAL - use text input with number validation
      if (
        config.dataType === ConfigDataType.NUMBER ||
        config.dataType === ConfigDataType.INTEGER ||
        config.dataType === ConfigDataType.DECIMAL
      ) {
        filterField.type = 'text';
        // Could add validation hint in placeholder
      }

      // Handle TEXTAREA - use text input (filter doesn't need textarea)
      if (config.dataType === ConfigDataType.TEXTAREA) {
        filterField.type = 'text';
      }

      // Handle BOOLEAN - use select with Yes/No options
      if (config.dataType === ConfigDataType.BOOLEAN) {
        filterField.type = 'select';
        filterField.options = [
          { label: 'Có', value: true },
          { label: 'Không', value: false },
        ];
      }

      // Handle SELECT and MULTISELECT options
      if (
        config.dataType === ConfigDataType.SELECT ||
        config.dataType === ConfigDataType.MULTISELECT
      ) {
        if (config.value) {
          try {
            const parsed = JSON.parse(config.value);
            if (Array.isArray(parsed)) {
              filterField.options = parsed.map((v: any) => ({
                label:
                  typeof v === 'string' ? v : v.label || v.value || String(v),
                value:
                  typeof v === 'string' ? v : v.value || v.label || String(v),
              }));
            }
          } catch (e) {
            // If not JSON, treat as comma-separated values
            filterField.options = config.value.split(',').map((v: string) => ({
              label: v.trim(),
              value: v.trim(),
            }));
          }
        }
      }

      // Set multiselect mode for MULTISELECT
      if (config.dataType === ConfigDataType.MULTISELECT) {
        filterField.type = 'multiselect';
      }

      return filterField;
    });
  }

  /**
   * Map ConfigDataType to FilterField type
   */
  private mapDataTypeToFilterType(
    dataType: ConfigDataType
  ): 'text' | 'select' | 'date' | 'dateRange' | 'custom' | 'multiselect' {
    switch (dataType) {
      case ConfigDataType.DATE:
      case ConfigDataType.DATETIME:
        return 'dateRange';
      case ConfigDataType.SELECT:
        return 'select';
      case ConfigDataType.MULTISELECT:
        return 'multiselect';
      case ConfigDataType.BOOLEAN:
        return 'select'; // Boolean as select with Yes/No options
      case ConfigDataType.NUMBER:
      case ConfigDataType.INTEGER:
      case ConfigDataType.DECIMAL:
      case ConfigDataType.STRING:
      case ConfigDataType.TEXTAREA:
      default:
        return 'text';
    }
  }

  /**
   * Get filter fields for a module (only queryable fields)
   */
  getModuleFilterFields(module: string): Observable<FilterField[]> {
    return this.loadModuleConfigs(module).pipe(
      map((configs) => this.convertToFilterFields(configs))
    );
  }
}
