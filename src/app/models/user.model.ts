export interface User {
  id?: number;
  username: string;
  password?: string;
  fullName?: string;
  email?: string;
  status?: 'active' | 'inactive';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
