import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'custom' | 'multiselect';
  placeholder?: string;
  options?: { label: string; value: any }[];
  template?: TemplateRef<any>;
  format?: string;
  showTime?: boolean;
  multiple?: boolean;
  onChange?: (value: any) => void;
}

@Component({
  selector: 'app-filter-sidebar',
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.css']
})
export class FilterSidebarComponent {
  @Input() title = 'filter.title';
  @Input() fields: FilterField[] = [];
  @Input() filterData: any = {};
  @Output() search = new EventEmitter<any>();
  @Output() reset = new EventEmitter<void>();

  onSearch(): void {
    // Convert dateRange fields from array [Date, Date] to separate From/To fields
    const processedData = { ...this.filterData };
    this.fields.forEach(field => {
      if (field.type === 'dateRange' && processedData[field.key]) {
        const dateRange = processedData[field.key];
        if (Array.isArray(dateRange) && dateRange.length === 2) {
          processedData[field.key + 'From'] = dateRange[0];
          processedData[field.key + 'To'] = dateRange[1];
        }
        // Remove the array field to avoid confusion
        delete processedData[field.key];
      }
    });
    this.search.emit(processedData);
  }

  onReset(): void {
    this.filterData = {};
    this.reset.emit();
  }
}

