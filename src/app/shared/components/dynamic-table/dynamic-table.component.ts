import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Config } from '../../../models';

export interface DynamicTableColumn {
  fieldKey: string;
  displayName: string;
  dataType?: string;
  width?: string;
  required?: boolean; // Trường bắt buộc
  sortable?: boolean;
  formatter?: (value: any) => string;
}

@Component({
  selector: 'app-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.css'],
})
export class DynamicTableComponent {
  @Input() columns: DynamicTableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading: boolean = false;
  @Input() showActions: boolean = true;
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();

  getFieldValue(row: any, fieldKey: string): any {
    return row[fieldKey];
  }

  formatValue(value: any, column: DynamicTableColumn): string {
    if (column.formatter) {
      return column.formatter(value);
    }
    if (value === null || value === undefined) {
      return '-';
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return String(value);
  }

  getCellAlignment(column: DynamicTableColumn): string {
    // All cells are centered with flexbox, but content alignment is handled by CSS
    return '';
  }
}

