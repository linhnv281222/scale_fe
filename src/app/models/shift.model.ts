export interface Shift {
  id?: number;
  code?: string;
  name: string;
  start_time?: string; // HH:mm:ss format from API
  end_time?: string; // HH:mm:ss format from API
  is_active?: boolean;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  // For backward compatibility and display
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
  status?: 'active' | 'inactive';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
