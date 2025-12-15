export interface Protocol {
  id?: number;
  name: string;
  code: string;
  type: string; // MODBUS_TCP, MODBUS_RTU, SABUS
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
