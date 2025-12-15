import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Config, ConfigCategory, ConfigDataType } from '../models';
import { HttpService } from './http.service';
import { DynamicFormField } from '../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../shared/components/dynamic-table/dynamic-table.component';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private configsCache: Config[] = [];

  constructor(private http: HttpService) {}

  /**
   * Load all configs for a specific module
   */
  loadModuleConfigs(module: string): Observable<Config[]> {
    return this.http.get<Config[]>('api/configs', { module, category: ConfigCategory.FIELD_METADATA }).pipe(
      map((data: any) => {
        const configs = Array.isArray(data) ? data : (data?.data || []);
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
          placeholder: `Nhập ${(config.displayName || config.fieldKey || config.key).toLowerCase()}`,
          description: config.description,
        };

        // Parse options if value contains JSON array
        if (config.value && (config.dataType === ConfigDataType.SELECT || config.dataType === ConfigDataType.MULTISELECT)) {
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
          case ConfigDataType.DATE:
            column.formatter = (value: any) => {
              if (!value) return '-';
              const date = new Date(value);
              return date.toLocaleString('vi-VN');
            };
            break;
          case ConfigDataType.BOOLEAN:
            column.formatter = (value: any) => (value ? 'Có' : 'Không');
            break;
          case ConfigDataType.NUMBER:
          case ConfigDataType.INTEGER:
          case ConfigDataType.DECIMAL:
            column.formatter = (value: any) => (value !== null && value !== undefined ? value.toString() : '-');
            break;
        }

        return column;
      });
  }

  /**
   * Get field metadata for a module
   */
  getModuleFields(module: string): Observable<DynamicFormField[]> {
    return this.loadModuleConfigs(module).pipe(map((configs) => this.convertToFormFields(configs)));
  }

  /**
   * Get table columns for a module
   */
  getModuleColumns(module: string): Observable<DynamicTableColumn[]> {
    return this.loadModuleConfigs(module).pipe(map((configs) => this.convertToTableColumns(configs)));
  }

  /**
   * Get display name for a field key
   */
  getDisplayName(module: string, fieldKey: string): string {
    const config = this.configsCache.find(
      (c) => c.module === module && (c.fieldKey === fieldKey || c.key.endsWith(`.${fieldKey}`))
    );
    return config?.displayName || fieldKey;
  }
}

