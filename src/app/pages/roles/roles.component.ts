import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Permission, Role } from '../../models';
import { PermissionService } from '../../services/permission.service';
import { RoleService } from '../../services/role.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css'],
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  permissions: Permission[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  isViewMode = false;
  saving = false;
  selectedRole: Role | null = null;
  filterData: any = {};
  sidebarVisible = true;
  sidebarSize = 260; // Pixel

  dataRole: any = {
    name: '',
    code: '',
    permissionIds: [],
  };

  filterFields: FilterField[] = [
    {
      key: 'name',
      label: 'roles.name',
      type: 'text',
      placeholder: 'roles.enterName',
    },
    {
      key: 'code',
      label: 'roles.code',
      type: 'text',
      placeholder: 'roles.enterCode',
    },
  ];

  // Confirm delete modal
  isConfirmVisible = false;
  roleToDelete: Role | null = null;
  deleting = false;

  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  async loadRoles(): Promise<void> {
    this.loading = true;
    try {
      // Build query params with pagination
      const params: any = {
        page: this.pageIndex - 1, // API uses 0-indexed
        size: this.pageSize,
      };

      // Add filter params
      if (this.filterData.name) {
        params.name = this.filterData.name;
      }
      if (this.filterData.code) {
        params.code = this.filterData.code;
      }

      const result = await this.roleService.getRoles(params);
      this.roles = result.data || [];
      this.total = result.total || 0;
    } catch (error) {
      this.roles = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  }

  async loadPermissions(): Promise<void> {
    try {
      const result = await this.permissionService.getPermissions();
      this.permissions = result.data || [];
    } catch (error) {
      this.permissions = [];
    }
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadRoles();
  }

  onReset(): void {
    this.filterData = {};
    this.loadRoles();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedRole = null;
    this.dataRole = {
      name: '',
      code: '',
      permissionIds: [],
    };
    this.isModalVisible = true;
  }

  async viewRole(role: Role): Promise<void> {
    if (!role.id) {
      return;
    }

    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedRole = role;
    this.loading = true;

    try {
      const roleData = await this.roleService.getRoleById(role.id);

      if (roleData) {
        this.selectedRole = roleData;
        this.dataRole = {
          name: roleData.name,
          code: roleData.code,
          permissionIds:
            roleData.permissions
              ?.map((p) => p.id)
              .filter((id) => id !== undefined) || [],
        };
        this.isModalVisible = true;
      }
    } catch (error) {
      this.toastr.error('Không thể tải dữ liệu vai trò');
    } finally {
      this.loading = false;
    }
  }

  async openEditModal(role: Role): Promise<void> {
    if (!role.id) {
      return;
    }

    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedRole = role;
    this.loading = true;

    try {
      const roleData = await this.roleService.getRoleById(role.id);

      if (roleData) {
        this.selectedRole = roleData;
        this.dataRole = {
          name: roleData.name,
          code: roleData.code,
          permissionIds:
            roleData.permissions
              ?.map((p) => p.id)
              .filter((id) => id !== undefined) || [],
        };
        this.isModalVisible = true;
      }
    } catch (error) {
      this.toastr.error('Không thể tải dữ liệu vai trò');
    } finally {
      this.loading = false;
    }
  }

  togglePermission(permissionId: number): void {
    if (this.isViewMode) return;
    const index = this.dataRole.permissionIds.indexOf(permissionId);
    if (index > -1) {
      this.dataRole.permissionIds.splice(index, 1);
    } else {
      this.dataRole.permissionIds.push(permissionId);
    }
  }

  isPermissionSelected(permissionId: number): boolean {
    return this.dataRole.permissionIds.includes(permissionId);
  }

  get selectedPermissionsCount(): number {
    return this.dataRole.permissionIds.length;
  }

  async saveRole(): Promise<void> {
    if (!this.dataRole.name || !this.dataRole.code) {
      return;
    }

    this.saving = true;
    try {
      let result: { success: boolean; data?: Role };

      const data = {
        name: this.dataRole.name,
        code: this.dataRole.code,
        permissionIds: this.dataRole.permissionIds,
      };

      if (this.isEditMode) {
        result = await this.roleService.updateRole(this.selectedRole?.id!, data);
      } else {
        result = await this.roleService.createRole(data);
      }

      if (result.success) {
        this.toastr.success('Thành công');
        this.isModalVisible = false;
        await this.loadRoles();
      } else {
        this.toastr.error('Thất bại');
      }
    } catch (error) {
      this.toastr.error('Thất bại');
    } finally {
      this.saving = false;
    }
  }

  closeViewModal(): void {
    this.isModalVisible = false;
    this.isViewMode = false;
  }

  confirmDelete(role: Role): void {
    this.roleToDelete = role;
    this.isConfirmVisible = true;
  }

  async onDeleteConfirmed(): Promise<void> {
    if (!this.roleToDelete?.id) {
      return;
    }

    this.deleting = true;
    try {
      const success = await this.roleService.deleteRole(this.roleToDelete.id);
      if (success) {
        this.toastr.success('Xóa vai trò thành công');
        this.isConfirmVisible = false;
        this.roleToDelete = null;
        await this.loadRoles();
      } else {
        this.toastr.error('Xóa vai trò thất bại');
      }
    } catch (error) {
      this.toastr.error('Xóa vai trò thất bại');
    } finally {
      this.deleting = false;
    }
  }

  get deleteMessage(): string {
    if (!this.roleToDelete) return '';
    return `Bạn có chắc chắn muốn xóa vai trò "${this.roleToDelete.name}"?`;
  }

  getPermissionDescription(permission: Permission): string {
    if (permission.description) {
      return permission.description;
    }
    if (permission.name) {
      return permission.name;
    }
    return permission.code;
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadRoles();
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
