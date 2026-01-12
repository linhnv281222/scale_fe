import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConfigDataType } from '../../../models';

export interface DynamicFormField {
  fieldKey: string;
  displayName: string;
  dataType: ConfigDataType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number; // For textarea
  multiple?: boolean; // For multiselect
  disabled?: boolean; // Field-specific disable flag
}

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css'],
})
export class DynamicFormComponent implements OnInit {
  @Input() fields: DynamicFormField[] = [];
  @Input() model: any = {};
  @Input() disabled: boolean = false;
  @Output() modelChange = new EventEmitter<any>();
  @Output() fieldChange = new EventEmitter<{ fieldKey: string; value: any }>();

  ConfigDataType = ConfigDataType;

  ngOnInit(): void {
    // Initialize model with default values if not set
    if (!this.model) {
      this.model = {};
    }
    this.fields.forEach((field) => {
      if (this.model[field.fieldKey] === undefined) {
        this.model[field.fieldKey] = this.getDefaultValue(field);
      }
    });
  }

  getDefaultValue(field: DynamicFormField): any {
    switch (field.dataType) {
      case ConfigDataType.NUMBER:
      case ConfigDataType.INTEGER:
      case ConfigDataType.DECIMAL:
        return 0;
      case ConfigDataType.BOOLEAN:
        return false;
      case ConfigDataType.DATETIME:
      case ConfigDataType.DATE:
      case ConfigDataType.TIME:
        return null;
      case ConfigDataType.MULTISELECT:
        return [];
      default:
        return '';
    }
  }

  onFieldChange(fieldKey: string, value: any): void {
    this.model[fieldKey] = value;
    this.modelChange.emit({ ...this.model });
    this.fieldChange.emit({ fieldKey, value });
  }

  getFieldValue(fieldKey: string): any {
    return this.model[fieldKey];
  }

  isFieldRequired(field: DynamicFormField): boolean {
    return field.required || false;
  }

  isFieldEmpty(field: DynamicFormField): boolean {
    const value = this.model[field.fieldKey];
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return true;
    }
    if (Array.isArray(value) && value.length === 0) {
      return true;
    }
    return false;
  }

  isFieldInvalid(field: DynamicFormField): boolean {
    return this.isFieldRequired(field) && this.isFieldEmpty(field);
  }
}
