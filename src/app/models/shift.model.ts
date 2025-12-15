export interface Shift {
  id?: number;
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status?: 'active' | 'inactive';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
