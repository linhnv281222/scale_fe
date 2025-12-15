export interface Location {
  id?: number;
  name: string;
  code: string;
  type?: string; // Nhà máy, Khu vực, Dây chuyền, Trạm cân
  status?: 'active' | 'paused' | 'inactive';
  parentId?: number;
  parent?: Location;
  children?: Location[];
  level?: number; // For hierarchical display
  hasChildren?: boolean; // For tree display
  isLast?: boolean; // Is last child in parent's children
  levelIsLast?: boolean[]; // Array indicating if each level in path is last (for line drawing)
  createdAt?: Date;
  updatedAt?: Date;
}
