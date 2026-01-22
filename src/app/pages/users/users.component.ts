import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Role, User } from '../../models';
import { RoleService } from '../../services/role.service';
import { UserService } from '../../services/user.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  roles: Role[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  isViewMode = false;
  saving = false;
  selectedUser: User | null = null;
  filterData: any = {};
  sidebarVisible = true;
  sidebarSize = 260; // Pixel

  // Form data
  dataUser: any = {
    username: '',
    password: '',
    fullName: '',
    status: 1, // Default active
    roleIds: [],
  };

  filterFields: FilterField[] = [
    {
      key: 'username',
      label: 'users.username',
      type: 'text',
      placeholder: 'users.enterUsername',
    },
    {
      key: 'fullName',
      label: 'users.fullName',
      type: 'text',
      placeholder: 'users.enterFullName',
    },
    {
      key: 'status',
      label: 'common.status',
      type: 'select',
      placeholder: 'common.selectStatus',
      options: [
        { label: 'common.active', value: 1 },
        { label: 'common.inactive', value: 0 },
      ],
    },
  ];

  // Confirm delete modal
  isConfirmVisible = false;
  userToDelete: User | null = null;
  deleting = false;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  async loadRoles(): Promise<void> {
    try {
      const result = await this.roleService.getRoles();
      this.roles = result.data || [];
    } catch (error) {
      this.roles = [];
    }
  }

  async loadUsers(): Promise<void> {
    this.loading = true;
    try {
      // Build query params with pagination
      const params: any = {
        page: this.pageIndex - 1, // API uses 0-indexed
        size: this.pageSize,
      };

      // Add filter params
      if (this.filterData.username) {
        params.username = this.filterData.username;
      }
      if (this.filterData.fullName) {
        params.fullName = this.filterData.fullName;
      }
      if (this.filterData.status !== undefined && this.filterData.status !== null && this.filterData.status !== '') {
        params.status = this.filterData.status;
      }

      const result = await this.userService.getUsers(params);
      this.users = result.data || [];
      this.total = result.total || 0;
    } catch (error) {
      this.users = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
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
    this.isViewMode = false;
    this.selectedUser = null;
    this.dataUser = {
      username: '',
      password: '',
      fullName: '',
      status: 1,
      roleIds: [],
    };
    this.isModalVisible = true;
  }

  async viewUser(user: User): Promise<void> {
    if (!user.id) {
      return;
    }

    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedUser = user;
    this.loading = true;

    try {
      const userData = await this.userService.getUserById(user.id);

      if (userData) {
        this.selectedUser = userData;
        this.dataUser = {
          username: userData.username || '',
          fullName: userData.fullName || '',
          status: userData.status !== undefined ? userData.status : 1,
          roleIds: userData.roles
            ? userData.roles.map((r) => r.id).filter((id): id is number => !!id)
            : [],
        };
        this.isModalVisible = true;
      }
    } catch (error) {
      this.toastr.error('Không thể tải dữ liệu người dùng');
    } finally {
      this.loading = false;
    }
  }

  async openEditModal(user: User): Promise<void> {
    if (!user.id) {
      return;
    }

    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedUser = user;
    this.loading = true;

    try {
      const userData = await this.userService.getUserById(user.id);

      if (userData) {
        this.selectedUser = userData;
        this.dataUser = {
          username: userData.username || '',
          fullName: userData.fullName || '',
          status: userData.status !== undefined ? userData.status : 1,
          roleIds: userData.roles
            ? userData.roles.map((r) => r.id).filter((id): id is number => !!id)
            : [],
        };
        this.isModalVisible = true;
      }
    } catch (error) {
      this.toastr.error('Không thể tải dữ liệu người dùng');
    } finally {
      this.loading = false;
    }
  }

  async saveUser(): Promise<void> {
    if (!this.dataUser.username) {
      this.toastr.warning('Vui lòng nhập tên đăng nhập');
      return;
    }

    if (!this.isEditMode && !this.dataUser.password) {
      this.toastr.warning('Vui lòng nhập mật khẩu');
      return;
    }

    this.saving = true;
    try {
      if (this.isEditMode) {
        // Update user info (username cannot be changed)
        const updateData: any = {
          fullName: this.dataUser.fullName,
          status: this.dataUser.status !== undefined ? this.dataUser.status : 1,
        };

        const updatedUser = await this.userService.updateUser(
          this.selectedUser?.id!,
          updateData
        );

        if (updatedUser) {
          // Update roles separately
          if (this.dataUser.roleIds && Array.isArray(this.dataUser.roleIds)) {
            await this.userService.updateUserRoles(
              this.selectedUser?.id!,
              this.dataUser.roleIds
            );
          }
          this.toastr.success('Cập nhật người dùng thành công');
          this.isModalVisible = false;
          await this.loadUsers();
        } else {
          this.toastr.error('Cập nhật người dùng thất bại');
        }
      } else {
        // Create new user
        const createData = {
          username: this.dataUser.username,
          password: this.dataUser.password,
          fullName: this.dataUser.fullName,
          status: this.dataUser.status !== undefined ? this.dataUser.status : 1,
          roleIds: this.dataUser.roleIds || [],
        };

        const newUser = await this.userService.createUser(createData);

        if (newUser) {
          this.toastr.success('Tạo người dùng thành công');
          this.isModalVisible = false;
          await this.loadUsers();
        } else {
          this.toastr.error('Tạo người dùng thất bại');
        }
      }
    } catch (error) {
      this.toastr.error('Có lỗi xảy ra');
    } finally {
      this.saving = false;
    }
  }

  closeViewModal(): void {
    this.isModalVisible = false;
    this.isViewMode = false;
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.isConfirmVisible = true;
  }

  async onDeleteConfirmed(): Promise<void> {
    if (!this.userToDelete?.id) {
      return;
    }

    this.deleting = true;
    try {
      const success = await this.userService.deleteUser(this.userToDelete.id);
      if (success) {
        this.toastr.success('Xóa người dùng thành công');
        this.isConfirmVisible = false;
        this.userToDelete = null;
        await this.loadUsers();
      } else {
        this.toastr.error('Xóa người dùng thất bại');
      }
    } catch (error) {
      this.toastr.error('Xóa người dùng thất bại');
    } finally {
      this.deleting = false;
    }
  }

  get deleteMessage(): string {
    if (!this.userToDelete) return '';
    return `Bạn có chắc chắn muốn xóa tài khoản "${this.userToDelete.username}"?`;
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadUsers();
  }

  getRoleNames(user: User): string {
    if (!user.roles || user.roles.length === 0) {
      return '-';
    }
    return user.roles.map((r) => r.name || r.code).join(', ');
  }

  getStatusLabel(status: number | undefined): string {
    if (status === undefined || status === null) {
      return '-';
    }
    return status === 1 ? 'common.active' : 'common.inactive';
  }

  getStatusClass(status: number | undefined): string {
    if (status === undefined || status === null) {
      return 'text-sm text-gray-500 dark:text-gray-400';
    }
    return status === 1
      ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
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
