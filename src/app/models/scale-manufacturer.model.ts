export interface ScaleManufacturer {
  id?: number;
  name: string;
  code: string;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
