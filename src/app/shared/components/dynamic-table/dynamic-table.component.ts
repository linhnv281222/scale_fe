import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import * as moment from 'moment';
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
export class DynamicTableComponent implements OnChanges {
  @Input() columns: DynamicTableColumn[] = [];
  @Input() set data(value: any[]) {
    this._data = value;
    this.formatData();
  }
  get data(): any[] {
    return this._data;
  }
  private _data: any[] = [];
  formattedData: any[] = [];
  @Input() loading: boolean = false;
  @Input() showActions: boolean = true;
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();

  formatData(): void {
    if (!this._data || !this.columns) {
      this.formattedData = [];
      return;
    }
    this.formattedData = this._data.map(row => {
      const formattedRow: any = { ...row };
      formattedRow._formatted = {};
      this.columns.forEach(col => {
        const value = row[col.fieldKey];
        if (col.formatter) {
          formattedRow._formatted[col.fieldKey] = col.formatter(value);
        } else if (value === null || value === undefined) {
          formattedRow._formatted[col.fieldKey] = '-';
        } else if (value instanceof Date) {
          formattedRow._formatted[col.fieldKey] = moment(value).format('DD/MM/YYYY HH:mm:ss');
        } else {
          formattedRow._formatted[col.fieldKey] = String(value);
        }
      });
      return formattedRow;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns'] || changes['data']) {
      this.formatData();
    }
  }
}

