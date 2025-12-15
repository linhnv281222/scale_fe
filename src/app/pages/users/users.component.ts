import { Component, OnInit } from '@angular/core';
import { User } from '../../models';
import { HttpService } from '../../services/http.service';
import { ConfigService } from '../../services/config.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  saving = false;
  selectedUser: User | null = null;
  filterData: any = {};

  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  // Form data object
  dataUser: any = {};

  filterFields: FilterField[] = [
    {
      key: 'username',
      label: 'users.username',
      type: 'text',
      placeholder: 'users.username',
    },
    {
      key: 'fullName',
      label: 'users.fullName',
      type: 'text',
      placeholder: 'users.fullName',
    },
    {
      key: 'status',
      label: 'common.status',
      type: 'select',
      placeholder: 'common.status',
      options: [
        { label: 'common.active', value: 'active' },
        { label: 'common.inactive', value: 'inactive' },
      ],
    },
  ];

  constructor(private http: HttpService, private configService: ConfigService) {}

  ngOnInit(): void {
    this.loadConfigs();
    this.loadUsers();
  }

  loadConfigs(): void {
    this.loadingConfigs = true;
    this.configService.getModuleFields('users').subscribe({
      next: (fields) => {
        this.formFields = fields;
        this.loadingConfigs = false;
      },
      error: () => {
        // Fallback to default fields if configs not available
        this.formFields = [
          { fieldKey: 'username', displayName: 'Tên đăng nhập', dataType: 'STRING' as any, required: true },
          { fieldKey: 'password', displayName: 'Mật khẩu', dataType: 'PASSWORD' as any, required: true },
          { fieldKey: 'fullName', displayName: 'Họ và tên', dataType: 'STRING' as any },
          { fieldKey: 'email', displayName: 'Email', dataType: 'EMAIL' as any },
        ];
        this.loadingConfigs = false;
      },
    });

    this.configService.getModuleColumns('users').subscribe({
      next: (columns) => {
        this.tableColumns = columns;
        // Add actions column
        this.tableColumns.push({ fieldKey: 'actions', displayName: 'Thao tác', width: '150px' });
      },
      error: () => {
        // Fallback to default columns
        this.tableColumns = [
          { fieldKey: 'username', displayName: 'Tên đăng nhập', width: '150px' },
          { fieldKey: 'fullName', displayName: 'Họ và tên' },
          { fieldKey: 'email', displayName: 'Email', width: '200px' },
          { fieldKey: 'status', displayName: 'Trạng thái', width: '120px' },
        ];
      },
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.http
      .get<User[]>('api/users', {
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      })
      .subscribe({
        next: (data: any) => {
          this.users = Array.isArray(data) ? data : data?.data || [];
          this.total = data?.total || this.users.length;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadUsers();
  }

  onReset(): void {
    this.filterData = {};
    this.loadUsers();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedUser = null;
    // Initialize dataUser with default values from form fields
    this.dataUser = {};
    this.formFields.forEach((field) => {
      this.dataUser[field.fieldKey] = '';
    });
    this.isModalVisible = true;
  }

  viewUser(user: User): void {
    // For now, view opens edit modal
    this.openEditModal(user);
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.selectedUser = user;
    // Map user data to form fields
    this.dataUser = {};
    this.formFields.forEach((field) => {
      this.dataUser[field.fieldKey] = (user as any)[field.fieldKey] || '';
    });
    // Don't populate password field in edit mode
    if (this.dataUser['password']) {
      this.dataUser['password'] = '';
    }
    this.isModalVisible = true;
  }

  saveUser(): void {
    // Validation
    if (
      !this.dataUser.username ||
      (!this.isEditMode && !this.dataUser.password)
    ) {
      return;
    }

    this.saving = true;
    const data: any = {
      username: this.dataUser.username,
      fullName: this.dataUser.fullName,
      email: this.dataUser.email,
    };

    if (this.dataUser.password) {
      data.password = this.dataUser.password;
    }

    const request = this.isEditMode
      ? this.http.put(`api/users/${this.selectedUser?.id}`, data)
      : this.http.post('api/users', data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.isModalVisible = false;
        this.loadUsers();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // Confirm dialog
  isConfirmVisible = false;
  userToDelete: User | null = null;

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.isConfirmVisible = true;
  }

  onDeleteConfirmed(): void {
    if (this.userToDelete?.id) {
      this.http.delete(`api/users/${this.userToDelete.id}`).subscribe({
        next: () => {
          this.loadUsers();
          this.userToDelete = null;
        },
      });
    }
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.userToDelete) return '';
    return `Bạn có chắc chắn muốn xóa tài khoản "${this.userToDelete.username}"?`;
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadUsers();
  }
}
