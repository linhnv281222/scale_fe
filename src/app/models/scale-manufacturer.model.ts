export interface ScaleManufacturer {
  id?: number;
  code: string;
  name: string;
  country?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
