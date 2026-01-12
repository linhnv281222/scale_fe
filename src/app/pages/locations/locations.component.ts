import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Location } from '../../models';
import { ConfigService } from '../../services/config.service';
import { LocationService } from '../../services/location.service';
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
  locations: Location[] = [];
  flatLocations: Location[] = [];
  loading = false;
  // Pagination removed - tree structure doesn't need pagination
  // pageIndex = 1;
  // pageSize = 20;
  total = 0;
  isModalVisible = false;
  isEditMode = false;
  isViewMode = false;
  saving = false;
  selectedLocation: Location | null = null;
  parentLocations: Location[] = [];
  filterData: any = {};
  expandedIds: Set<number> = new Set();

  formFields: DynamicFormField[] = [];
  tableColumns: DynamicTableColumn[] = [];
  loadingConfigs = false;

  dataLocation: any = {};

  filterFields: FilterField[] = [
    {
      key: 'code',
      label: 'locations.code',
      type: 'text',
      placeholder: 'locations.enterCode',
    },
    {
      key: 'parentId',
      label: 'locations.parent',
      type: 'select',
      placeholder: 'locations.selectParent',
      options: [],
    },
  ];

  constructor(
    private locationService: LocationService,
    private configService: ConfigService,
    private pageActionService: PageActionService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // this.loadConfigs();
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

  // Helper method to check if required field is empty
  isRequiredFieldEmpty(value: any): boolean {
    if (typeof value === 'number') {
      return value === null || value === undefined;
    }
    return value === null || value === undefined || value === '';
  }

  async loadLocations(): Promise<void> {
    this.loading = true;
    try {
      const params: any = {};

      const hasFilters = this.filterData.code || this.filterData.parentId;

      if (hasFilters) {
        if (this.filterData.code) {
          params.code = this.filterData.code;
        }
        if (this.filterData.parentId) {
          params.parentId = this.filterData.parentId;
        }
        if (this.filterData.sort) {
          params.sort = this.filterData.sort;
        }
      }

      const response = await this.locationService.getLocations(params);

      if (response && response.data) {
        // Check if it's tree structure (has children property)
        if (
          response.data.length > 0 &&
          response.data[0].children !== undefined
        ) {
          // Tree structure (no pagination)
          this.locations = response.data;
          this.total = this.countAllNodes(response.data);
        } else {
          // Flat array - build tree from flat list
          const allItems = response.data;
          const rootItems = allItems.filter(
            (item) => !item.parent_id && !item.parentId
          );
          this.locations = this.buildTreeFromFlat(allItems, rootItems);
          this.total = response.total ?? response.total_elements ?? allItems.length;
        }
      } else {
        this.locations = [];
        this.total = 0;
      }

      this.expandedIds.clear();
      this.locations.forEach((item) => {
        if (item.id && item.children && item.children.length > 0) {
          this.expandedIds.add(item.id);
        }
      });
      this.flattenLocations();
      this.loadParentLocations();
    } catch (error) {
      this.toastr.error('Có lỗi xảy ra vui lòng thử lại');
      this.locations = [];
      this.total = 0;
    } finally {
      this.loading = false;
    }
  }

  private buildTreeFromFlat(
    allItems: Location[],
    rootItems: Location[]
  ): Location[] {
    const buildChildren = (parentId: number): Location[] => {
      return allItems
        .filter(
          (item) => item.parent_id === parentId || item.parentId === parentId
        )
        .map((item) => ({
          ...item,
          children: buildChildren(item.id!),
        }));
    };

    return rootItems.map((item) => ({
      ...item,
      children: buildChildren(item.id!),
    }));
  }

  private countAllNodes(items: Location[]): number {
    let count = 0;
    const countNodes = (nodes: Location[]) => {
      nodes.forEach((node) => {
        count++;
        if (node.children && node.children.length > 0) {
          countNodes(node.children);
        }
      });
    };
    countNodes(items);
    return count;
  }

  loadParentLocations(): void {
    const allLocations: Location[] = [];
    const flatten = (items: Location[]) => {
      items.forEach((item) => {
        allLocations.push(item);
        if (item.children && item.children.length > 0) {
          flatten(item.children);
        }
      });
    };
    flatten(this.locations);
    this.parentLocations = allLocations;

    const parentField = this.filterFields.find((f) => f.key === 'parentId');
    if (parentField) {
      parentField.options = allLocations.map((loc) => ({
        label: loc.name || '',
        value: loc.id,
      }));
    }
  }

  flattenLocations(): void {
    this.flatLocations = [];
    const pathIsLast: boolean[] = [];

    const buildFlat = (
      items: Location[],
      level: number = 0,
      parent?: Location
    ) => {
      items.forEach((item, index) => {
        const isLastChild = index === items.length - 1;

        if (level < pathIsLast.length) {
          pathIsLast[level] = isLastChild;
        } else {
          pathIsLast.push(isLastChild);
        }

        const levelIsLast: boolean[] = [];
        for (let i = 0; i < level; i++) {
          levelIsLast.push(pathIsLast[i] || false);
        }

        if (item.parent_id && !item.parentId) {
          item.parentId = item.parent_id;
        }

        const hasChildren = !!(item.children && item.children.length > 0);
        const locationWithMeta: any = {
          ...item,
          children: item.children,
          level,
          parent,
          hasChildren: hasChildren,
          isLast: isLastChild,
          levelIsLast: levelIsLast,
        };
        this.flatLocations.push(locationWithMeta);

        if (hasChildren && this.expandedIds.has(item.id!)) {
          buildFlat(item.children || [], level + 1, item);
        }
      });
    };
    buildFlat(this.locations);
  }

  toggleExpand(location: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const locationId = location.id;
    if (!locationId) {
      console.warn('Location ID not found');
      return;
    }

    if (this.expandedIds.has(locationId)) {
      this.expandedIds.delete(locationId);
    } else {
      this.expandedIds.add(locationId);
    }

    this.flattenLocations();
    this.cdr.detectChanges();
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
      return parent?.name ?? '';
    }
    return '';
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
    this.loadLocations();
  }

  onReset(): void {
    this.filterData = {};
    this.loadLocations();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedLocation = null;
    this.loadParentLocations();
    this.dataLocation = {
      code: '',
      name: '',
      parentId: null,
    };
    this.isModalVisible = true;
  }

  async openEditModal(location: Location): Promise<void> {
    if (!location.id) {
      return;
    }

    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedLocation = location;
    this.loading = true;

    try {
      // Gọi API GET để lấy data mới nhất
      const locationData = await this.locationService.getLocationById(
        location.id
      );

      if (locationData) {
        this.selectedLocation = locationData;

        // Filter parentLocations để loại trừ chính location đó và các children
        const allLocations: Location[] = [];
        const flatten = (items: Location[]) => {
          items.forEach((item) => {
            if (
              item.id !== locationData.id &&
              !this.isDescendant(locationData.id!, item)
            ) {
              allLocations.push(item);
            }
            if (item.children && item.children.length > 0) {
              flatten(item.children);
            }
          });
        };
        flatten(this.locations);
        this.parentLocations = allLocations;

        this.dataLocation = {
          code: locationData.code,
          name: locationData.name,
          parentId: locationData.parentId || locationData.parent_id || null,
        };
        this.isModalVisible = true;
      }
    } catch (error) {
      this.toastr.error('Không thể tải dữ liệu vị trí');
    } finally {
      this.loading = false;
    }
  }

  private isDescendant(parentId: number, location: Location): boolean {
    if (location.parentId === parentId || location.parent_id === parentId) {
      return true;
    }
    // Check recursively in children
    if (location.children && location.children.length > 0) {
      return location.children.some((child) =>
        this.isDescendant(parentId, child)
      );
    }
    return false;
  }

  async saveLocation(): Promise<void> {
    // Validation
    if (!this.dataLocation.name || !this.dataLocation.code) {
      return;
    }

    this.saving = true;
    try {
      let result: { success: boolean; data?: Location };

      if (this.isEditMode) {
        const data: { name: string; parentId?: number } = {
          name: this.dataLocation.name,
        };
        if (this.dataLocation.parentId) {
          data.parentId = this.dataLocation.parentId;
        }
        result = await this.locationService.updateLocation(
          this.selectedLocation?.id!,
          data
        );
      } else {
        const createData: { code: string; name: string; parentId?: number } = {
          code: this.dataLocation.code,
          name: this.dataLocation.name,
        };
        if (this.dataLocation.parentId) {
          createData.parentId = this.dataLocation.parentId;
        }
        result = await this.locationService.createLocation(createData);
      }

      if (result.success) {
        this.toastr.success('Thành công');
        this.isModalVisible = false;
        await this.loadLocations();
      } else {
        this.toastr.error('Thất bại');
      }
    } catch (error) {
      this.toastr.error('Thất bại');
    } finally {
      this.saving = false;
    }
  }

  async viewLocation(location: Location): Promise<void> {
    if (!location.id) {
      return;
    }

    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedLocation = location;
    this.loading = true;

    try {
      const locationData = await this.locationService.getLocationById(
        location.id
      );

      if (locationData) {
        this.selectedLocation = locationData;

        const allLocations: Location[] = [];
        const flatten = (items: Location[]) => {
          items.forEach((item) => {
            if (
              item.id !== locationData.id &&
              !this.isDescendant(locationData.id!, item)
            ) {
              allLocations.push(item);
            }
            if (item.children && item.children.length > 0) {
              flatten(item.children);
            }
          });
        };
        flatten(this.locations);
        this.parentLocations = allLocations;

        this.dataLocation = {
          code: locationData.code,
          name: locationData.name,
          parentId: locationData.parentId || locationData.parent_id || null,
        };
        this.isModalVisible = true;
      }
    } catch (error) {
      this.toastr.error('Không thể tải dữ liệu vị trí');
    } finally {
      this.loading = false;
    }
  }

  closeViewModal(): void {
    this.isModalVisible = false;
    this.isViewMode = false;
  }

  // Confirm delete modal
  isConfirmVisible = false;
  locationToDelete: Location | null = null;
  deleting = false;

  confirmDelete(location: Location): void {
    this.locationToDelete = location;
    this.isConfirmVisible = true;
  }

  async onDeleteConfirmed(): Promise<void> {
    if (!this.locationToDelete?.id) {
      return;
    }

    this.deleting = true;
    try {
      const success = await this.locationService.deleteLocation(
        this.locationToDelete.id
      );
      if (success) {
        this.toastr.success('Xóa vị trí thành công');
        this.isConfirmVisible = false;
        this.locationToDelete = null;
        await this.loadLocations();
      }
    } catch (error) {
    } finally {
      this.deleting = false;
    }
  }

  // Getter for delete message
  get deleteMessage(): string {
    if (!this.locationToDelete) return '';
    return `Bạn có chắc chắn muốn xóa vị trí "${this.locationToDelete.name}"?`;
  }

  // Pagination methods removed - tree structure doesn't need pagination
  // onPaginationChange(event: { page: number; size: number }): void {
  //   this.pageIndex = event.page;
  //   this.pageSize = event.size;
  //   this.loadLocations();
  // }

  // onPageIndexChange(page: number): void {
  //   this.pageIndex = page;
  //   this.loadLocations();
  // }

  // onPageSizeChange(size: number): void {
  //   this.pageSize = size;
  //   this.pageIndex = 1;
  //   this.loadLocations();
  // }
}
