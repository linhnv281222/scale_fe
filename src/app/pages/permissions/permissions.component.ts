import { Component, OnInit } from '@angular/core';
import { User } from '../../models';
import { HttpService } from '../../services/http.service';

interface Function {
  code: string;
  name: string;
}

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css'],
})
export class PermissionsComponent implements OnInit {
  users: User[] = [];
  functions: Function[] = [];
  selectedUserId: number | null = null;
  selectedUserIds: number[] = []; // Multi-select support
  loading = false;
  saving = false;
  searchUser: string = '';

  // Permission map: userId -> functionCode -> boolean
  permissions: { [userId: number]: { [functionCode: string]: boolean } } = {};

  // Available functions (chức năng)
  availableFunctions: Function[] = [
    { code: 'DASHBOARD', name: 'Dashboard' },
    { code: 'LOCATIONS', name: 'Quản lý vị trí' },
    { code: 'SCALES', name: 'Quản lý cân' },
    { code: 'SCALE_MANUFACTURERS', name: 'Quản lý hãng cân' },
    { code: 'PROTOCOLS', name: 'Quản lý giao thức' },
    { code: 'SHIFTS', name: 'Quản lý ca' },
    { code: 'USERS', name: 'Quản lý tài khoản' },
    { code: 'PERMISSIONS', name: 'Quản lý phân quyền' },
    { code: 'CONFIGS', name: 'Quản lý cấu hình' },
    { code: 'SCALE_DATA', name: 'Dữ liệu cân' },
    { code: 'CURRENT_DATA', name: 'Dữ liệu hiện tại' },
    { code: 'SCALE_REPORT', name: 'Báo cáo cân' },
    { code: 'SHIFT_REPORT', name: 'Báo cáo ca' },
    { code: 'EXPORT_TEMPLATE', name: 'Xuất dữ liệu' },
    { code: 'TEMPLATES', name: 'Quản lý biểu mẫu' },
    { code: 'LICENSES', name: 'Quản lý license' },
    { code: 'CONNECTION_STATUS', name: 'Trạng thái kết nối' },
  ];

  constructor(private http: HttpService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    // Load users
    this.http.get<User[]>('api/users', { page: 1, size: 1000 }).subscribe({
      next: (data: any) => {
        this.users = Array.isArray(data) ? data : data?.data || [];
        // Initialize permissions
        this.users.forEach((user) => {
          if (!this.permissions[user.id!]) {
            this.permissions[user.id!] = {};
          }
          this.availableFunctions.forEach((func) => {
            if (!this.permissions[user.id!][func.code]) {
              this.permissions[user.id!][func.code] = false;
            }
          });
        });
        // Load permissions
        this.loadPermissions();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadPermissions(): void {
    this.http.get<any[]>('api/permissions', {}).subscribe({
      next: (data: any) => {
        const permissionList = Array.isArray(data) ? data : data?.data || [];
        // Fill permissions from API
        permissionList.forEach((perm: any) => {
          if (
            this.permissions[perm.userId] &&
            this.permissions[perm.userId].hasOwnProperty(perm.functionCode)
          ) {
            // If any permission is true, set to true
            this.permissions[perm.userId][perm.functionCode] =
              perm.canView ||
              perm.canAdd ||
              perm.canEdit ||
              perm.canDelete ||
              false;
          }
        });
        this.functions = [...this.availableFunctions];
        // Don't auto-select first user - let user choose
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getFilteredUsers(): User[] {
    if (!this.searchUser) return this.users;
    return this.users.filter(
      (user) =>
        user.username?.toLowerCase().includes(this.searchUser.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(this.searchUser.toLowerCase())
    );
  }

  selectUser(userId: number): void {
    // Toggle user selection
    const index = this.selectedUserIds.indexOf(userId);
    if (index > -1) {
      this.selectedUserIds.splice(index, 1);
    } else {
      this.selectedUserIds.push(userId);
    }
    
    // Update selectedUserId for backward compatibility (use first selected)
    if (this.selectedUserIds.length > 0) {
      this.selectedUserId = this.selectedUserIds[0];
      // Ensure permissions object is initialized for all selected users
      this.selectedUserIds.forEach(id => {
        this.ensureUserPermissionsInitialized(id);
      });
    } else {
      this.selectedUserId = null;
    }
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUserIds.includes(userId);
  }

  toggleUserSelection(userId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectUser(userId);
  }

  ensureUserPermissionsInitialized(userId: number): void {
    if (!this.permissions[userId]) {
      this.permissions[userId] = {};
    }
    // Initialize all functions to false if not already set
    this.availableFunctions.forEach((func) => {
      if (!this.permissions[userId].hasOwnProperty(func.code)) {
        this.permissions[userId][func.code] = false;
      }
    });
  }

  onPermissionChange(functionCode: string, checked: boolean): void {
    if (this.selectedUserIds.length === 0) return;

    // Apply permission change to all selected users
    this.selectedUserIds.forEach(userId => {
      // Ensure permissions are initialized
      this.ensureUserPermissionsInitialized(userId);
      // Update permission value
      this.permissions[userId][functionCode] = checked;
    });
  }

  togglePermissionCard(functionCode: string): void {
    if (this.selectedUserIds.length === 0) return;
    
    // Check if all selected users have this permission
    const allHavePermission = this.selectedUserIds.every(userId => {
      this.ensureUserPermissionsInitialized(userId);
      return this.permissions[userId][functionCode] === true;
    });
    
    // Toggle: if all have it, remove from all; otherwise, add to all
    const newValue = !allHavePermission;
    this.onPermissionChange(functionCode, newValue);
  }

  getSelectedUser(): User | null {
    if (!this.selectedUserId) return null;
    return this.users.find((u) => u.id === this.selectedUserId) || null;
  }

  hasPermission(userId: number | null, functionCode: string): boolean {
    if (!userId) {
      return false;
    }
    // Ensure permissions object exists
    if (!this.permissions[userId]) {
      this.permissions[userId] = {};
    }
    // Ensure function code exists
    if (!this.permissions[userId].hasOwnProperty(functionCode)) {
      this.permissions[userId][functionCode] = false;
    }
    return this.permissions[userId][functionCode] || false;
  }

  hasPermissionForSelectedUsers(functionCode: string): boolean {
    if (this.selectedUserIds.length === 0) return false;
    
    // Return true if ALL selected users have this permission
    return this.selectedUserIds.every(userId => {
      return this.hasPermission(userId, functionCode);
    });
  }

  getSelectedUsersCount(): number {
    return this.selectedUserIds.length;
  }

  getSelectedUsersNames(): string {
    if (this.selectedUserIds.length === 0) return '';
    if (this.selectedUserIds.length === 1) {
      const user = this.users.find(u => u.id === this.selectedUserIds[0]);
      return user?.username || '';
    }
    return `${this.selectedUserIds.length} người dùng`;
  }

  clearSelection(): void {
    this.selectedUserIds = [];
    this.selectedUserId = null;
  }

  togglePermission(userId: number, functionCode: string): void {
    if (!this.permissions[userId]) {
      this.permissions[userId] = {};
    }
    this.permissions[userId][functionCode] =
      !this.permissions[userId][functionCode];
  }

  savePermissions(): void {
    if (!this.selectedUserId) return;

    // Static design - just show visual feedback
    this.saving = true;
    setTimeout(() => {
      this.saving = false;
    }, 1000);
  }
}
