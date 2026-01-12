export interface Protocol {
  id?: number;
  name: string;
  code: string;
  type?: string; // MODBUS_TCP, MODBUS_RTU, SABUS (legacy)
  connection_type?: string; // TCP, RTU (from API)
  description?: string;
  default_port?: number;
  default_baud_rate?: number;
  is_active?: boolean;
  config_template?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
