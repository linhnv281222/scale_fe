import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Location } from '../../models';
import { ConfigService } from '../../services/config.service';
import { HttpService } from '../../services/http.service';
import { PageActionService } from '../../services/page-action.service';
import { DynamicFormField } from '../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicTableColumn } from '../../shared/components/dynamic-table/dynamic-table.component';
import { FilterField } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-locations',
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.css'],
})
export class LocationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  Math = Math; // Expose Math to template
  locations: Location[] = [];
  flatLocations: Location[] = [];
  treeData: any[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  saving = false;
  selectedLocation: Location | null = null;
  parentLocations: Location[] = [];
  filterData: any = {};
  expandedIds: Set<number> = new Set(); // Track expanded nodes

  // Dynamic form and table
  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  // Form data object
  dataLocation: any = {};

  filterFields: FilterField[] = [
    {
      key: 'name',
      label: 'locations.name',
      type: 'text',
      placeholder: 'locations.enterName',
    },
    {
      key: 'code',
      label: 'locations.code',
      type: 'text',
      placeholder: 'locations.enterCode',
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
    {
      key: 'dateCreated',
      label: 'table.dateCreated',
      type: 'dateRange',
      placeholder: 'filter.dateFormat',
    },
  ];

  constructor(
    private http: HttpService,
    private configService: ConfigService,
    private pageActionService: PageActionService
  ) {}

  ngOnInit(): void {
    this.loadConfigs();
    this.loadLocations();
    this.pageActionService.addNew$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.openAddModal();
      });
  }

  loadConfigs(): void {
    this.loadingConfigs = true;
    this.configService.getModuleFields('locations').subscribe({
      next: (fields) => {
        this.formFields = fields;
        this.loadingConfigs = false;
      },
      error: () => {
        this.formFields = [];
        this.loadingConfigs = false;
      },
    });

    this.configService.getModuleColumns('locations').subscribe({
      next: (columns) => {
        this.tableColumns = columns;
      },
      error: () => {
        this.tableColumns = [];
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLocations(): void {
    this.loading = true;
    this.http
      .get<Location[]>('api/locations', {
        page: this.pageIndex,
        size: this.pageSize,
        ...this.filterData,
      })
      .subscribe({
        next: (data: any) => {
          this.locations = Array.isArray(data) ? data : data?.data || [];
          this.total = data?.total || this.locations.length;
          this.buildTreeData();
          this.flattenLocations();
          this.loadParentLocations();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  loadParentLocations(): void {
    // Load tất cả locations để có thể chọn làm parent
    // Khi edit, sẽ filter để loại trừ chính location đó và children
    this.parentLocations = [...this.locations];
  }

  buildTreeData(): void {
    this.treeData = this.buildTree(this.locations);
  }

  buildTree(items: Location[], parentId?: number): any[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        title: item.name,
        key: item.id,
        children: this.buildTree(items, item.id),
      }));
  }

  flattenLocations(): void {
    this.flatLocations = [];
    const pathIsLast: boolean[] = []; // Track if each level in path is last

    const buildFlat = (
      items: Location[],
      parentId?: number,
      level: number = 0,
      parent?: Location
    ) => {
      const children = items.filter((item) => item.parentId === parentId);
      children.forEach((item, index) => {
        const isLastChild = index === children.length - 1;

        // Update path tracking
        if (level < pathIsLast.length) {
          pathIsLast[level] = isLastChild;
        } else {
          pathIsLast.push(isLastChild);
        }

        // Create array of isLast flags for each level up to current
        const levelIsLast: boolean[] = [];
        for (let i = 0; i < level; i++) {
          levelIsLast.push(pathIsLast[i] || false);
        }

        const locationWithMeta = {
          ...item,
          level,
          parent,
          hasChildren: items.some((child) => child.parentId === item.id),
          isLast: isLastChild,
          levelIsLast: levelIsLast, // Array indicating if each level is last
        };
        this.flatLocations.push(locationWithMeta);

        // Only include children if this item is expanded or it's root level
        if (level === 0 || this.expandedIds.has(item.id!)) {
          buildFlat(items, item.id, level + 1, item);
        }
      });
    };
    buildFlat(this.locations);
  }

  toggleExpand(location: Location, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (location.id) {
      if (this.expandedIds.has(location.id)) {
        this.expandedIds.delete(location.id);
        // Also collapse all descendants
        this.collapseDescendants(location.id);
      } else {
        this.expandedIds.add(location.id);
      }
      this.flattenLocations();
    }
  }

  collapseDescendants(parentId: number): void {
    const children = this.locations.filter((loc) => loc.parentId === parentId);
    children.forEach((child) => {
      if (child.id) {
        this.expandedIds.delete(child.id);
        this.collapseDescendants(child.id);
      }
    });
  }

  hasChildren(locationId: number): boolean {
    return this.locations.some((loc) => loc.parentId === locationId);
  }

  getLocationIcon(type?: string): string {
    switch (type) {
      case 'Nhà máy':
        return 'home';
      case 'Khu vực':
        return 'appstore';
      case 'Dây chuyền':
        return 'apartment';
      case 'Trạm cân':
        return 'gold';
      default:
        return 'environment';
    }
  }

  getParentName(location: Location): string {
    if (location.parent) {
      return location.parent.name;
    }
    if (location.parentId) {
      const parent = this.locations.find((l) => l.id === location.parentId);
      return parent?.name || '-';
    }
    return '-';
  }

  getLevelIndices(level: number): number[] {
    return Array.from({ length: level }, (_, i) => i);
  }

  isLevelLast(location: Location, levelIndex: number): boolean {
    if (!location.levelIsLast || levelIndex >= location.levelIsLast.length) {
      return false;
    }
    return location.levelIsLast[levelIndex];
  }

  onSearch(filters: any): void {
    this.filterData = filters;
    this.pageIndex = 1;
    this.loadLocations();
  }

  onReset(): void {
    this.filterData = {};
    this.loadLocations();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedLocation = null;
    // Load tất cả locations để có thể chọn làm parent
    this.loadParentLocations();
    this.dataLocation = {};
    this.formFields.forEach((field) => {
      this.dataLocation[field.fieldKey] = '';
    });
    this.dataLocation.status = 'active';
    this.isModalVisible = true;
  }

  openEditModal(location: Location): void {
    this.isEditMode = true;
    this.selectedLocation = location;

    // Filter parentLocations để loại trừ chính location đó và các children
    this.parentLocations = this.locations.filter((loc) => {
      if (loc.id === location.id) return false;
      // Loại trừ các children (recursive check)
      return !this.isDescendant(location.id!, loc);
    });

    this.dataLocation = {};
    this.formFields.forEach((field) => {
      this.dataLocation[field.fieldKey] =
        (location as any)[field.fieldKey] || '';
    });
    this.isModalVisible = true;
  }

  private isDescendant(parentId: number, location: Location): boolean {
    if (location.parentId === parentId) return true;
    const parent = this.locations.find((l) => l.id === location.parentId);
    if (!parent) return false;
    return this.isDescendant(parentId, parent);
  }

  saveLocation(): void {
    // Validation
    if (!this.dataLocation.name || !this.dataLocation.code) {
      return;
    }

    this.saving = true;
    const data: any = { ...this.dataLocation };

    // Remove null/undefined values
    if (!data.type) {
      delete data.type;
    }

    if (!data.parentId) {
      delete data.parentId;
    }

    const request = this.isEditMode
      ? this.http.put(`api/locations/${this.selectedLocation?.id}`, data)
      : this.http.post('api/locations', data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.isModalVisible = false;
        this.loadLocations();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  viewLocation(location: Location): void {
    // Mở modal xem chi tiết hoặc có thể mở edit modal ở chế độ readonly
    this.openEditModal(location);
  }

  // Confirm dialog
  isConfirmVisible = false;
  locationToDelete: Location | null = null;

  confirmDelete(location: Location): void {
    this.locationToDelete = location;
    this.isConfirmVisible = true;
  }

  onDeleteConfirmed(): void {
    if (this.locationToDelete?.id) {
      this.http.delete(`api/locations/${this.locationToDelete.id}`).subscribe({
        next: () => {
          this.loadLocations();
          this.locationToDelete = null;
        },
      });
    }
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.locationToDelete) return '';
    return `Bạn có chắc chắn muốn xóa vị trí "${this.locationToDelete.name}"?`;
  }

  onTreeNodeClick(event: any): void {
    // Handle tree node click
  }

  onPaginationChange(event: { page: number; size: number }): void {
    this.pageIndex = event.page;
    this.pageSize = event.size;
    this.loadLocations();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadLocations();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadLocations();
  }
}
