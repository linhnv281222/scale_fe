import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Permission } from '../../models';
import { PermissionService } from '../../services/permission.service';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css'],
})
export class PermissionsComponent implements OnInit {
  permissions: Permission[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  isViewMode = false;
  saving = false;
  selectedPermission: Permission | null = null;
  filterData: any = {};

  dataPermission: any = {};

  filterFields: FilterField[] = [
    {
      key: 'name',
      label: 'permissions.name',
      type: 'text',
      placeholder: 'permissions.enterName',
    },
    {
      key: 'resource',
      label: 'permissions.resource',
      type: 'text',
      placeholder: 'permissions.enterResource',
    },
    {
      key: 'action',
      label: 'permissions.action',
      type: 'text',
      placeholder: 'permissions.enterAction',
    },
  ];

  // Confirm delete modal
  isConfirmVisible = false;
  permissionToDelete: Permission | null = null;
  deleting = false;

  constructor(
    private permissionService: PermissionService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  async loadPermissions(): Promise<void> {
    this.loading = true;
    try {
      const permissions = await this.permissionService.getPermissions();
      this.permissions = permissions || [];
      this.total = this.permissions.length;
    } catch (error) {
      this.permissions = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadPermissions();
  }

  onReset(): void {
    this.filterData = {};
    this.loadPermissions();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedPermission = null;
    this.dataPermission = {
      code: '',
      description: '',
    };
    this.isModalVisible = true;
  }

  async viewPermission(permission: Permission): Promise<void> {
    if (!permission.id) {
      return;
    }

    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedPermission = permission;
    this.loading = true;

    try {
      const permissionData = await this.permissionService.getPermissionById(permission.id);

      if (permissionData) {
        this.selectedPermission = permissionData;
        this.dataPermission = {
          code: permissionData.code || permissionData.name || '',
          description: permissionData.description || '',
        };
        this.isModalVisible = true;
      }
    } catch (error) {
      this.toastr.error('Không thể tải dữ liệu quyền');
    } finally {
      this.loading = false;
    }
  }

  async openEditModal(permission: Permission): Promise<void> {
    if (!permission.id) {
      return;
    }

    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedPermission = permission;
    this.loading = true;

    try {
      const permissionData = await this.permissionService.getPermissionById(permission.id);

      if (permissionData) {
        this.selectedPermission = permissionData;
        this.dataPermission = {
          code: permissionData.code || permissionData.name || '',
          description: permissionData.description || '',
        };
        this.isModalVisible = true;
      }
    } catch (error) {
      this.toastr.error('Không thể tải dữ liệu quyền');
    } finally {
      this.loading = false;
    }
  }

  async savePermission(): Promise<void> {
    if (!this.dataPermission.code) {
      return;
    }

    this.saving = true;
    try {
      let result: { success: boolean; data?: Permission };

      if (this.isEditMode) {
        result = await this.permissionService.updatePermission(
          this.selectedPermission?.id!,
          {
            code: this.dataPermission.code,
            description: this.dataPermission.description,
          }
        );
      } else {
        result = await this.permissionService.createPermission({
          code: this.dataPermission.code,
          description: this.dataPermission.description,
        });
      }

      if (result.success) {
        this.toastr.success('Thành công');
        this.isModalVisible = false;
        await this.loadPermissions();
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

  confirmDelete(permission: Permission): void {
    this.permissionToDelete = permission;
    this.isConfirmVisible = true;
  }

  async onDeleteConfirmed(): Promise<void> {
    if (!this.permissionToDelete?.id) {
      return;
    }

    this.deleting = true;
    try {
      const success = await this.permissionService.deletePermission(this.permissionToDelete.id);
      if (success) {
        this.toastr.success('Xóa quyền thành công');
        this.isConfirmVisible = false;
        this.permissionToDelete = null;
        await this.loadPermissions();
      } else {
        this.toastr.error('Xóa quyền thất bại');
      }
    } catch (error) {
      this.toastr.error('Xóa quyền thất bại');
    } finally {
      this.deleting = false;
    }
  }

  get deleteMessage(): string {
    if (!this.permissionToDelete) return '';
    return `Bạn có chắc chắn muốn xóa quyền "${this.permissionToDelete.name || this.permissionToDelete.code}"?`;
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadPermissions();
  }
}
