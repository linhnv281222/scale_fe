import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// Ng-Zorro Modules
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzResizableModule } from 'ng-zorro-antd/resizable';

// Components
import { FilterSidebarComponent } from './filter-sidebar/filter-sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { ModalComponent } from './modal/modal.component';
import { NoDataComponent } from './no-data/no-data.component';
import { PaginationComponent } from './pagination/pagination.component';
import { TableComponent } from './table/table.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { DynamicTableComponent } from './dynamic-table/dynamic-table.component';
import { UploadFileComponent } from './upload-file/upload-file.component';

@NgModule({
  declarations: [
    TableComponent,
    ModalComponent,
    PaginationComponent,
    FilterSidebarComponent,
    LayoutComponent,
    HeaderComponent,
    SidebarComponent,
    NoDataComponent,
    DynamicFormComponent,
    DynamicTableComponent,
    UploadFileComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    // Ng-Zorro Modules
    NzTableModule,
    NzButtonModule,
    NzCheckboxModule,
    NzIconModule,
    NzToolTipModule,
    NzTagModule,
    NzPaginationModule,
    NzSelectModule,
    NzEmptyModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzTimePickerModule,
    NzUploadModule,
    NzAvatarModule,
    NzDropDownModule,
    NzBadgeModule,
    NzMenuModule,
    NzDrawerModule,
    NzResizableModule,
    // Standalone Components
    ConfirmDialogComponent,
  ],
  exports: [
    TableComponent,
    ModalComponent,
    PaginationComponent,
    FilterSidebarComponent,
    LayoutComponent,
    HeaderComponent,
    SidebarComponent,
    NoDataComponent,
    ConfirmDialogComponent,
    DynamicFormComponent,
    DynamicTableComponent,
    UploadFileComponent,
    // Export Ng-Zorro Modules so page components can use them
    NzTableModule,
    NzButtonModule,
    NzCheckboxModule,
    NzIconModule,
    NzToolTipModule,
    NzTagModule,
    NzPaginationModule,
    NzSelectModule,
    NzEmptyModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzTimePickerModule,
    NzUploadModule,
    NzAvatarModule,
    NzDropDownModule,
    NzBadgeModule,
    NzMenuModule,
    NzDrawerModule,
    NzResizableModule,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
})
export class SharedModule {}
