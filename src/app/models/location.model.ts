export interface Location {
  id?: number;
  code: string;
  name: string;
  description?: string;
  parent_id?: number; // API response uses snake_case
  parentId?: number; // For compatibility
  parent?: Location;
  children?: Location[];
  created_at?: string; // ISO date-time string from API
  created_by?: string;
  updated_at?: string; // ISO date-time string from API
  updated_by?: string;
  type?: string; // Nhà máy, Khu vực, Dây chuyền, Trạm cân (for display)
  status?: 'active' | 'paused' | 'inactive';
  level?: number; // For hierarchical display
  hasChildren?: boolean; // For tree display
  isLast?: boolean; // Is last child in parent's children
  levelIsLast?: boolean[]; // Array indicating if each level in path is last (for line drawing)
  createdAt?: Date; // Computed from created_at
  updatedAt?: Date; // Computed from updated_at
}
