import { Role } from './role.model';

export interface User {
  id?: number;
  username: string;
  password?: string;
  fullName?: string;
  status?: number; // 0 = inactive, 1 = active
  roles?: Role[];
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
