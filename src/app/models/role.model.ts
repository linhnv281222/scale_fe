import { Permission } from './permission.model';

export interface Role {
  id?: number;
  name: string;
  code: string;
  permissions?: Permission[];
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

